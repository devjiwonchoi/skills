import { isDeepStrictEqual } from "node:util";

import * as z from "zod";

import * as impl from "./impl/schema.ts";
import { create as implementation } from "./impl/state.ts";
import { apply as implement } from "./impl/validate.ts";
import * as review from "./review/schema.ts";
import { create as reviewState, context, reconcile } from "./review/state.ts";
import { apply as reviewEvent } from "./review/validate.ts";

const text = z.string().regex(/\S/, "expected a nonempty string");
const metadata = {
  seq: z.int().positive(),
  version: z.int().positive(),
  at: z.iso.datetime().optional(),
};
const base = z.strictObject({ id: text });
const strings = z
  .array(text)
  .refine((values) => new Set(values).size === values.length, "duplicate ID");
const scope = review.scope;

const start = base
  .extend({
    type: z.literal("start"),
    goal: text,
    plan: text.nullable(),
    revision: text.nullable(),
    scope: scope.refine((items) => items.length > 0, "review scope is required"),
    reason: text.optional(),
  })
  .describe(
    "Initialize this Auto task once. Pin its authorized goal and available approved plan reference. Use null revision before initial implementation, or the current snapshot when Auto enters existing work. A changed approved plan starts a new version with a reason; correction rounds stay in this version. The caller checks real authorization.",
  );
const requests = [start] as const;
const events = [
  start.extend({ ...metadata, session_id: text, schema_version: z.literal(1) }),
] as const;
const request = z.discriminatedUnion("type", requests);
const event = z.discriminatedUnion("type", [...events, ...impl.events, ...review.events]);
type Event = z.infer<typeof event>;
type Request = z.infer<typeof request>;
const schema = {
  get inputSchema() {
    return z.toJSONSchema(request);
  },
};
function parseRequest({ value }: { value: unknown }) {
  return request.parse(value);
}
function parseEvent({ value }: { value: unknown }) {
  return event.parse(value);
}

const recorderFields = ["seq", "version", "at", "session_id", "schema_version"];
function requestFields({ event }: { event: Event }) {
  return Object.fromEntries(Object.entries(event).filter(([key]) => !recorderFields.includes(key)));
}
type State = {
  impl: ReturnType<typeof implementation>;
  review: ReturnType<typeof reviewState>;
};
// A shared lock and replay preserve ordering across different stage commands.
function apply({ state, event }: { state: State; event: Event }) {
  switch (event.type) {
    case "impl_started":
    case "implemented":
    case "verified": {
      const changed =
        event.type === "implemented" ||
        (event.type === "verified" && event.revision !== state.impl.revision);
      implement({ state: state.impl, event });
      if (changed) {
        reconcile({ state: state.review, coverage: event.coverage });
      }
      return;
    }
    case "scope":
    case "review_pass":
      return reviewEvent({
        state: state.review,
        event,
        revision: state.impl.revision,
        implementing: state.impl.implementing,
      });
    default:
      throw new Error("start is only allowed at the version header");
  }
}
function startVersion({
  header,
  priorState,
}: {
  header: Extract<Event, { type: "start" }>;
  priorState: State | null;
}): State {
  return {
    impl: implementation({ revision: header.revision }),
    review: reviewState({
      sections: header.scope,
      reason: header.reason,
      previous: priorState?.review ?? null,
    }),
  };
}

// Validate all versions, including historical transitions, before returning current state.
function replay({ records, session }: { records: unknown[][]; session: string }) {
  const history: Event[][] = [];
  const startIds = new Set<string>();
  let state: State | null = null;
  let previous: Extract<Event, { type: "start" }> | null = null;
  for (const [index, values] of records.entries()) {
    const events = values.map((value) => parseEvent({ value }));
    const header = events[0];
    if (header?.type !== "start" || header.session_id !== session || header.version !== index + 1) {
      throw new Error("invalid execution header or ownership");
    }
    if (startIds.has(header.id)) {
      throw new Error("duplicate execution start ID");
    }
    startIds.add(header.id);
    if (
      previous &&
      (header.goal !== previous.goal ||
        header.plan === null ||
        header.plan === previous.plan ||
        !header.reason)
    ) {
      throw new Error(
        "new execution version requires the same goal, a changed approved plan reference and a reason",
      );
    }
    state = startVersion({ header, priorState: state });
    const ids = new Set<string>();
    for (const [position, event] of events.entries()) {
      if (event.seq !== position + 1 || event.version !== header.version || ids.has(event.id)) {
        throw new Error("sequence gap, duplicate event ID or event version mismatch");
      }
      ids.add(event.id);
      if (position > 0) {
        apply({ state, event });
      }
    }
    history.push(events);
    previous = header;
  }
  return { state, history };
}

export function readState({
  records,
  session,
  version,
}: {
  records: unknown[][];
  session: string;
  version: number | undefined;
}) {
  const { state } = replay({ records, session });
  if (!state) {
    throw new Error("execution does not exist");
  }
  if (version !== undefined && version !== records.length) {
    throw new Error("stale version: read the current execution");
  }
  return state;
}
export function checkHistory({ records, session }: { records: unknown[][]; session: string }) {
  replay({ records, session });
}
export function validate({
  records,
  session,
  request,
  version,
}: {
  records: unknown[][];
  session: string;
  request:
    | Request
    | z.infer<(typeof impl.requests)[number]>
    | z.infer<(typeof review.requests)[number]>;
  version: number | undefined;
}) {
  const { state, history } = replay({ records, session });
  // Lost write responses may be retried even after the recorded revision advances.
  for (const events of history) {
    const prior = events.find((event) => event.id === request.id);
    if (prior && (request.type === "start" || prior.version === version)) {
      if (!isDeepStrictEqual(requestFields({ event: prior }), request)) {
        throw new Error("conflicting execution event retry");
      }
      return { record: prior, retry: true };
    }
  }
  if (request.type === "start") {
    const record = parseEvent({
      value: {
        ...request,
        seq: 1,
        version: history.length + 1,
        session_id: session,
        schema_version: 1,
      },
    });
    replay({ records: [...records, [record]], session });
    return { record, retry: false };
  }
  if (!state || version !== history.length) {
    throw new Error("stale version: read the current execution");
  }
  const current = history.at(-1)!;
  const record = parseEvent({ value: { ...request, seq: current.length + 1, version } });
  apply({ state, event: record });
  return { record, retry: false };
}

export default {
  schema,
  parseRequest,
  validate,
  checkHistory,
  directory: "execute",
  next: undefined,
};
