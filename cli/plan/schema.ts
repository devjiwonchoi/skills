import * as z from "zod";

const text = z.string().regex(/\S/, "expected a nonempty string");
const base = z.looseObject({ id: text });
const start = base
  .extend({
    type: z.literal("start"),
    alignment: z.looseObject({ version: z.int().positive(), event_id: text }),
    effort: z.enum(["low", "medium", "high"]),
    effort_reason: text,
    content: text,
  })
  .describe(
    "Save a complete candidate before acceptance or approval. Pin the current aligned event. Include goal/constraints, expected result and code-flow preview, approach, work units, each success criterion's check/expected result/evidence, prepared tests or reproduction and baseline outcome, and fixed/adaptable decisions in content. Group edits into a new version. Earlier acceptance, approvals and reviews do not carry forward.",
  );
const approved = base
  .extend({
    type: z.literal("approved"),
    candidate_id: text,
    value: text,
  })
  .describe(
    "Record the actual user's final approval of candidate_id, including verification methods and scoped delivery permissions, after required detailed reviews clear. Keep value verbatim. Never invent approval.",
  );
const accepted = base
  .extend({
    type: z.literal("accepted"),
    candidate_id: text,
    value: text,
    reason: text,
  })
  .describe(
    "Record proceeding from existing user instructions when no consequential plan or verification choice needs a decision. Keep the actual instruction verbatim in value and explain why it suffices in reason. This is not a new user approval. Never bypass an explicit approval request or pending decision.",
  );
const review = base
  .extend({
    type: z.literal("review"),
    candidate_id: text,
    reviewer: text,
    verdict: z.enum(["approved", "changes_requested"]),
    findings: z.array(text),
  })
  .refine(
    (value) =>
      value.verdict === "changes_requested"
        ? value.findings.length > 0
        : value.findings.length === 0,
    "changes_requested needs findings; approved needs no unresolved findings",
  )
  .describe(
    "Record each real reviewer's verdict on the current candidate before final authorization. Correct supported findings and re-review affected behavior before presenting the final candidate. Optional nits do not block execution. Never invent reviewer results.",
  );
const request = z.discriminatedUnion("type", [start, approved, accepted, review]);
const metadata = { seq: z.int().positive(), version: z.int().positive() };
const event = z.discriminatedUnion("type", [
  start.extend({ ...metadata, session_id: text, schema_version: z.literal(1) }),
  approved.extend(metadata),
  accepted.extend(metadata),
  review.safeExtend(metadata),
]);
const recorderFields = ["at", "seq", "version", "session_id", "schema_version", "previous_version"];

export type Request = z.infer<typeof request>;
export type Event = z.infer<typeof event>;
export type Candidate = Extract<Event, { type: "start" }>;

export const schema = {
  get inputSchema() {
    return {
      ...z.toJSONSchema(request),
      not: { anyOf: recorderFields.map((field) => ({ required: [field] })) },
    };
  },
  rules: [
    "New final acceptance or approval requires clear reviews first: low 0, medium 1, high 3 distinct reviewers. Each reviewer's latest verdict applies; any changes_requested blocks execution. Historical authorization-before-review journals remain readable. A new candidate inherits neither authorization nor reviews. Records cannot prove whether instructions settle the plan's choices or grant delivery permissions.",
    "Plan writes require the same session's latest Align version to be aligned and the candidate to pin that exact aligned event. The CLI holds Align's lock through the Plan write and replays its full history. Historical Plan reads remain available. Records cannot establish real authorship.",
    "Use fresh IDs for new records; identical IDs/payloads are retries. Read on rejection. Preserve earlier versions and damaged logs. Check the lock owner stopped before removing a stale lock.",
  ],
};

export function parseRequest({ value }: { value: unknown }) {
  const parsed = request.parse(value);
  if (recorderFields.some((field) => field in parsed)) {
    throw new Error("metadata is assigned by the recorder");
  }

  return parsed;
}

export function parseEvent({ value }: { value: unknown }) {
  return event.parse(value);
}

export function requestFields({ event }: { event: Record<string, unknown> }) {
  return Object.fromEntries(Object.entries(event).filter(([key]) => !recorderFields.includes(key)));
}
