import * as z from "zod";

const text = z.string().regex(/\S/, "expected a nonempty string");
const metadata = {
  seq: z.int().positive(),
  version: z.int().positive(),
  at: z.iso.datetime().optional(),
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

export const requests = [implStarted, implemented] as const;
export const events = [
  implStarted.extend({ ...metadata }),
  implemented.extend({ ...metadata }),
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
