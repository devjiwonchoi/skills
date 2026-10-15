import * as z from "zod";

import * as impl from "../impl/schema.ts";
import * as review from "../review/schema.ts";

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
    "Initialize this task's execution journal once, including standalone stages. Pin its authorized goal and available approved plan reference. Use null revision before initial implementation, or the current snapshot when entering existing work. A changed approved plan starts a new version with a reason; correction rounds stay in this version. The caller checks real authorization.",
  );
const iteration = base
  .extend({
    type: z.literal("iteration"),
    round: z.int().positive(),
    findings: strings,
    reason: text.optional(),
  })
  .describe(
    "Iterate records the next consecutive correction round and its unresolved P0–P2 finding IDs before implementation. Restart completed execution only for newly authorized work with a reason. Resume an interrupted round instead of starting another.",
  );
const blocked = base
  .extend({ type: z.literal("blocked"), reason: text })
  .describe(
    "Record an approval boundary, stalled iteration, denied operation or other blocker before yielding.",
  );
const resumed = base
  .extend({ type: z.literal("resumed"), reason: text })
  .describe(
    "Record the actual resolution of a recorded blocker. This does not turn missing or failed evidence into success.",
  );
const completed = base
  .extend({ type: z.literal("completed") })
  .describe(
    "Iterate records completion only after next reports complete and the caller confirms that the actual working tree and approved scope still match. Execution completion does not complete Auto or authorize Ship.",
  );

const requests = [start, iteration, blocked, resumed, completed] as const;
const events = [
  start.extend({ ...metadata, session_id: text, schema_version: z.literal(1) }),
  iteration.extend({ ...metadata }),
  blocked.extend({ ...metadata }),
  resumed.extend({ ...metadata }),
  completed.extend({ ...metadata }),
] as const;
const request = z.discriminatedUnion("type", requests);
const event = z.discriminatedUnion("type", [...events, ...impl.events, ...review.events]);
export type Event = z.infer<typeof event>;
export type Request = z.infer<typeof request>;
export const schema = {
  get inputSchema() {
    return z.toJSONSchema(request);
  },
};
export function parseRequest({ value }: { value: unknown }) {
  return request.parse(value);
}
export function parseEvent({ value }: { value: unknown }) {
  return event.parse(value);
}

const recorderFields = ["seq", "version", "at", "session_id", "schema_version"];
export function requestFields({ event }: { event: Event }) {
  return Object.fromEntries(Object.entries(event).filter(([key]) => !recorderFields.includes(key)));
}
