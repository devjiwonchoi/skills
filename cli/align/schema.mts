export type JsonObject = Record<string, unknown>;
export type Request = JsonObject & { id: string; type: Event["type"] };
export type Source = { version: number; event_id: string };
export type Selection = { id: string | number; value: string; recommend: boolean | undefined };
export type Ambiguity = JsonObject & {
  id: string;
  value: string;
} & ({ status: "open" } | { status: "resolved"; resolved_by: string });
export type Question = JsonObject & {
  type: "question";
  question: string;
  ambiguity_ids: string[];
  selections: Selection[] | null | undefined;
};
export type Event = JsonObject & {
  id: string;
  seq: number;
  version: number;
  intention: string | undefined;
  confirms_intention: boolean | undefined;
} & (
    | {
        type: "start";
        intention: string;
        schema_version: number;
        session_id: string;
        previous_version: number | undefined;
        reason: string | undefined;
        source: Source | undefined;
      }
    | { type: "understanding"; ambiguities: Ambiguity[] }
    | { type: "research"; value: string; sources: string[] }
    | { type: "context"; value: string; source: Source }
    | Question
    | {
        type: "response";
        value: string;
        question_id: string | null | undefined;
        selected_ids: (string | number)[] | null | undefined;
      }
    | { type: "aligned"; intention: string; source: Source }
  );

export type Header = Extract<Event, { type: "start" }>;
export const eventTypes: Event["type"][] = [
  "start",
  "understanding",
  "research",
  "context",
  "question",
  "response",
  "aligned",
];

export const recorderFields = [
  "seq",
  "version",
  "session_id",
  "schema_version",
  "previous_version",
];

const text = { type: "string", pattern: "\\S" };
const choiceId = {
  anyOf: [
    { type: "string", minLength: 1 },
    { type: "integer", minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER },
  ],
};
const source = {
  type: "object",
  required: ["version", "event_id"],
  properties: { version: { type: "integer", minimum: 1 }, event_id: text },
};

// Field shapes are loaded on demand; procedure checks remain in validate.mts.
export const schema = {
  inputSchema: {
    type: "object",
    required: ["id", "type"],
    properties: { id: text },
    not: { anyOf: recorderFields.map((field) => ({ required: [field] })) },
    oneOf: [
      {
        properties: {
          type: { const: "start" },
          intention: text,
          prompt: { type: "string" },
          reason: text,
          source,
        },
        required: ["intention"],
        description:
          "Start a version. Keep prompt verbatim; changed intention requires reason and preceding-version correction source.",
      },
      {
        properties: {
          type: { const: "understanding" },
          ambiguities: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "value", "status"],
              properties: {
                id: text,
                value: text,
                status: { enum: ["open", "resolved"] },
                resolved_by: text,
              },
              if: { properties: { status: { const: "resolved" } } },
              then: { required: ["resolved_by"] },
            },
          },
        },
        required: ["ambiguities"],
        description:
          "Declare open before resolving. Keep id/value unchanged; resolved_by cites relevant prior evidence in this version, using the latest response when citing an answer. Omitted items stay unchanged.",
      },
      {
        properties: {
          type: { const: "research" },
          value: text,
          sources: { type: "array", minItems: 1, items: text },
        },
        required: ["value", "sources"],
      },
      {
        properties: { type: { const: "context" }, value: text, source },
        required: ["value", "source"],
        description: "Import applicable older-version evidence, without inheriting approval.",
      },
      {
        properties: {
          type: { const: "question" },
          question: text,
          ambiguity_ids: {
            type: "array",
            uniqueItems: true,
            items: { type: "string", minLength: 1 },
          },
          selections: {
            type: ["array", "null"],
            items: {
              type: "object",
              required: ["id", "value"],
              properties: { id: choiceId, value: text, recommend: { type: "boolean" } },
            },
          },
          confirms_intention: { type: "boolean" },
        },
        required: ["question", "ambiguity_ids"],
        description:
          "Record before asking; cite open ambiguities. After ambiguities and unanswered questions are cleared, use [] and confirms_intention:true for final confirmation.",
      },
      {
        properties: {
          type: { const: "response" },
          value: text,
          question_id: { anyOf: [text, { type: "null" }] },
          selected_ids: { type: ["array", "null"], uniqueItems: true, items: choiceId },
          confirms_intention: { type: "boolean" },
        },
        required: ["value"],
        description:
          "Record the real reply verbatim and link every question reply. Recommendations are not selections. Confirm only an actual final confirmation; clarify declined/qualified replies and ask fresh confirmation. Linked replies reopen their ambiguities.",
      },
      {
        properties: { type: { const: "aligned" }, intention: text, source },
        description:
          "Only after recorded final confirmation and no open work. The engine derives intention and the immediately preceding response source. Keep planning questions/plain go-aheads outside Align; record corrections.",
      },
    ],
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
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected a JSON object");
  }

  const request = value as JsonObject;
  if (typeof request.id !== "string" || request.id.trim().length === 0) {
    throw new Error("expected a nonempty string");
  }

  if (recorderFields.some((key) => key in request)) {
    throw new Error("metadata is assigned by the recorder");
  }

  if (request.type === "start") {
    if (typeof request.intention !== "string" || request.intention.trim().length === 0) {
      throw new Error("expected a nonempty string");
    }
  }

  if (!eventTypes.includes(request.type as Event["type"])) {
    throw new Error("unknown event type");
  }

  return request as Request;
}

