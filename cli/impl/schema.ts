import * as z from "zod";

import { artifacts } from "../shared/file-hash.ts";

const text = z.string().regex(/\S/, "expected a nonempty string");
const metadata = {
  seq: z.int().positive(),
  version: z.int().positive(),
  at: z.iso.datetime().optional(),
  artifacts: artifacts.optional(),
};
const base = z.strictObject({ id: text });
const reconciliation = z
  .array(z.strictObject({ section_id: text, retain: z.boolean(), reason: text }))
  .refine(
    (items) => new Set(items.map((item) => item.section_id)).size === items.length,
    "duplicate section ID",
  );

const implStarted = base
  .extend({ type: z.literal("impl_started") })
  .describe(
    "Quick-impl records work starting. An interrupted start remains unfinished implementation.",
  );
const implemented = base
  .extend({
    type: z.literal("implemented"),
    previous_revision: text.nullable(),
    revision: text,
    coverage: reconciliation,
  })
  .describe(
    "Quick-impl records the resulting snapshot and reconciles every scope section. Reopen changed/affected sections; retain only previously reviewed sections with a reason. Do not close findings.",
  );

const verified = base
  .extend({
    type: z.literal("verified"),
    revision: text,
    outcome: z.enum(["passed", "failed", "incomplete"]),
    previous_revision: text.nullable().optional(),
    evidence: z.array(text),
    gaps: z.array(text),
    coverage: reconciliation.optional(),
  })
  .refine(
    (value) =>
      value.outcome === "passed"
        ? value.evidence.length > 0 && value.gaps.length === 0
        : value.gaps.length > 0,
    "passed verification needs evidence and no gaps; other outcomes need gaps",
  )
  .describe(
    "Verify records one outcome per checked snapshot, with detailed results in evidence artifacts. If Verify changes code, reconcile every scope section for its new snapshot. Old verification cannot establish the new revision's readiness. Do not close findings.",
  );

export const requests = [implStarted, implemented, verified] as const;
export const events = [
  implStarted.extend({ ...metadata }),
  implemented.extend({ ...metadata }),
  verified.safeExtend({ ...metadata }),
] as const;
const request = z.discriminatedUnion("type", requests);
const event = z.discriminatedUnion("type", events);
export type Event = z.infer<typeof event>;
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
