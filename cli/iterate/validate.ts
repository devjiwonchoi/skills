import { isDeepStrictEqual } from "node:util";

import type * as z from "zod";

import * as impl from "../impl/schema.ts";
import * as review from "../review/schema.ts";
import { parseEvent, requestFields, type Event, type Request } from "./schema.ts";
import { apply, startVersion, type State } from "./state.ts";

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
