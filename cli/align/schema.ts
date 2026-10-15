import * as z from "zod";

export type JsonObject = Record<string, unknown>;

export const recorderFields = [
  "at",
  "seq",
  "version",
  "session_id",
  "schema_version",
  "previous_version",
];

// Validate text without trimming the user's original words.
const text = z.string().regex(/\S/, "expected a nonempty string");
const choiceId = z.union([z.string().min(1), z.int()]);
const source = z.looseObject({ version: z.int(), event_id: text });
const selection = z.looseObject({ id: choiceId, value: text, recommend: z.boolean().optional() });
const ambiguity = z.discriminatedUnion("status", [
  z.looseObject({ id: text, value: text, status: z.literal("open") }),
  z.looseObject({ id: text, value: text, status: z.literal("resolved"), resolved_by: text }),
]);
const base = z.looseObject({
  id: text,
  intention: text.optional(),
  confirms_intention: z.boolean().optional(),
});

const start = base
  .extend({
    type: z.literal("start"),
    intention: text,
    prompt: z.string().optional(),
    reason: text.optional(),
    source: source.optional(),
  })
  .describe(
    "Record the intention before clarification. Keep prompt verbatim. Changed intention starts a new version with reason and preceding-version correction source. Earlier approval does not carry forward.",
  );

const understanding = base
  .extend({
    type: z.literal("understanding"),
    ambiguities: z
      .array(ambiguity)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "duplicate ambiguity ID",
      ),
  })
  .describe(
    "Declare open before resolving. Keep id/value unchanged; resolved_by cites relevant prior evidence in this version, using the latest response when citing an answer. Omitted items stay unchanged.",
  );

const research = base
  .extend({
    type: z.literal("research"),
    value: text,
    sources: z.array(text).min(1, "research needs sources"),
  })
  .describe(
    "Record findings and sources after research, before using them to resolve ambiguities.",
  );

const context = base
  .extend({
    type: z.literal("context"),
    value: text,
    source,
  })
  .describe("Import applicable older-version evidence, without inheriting approval.");

const question = base
  .extend({
    type: z.literal("question"),
    question: text,
    ambiguity_ids: z
      .array(z.string().min(1))
      .refine((ids) => new Set(ids).size === ids.length, "duplicate IDs"),
    selections: z
      .array(selection)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "duplicate IDs",
      )
      .nullish(),
  })
  .describe(
    "Record before asking; cite open ambiguities. When final confirmation is needed, first clear ambiguities and unanswered questions, then use [] and confirms_intention:true.",
  );

const response = base
  .extend({
    type: z.literal("response"),
    value: text,
    question_id: text.nullish(),
    selected_ids: z
      .array(choiceId)
      .refine((ids) => new Set(ids).size === ids.length, "duplicate IDs")
      .nullish(),
  })
  .describe(
    "Record the real reply verbatim and link every question reply. Recommendations are not selections. Confirm only an actual final confirmation; clarify declined/qualified replies and ask fresh confirmation. Linked replies reopen their ambiguities.",
  );

const aligned = base
  .extend({
    type: z.literal("aligned"),
    source: source.optional(),
    reason: text.optional(),
  })
  .describe(
    "Finalize with no open work. For a clear request, cite this version's start in source and explain in reason why its prompt and answers suffice. Otherwise the CLI cites the preceding actual final confirmation. Never bypass requested confirmation. Keep planning go-aheads outside Align; record corrections.",
  );

// Requests, stored events, inferred types, and CLI documentation share these field definitions.
const request = z.discriminatedUnion("type", [
  start,
  understanding,
  research,
  context,
  question,
  response,
  aligned,
]);
const metadata = { seq: z.int(), version: z.int(), at: z.iso.datetime().optional() };
const event = z.discriminatedUnion("type", [
  start.extend({
    ...metadata,
    schema_version: z.literal(1),
    session_id: z.string(),
    previous_version: z.int().optional(),
  }),
  understanding.extend(metadata),
  research.extend(metadata),
  context.extend(metadata),
  question.extend(metadata),
  response.extend(metadata),
  aligned.extend({ ...metadata, intention: text, source }),
]);

export type Request = z.infer<typeof request>;
export type Event = z.infer<typeof event>;
export type Source = z.infer<typeof source>;
export type Ambiguity = z.infer<typeof ambiguity>;
export type Question = Extract<Event, { type: "question" }>;
export type Header = Extract<Event, { type: "start" }>;

// Field shapes are loaded on demand; procedure checks remain in validate.ts.
export const schema = {
  get inputSchema() {
    return {
      ...z.toJSONSchema(request),
      not: { anyOf: recorderFields.map((field) => ({ required: [field] })) },
    };
  },
  rules: [
    "Use fresh IDs for new events; keep identical IDs and payloads only for retries. The engine assigns metadata.",
    "Pass JSON without shell expansion, for example with a quoted heredoc (<<'JSON').",
    "On rejection, read and fix the input or prerequisite. A new ID cannot bypass an existing start source.",
    "JSONL is authoritative. Writes replay the existing log before validating a new event. Preserve damaged logs before any repair. Verify .lock/owner.json writer stopped before removing its lock.",
  ],
};

// Requests carry caller-owned fields; the session assigns sequence and version metadata.
export function parseRequest({ value }: { value: unknown }) {
  const parsed = request.parse(value);
  if (recorderFields.some((key) => key in parsed)) {
    throw new Error("metadata is assigned by the recorder");
  }

  return parsed;
}

// Ignore writer-assigned metadata when comparing retries of the same request.
export function requestFields({ event }: { event: JsonObject }) {
  return Object.fromEntries(Object.entries(event).filter(([key]) => !recorderFields.includes(key)));
}

// Check each event's shape before state recovery. Keep its original fields and values intact.
export function parseEvent({ value }: { value: unknown }) {
  const parsed = event.parse(value);
  if (
    parsed.type === "start" &&
    parsed.version > 1 &&
    (parsed.reason === undefined || parsed.source === undefined)
  ) {
    throw new Error("changed intention requires reason and source");
  }

  return parsed;
}
