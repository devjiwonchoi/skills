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
    "Save a complete candidate before asking approval. The recorder writes content to v<N>.md and pins its SHA-256 hash in v<N>.jsonl. Pin the current aligned event. Include goal/constraints, expected result and code-flow preview, approach, work units, verification, and fixed/adaptable decisions in content. Group edits into a new version. Earlier approvals and reviews do not carry forward.",
  );
const approved = base
  .extend({
    type: z.literal("approved"),
    candidate_id: text,
    value: text,
  })
  .describe(
    "Record the actual user's approval of candidate_id after receiving it and before detailed review. Keep value verbatim. Never invent approval.",
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
    "Record each real reviewer's verdict on the current approved candidate after review. Report blockers immediately. Separate bugs and blockers from optional nits, which do not block execution. Never invent reviewer results.",
  );
const request = z.discriminatedUnion("type", [start, approved, review]);
const metadata = { seq: z.int().positive(), version: z.int().positive() };
const event = z.union([
  start.extend({ ...metadata, session_id: text, schema_version: z.literal(1) }),
  start.omit({ content: true }).extend({
    ...metadata,
    session_id: text,
    schema_version: z.literal(2),
    document: text,
    content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  approved.extend(metadata),
  review.safeExtend(metadata),
]);
const recorderFields = [
  "at",
  "seq",
  "version",
  "session_id",
  "schema_version",
  "previous_version",
  "document",
  "content_sha256",
];

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
    "Plan Markdown is canonical. Reads and writes verify the saved document hash. Do not edit saved candidates; submit changed content as a new version. Legacy embedded-content records remain unchanged.",
    "Execution needs current user approval and clear required reviews: low 0, medium 1, high 3 distinct reviewers. Each reviewer's latest verdict applies; any changes_requested blocks execution. A new candidate inherits neither approval nor reviews.",
    "The skill must check the pinned Align is still current and aligned. The Plan log cannot establish cross-command currency or real authorship.",
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
