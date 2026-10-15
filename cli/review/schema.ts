import * as z from "zod";

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
const section = z.strictObject({ id: text, path: text, behavior: text });
export const scope = z
  .array(section)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    "duplicate section ID",
  );
export type Section = z.infer<typeof section>;

const finding = z.strictObject({
  id: text,
  section_id: text,
  issue: text,
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  status: z.enum(["open", "resolved", "dismissed"]),
  evidence: z.array(text).min(1),
});
const expandedScope = base
  .extend({
    type: z.literal("scope"),
    revision: text,
    additions: scope,
    reopen: strings,
    reason: text,
  })
  .refine(
    (value) => value.additions.length > 0 || value.reopen.length > 0,
    "scope event needs additions or reopened sections",
  )
  .describe(
    "Review records newly discovered review scope or reopens existing sections. Scope only expands within authorized intent. Never drop uncovered sections to manufacture completion.",
  );
const reviewPass = base
  .extend({
    type: z.literal("review_pass"),
    revision: text,
    reviewer: text,
    outcome: z.enum(["completed", "incomplete"]),
    reviewed: strings,
    findings: z
      .array(finding)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "duplicate finding ID",
      ),
    evidence: z.array(text),
    gaps: z.array(text),
  })
  .refine(
    (value) =>
      value.outcome === "completed"
        ? value.reviewed.length > 0 && value.evidence.length > 0 && value.gaps.length === 0
        : value.reviewed.length === 0 && value.findings.length === 0 && value.gaps.length > 0,
    "completed review needs reviewed scope, evidence and no gaps; incomplete review cannot accept coverage or findings",
  )
  .describe(
    "Review records one completed direct pass after checking source access. Reuse finding IDs for the same issue, including recurrence; supply evidence for dispositions. The CLI cannot establish review quality or semantic impact. Failed access or incomplete review records an incomplete outcome with gaps.",
  );

export const requests = [expandedScope, reviewPass] as const;
export const events = [
  expandedScope.safeExtend({ ...metadata }),
  reviewPass.safeExtend({ ...metadata }),
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
export type Finding = z.infer<typeof finding>;
export type Pass = z.infer<typeof reviewPass>;