// Ignore writer-assigned metadata when comparing retries of the same request.
export function requestFields({ event }: { event: JsonObject }) {
  return Object.fromEntries(Object.entries(event).filter(([key]) => !recorderFields.includes(key)));
}

function uniqueIds({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    throw new Error("expected an array");
  }

  const ids: unknown[] = value;
  if (
    !ids.every(
      (id) =>
        (typeof id === "string" && id.length > 0) ||
        (typeof id === "number" && Number.isSafeInteger(id)),
    )
  ) {
    throw new Error("invalid IDs");
  }

  if (new Set(ids).size !== ids.length) {
    throw new Error("duplicate IDs");
  }

  return ids as (string | number)[];
}

function parseSource({ value }: { value: unknown }) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("source must be a JSON object");
  }

  const source = value as JsonObject;
  if (!Number.isSafeInteger(source.version)) {
    throw new Error("invalid source version");
  }

  if (typeof source.event_id !== "string" || source.event_id.trim().length === 0) {
    throw new Error("source event does not exist");
  }

  return source as Source;
}

// Check each event's shape before state recovery. Keep its original fields and values intact.
export function parseEvent({ value }: { value: unknown }): Event {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected a JSON object");
  }

  const event = value as JsonObject;
  if (typeof event.id !== "string" || event.id.trim().length === 0) {
    throw new Error("expected a nonempty string");
  }

  if (!Number.isSafeInteger(event.seq)) {
    throw new Error("sequence gap or conflict");
  }

  if (typeof event.version !== "number" || !Number.isSafeInteger(event.version)) {
    throw new Error("event version mismatch");
  }

  if (event.confirms_intention !== undefined && typeof event.confirms_intention !== "boolean") {
    throw new Error("confirms_intention must be boolean");
  }

  switch (event.type) {
    case "start": {
      if (event.schema_version !== 1) {
        throw new Error("invalid alignment header");
      }

      if (typeof event.intention !== "string" || event.intention.trim().length === 0) {
        throw new Error("expected a nonempty string");
      }

      if (event.version > 1) {
        if (typeof event.reason !== "string" || event.reason.trim().length === 0) {
          throw new Error("expected a nonempty string");
        }

        parseSource({ value: event.source });
      }

      break;
    }
    case "understanding": {
      if (!Array.isArray(event.ambiguities)) {
        throw new Error("expected an array");
      }

      const seen = new Set<string>();
      for (const value of event.ambiguities) {
        if (value === null || typeof value !== "object" || Array.isArray(value)) {
          throw new Error("expected a JSON object");
        }

        const ambiguity = value as JsonObject;
        if (
          typeof ambiguity.id !== "string" ||
          ambiguity.id.trim().length === 0 ||
          typeof ambiguity.value !== "string" ||
          ambiguity.value.trim().length === 0
        ) {
          throw new Error("expected a nonempty string");
        }

        if (seen.has(ambiguity.id)) {
          throw new Error("duplicate ambiguity ID");
        }

        seen.add(ambiguity.id);
        if (ambiguity.status !== "open" && ambiguity.status !== "resolved") {
          throw new Error("invalid ambiguity status");
        }

        if (
          ambiguity.status === "resolved" &&
          (typeof ambiguity.resolved_by !== "string" || ambiguity.resolved_by.trim().length === 0)
        ) {
          throw new Error("expected a nonempty string");
        }
      }

      break;
    }
    case "research": {
      if (typeof event.value !== "string" || event.value.trim().length === 0) {
        throw new Error("expected a nonempty string");
      }

      if (!Array.isArray(event.sources)) {
        throw new Error("expected an array");
      }

      if (event.sources.length === 0) {
        throw new Error("research needs sources");
      }

      for (const source of event.sources) {
        if (typeof source !== "string" || source.trim().length === 0) {
          throw new Error("expected a nonempty string");
        }
      }

      break;
    }
    case "context": {
      if (typeof event.value !== "string" || event.value.trim().length === 0) {
        throw new Error("expected a nonempty string");
      }

      parseSource({ value: event.source });
      break;
    }
    case "question": {
      if (typeof event.question !== "string" || event.question.trim().length === 0) {
        throw new Error("expected a nonempty string");
      }

      const ids = uniqueIds({ value: event.ambiguity_ids });
      if (ids.some((id) => typeof id !== "string")) {
        throw new Error("question must cite open ambiguities");
      }

      const options = event.selections ?? [];
      if (!Array.isArray(options)) {
        throw new Error("expected an array");
      }

      for (const option of options) {
        if (option === null || typeof option !== "object" || Array.isArray(option)) {
          throw new Error("expected a JSON object");
        }

        if (typeof option.value !== "string" || option.value.trim().length === 0) {
          throw new Error("expected a nonempty string");
        }

        if (option.recommend !== undefined && typeof option.recommend !== "boolean") {
          throw new Error("recommend must be boolean");
        }
      }

      uniqueIds({ value: options.map((option) => option.id) });
      break;
    }
    case "response": {
      if (typeof event.value !== "string" || event.value.trim().length === 0) {
        throw new Error("expected a nonempty string");
      }

      uniqueIds({ value: event.selected_ids ?? [] });
      if (
        event.question_id != null &&
        (typeof event.question_id !== "string" || event.question_id.trim().length === 0)
      ) {
        throw new Error("expected a nonempty string");
      }

      break;
    }
    case "aligned": {
      if (typeof event.intention !== "string" || event.intention.trim().length === 0) {
        throw new Error("expected a nonempty string");
      }

      parseSource({ value: event.source });
      break;
    }
    default:
      throw new Error("unknown event type");
  }

  return event as Event;
}
