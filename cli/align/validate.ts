import { isDeepStrictEqual } from "node:util";

import {
  parseEvent,
  requestFields,
  type Request,
  type Ambiguity,
  type Event,
  type Header,
  type Question,
  type Source,
} from "./schema.ts";

// Reconstruct validation state from the original records. Nothing is cached between calls.
function replay({ records, session }: { records: unknown[][]; session: string }) {
  const references: Record<string, Reference> = {};
  const events: Event[] = [];
  let state: Alignment | null = null;
  for (const [index, values] of records.entries()) {
    if (values.length === 0) {
      throw new Error("invalid alignment header");
    }

    for (const [position, value] of values.entries()) {
      const event = parseEvent({ value });
      if (event.version !== index + 1) {
        throw new Error("event version mismatch");
      }

      if (position === 0 && (event.type !== "start" || event.session_id !== session)) {
        throw new Error("log ownership or version mismatch");
      }

      state = applyEvent({ state, event, references });
      references[`${event.version}:${event.id}`] = {
        id: event.id,
        type: event.type,
        version: event.version,
        seq: event.seq,
        question_id: event.type === "response" ? event.question_id : undefined,
      };
      events.push(event);
    }
  }

  return { references, events, state };
}

export function readAligned({ records, session }: { records: unknown[][]; session: string }) {
  const { state } = replay({ records, session });
  if (!state?.aligned) {
    throw new Error("the latest Align version must be aligned before writing Plan");
  }

  return { version: state.header.version, event_id: state.aligned.id };
}

export function validate({
  records,
  session,
  request,
  version,
}: {
  records: unknown[][];
  session: string;
  request: Request;
  version: number | undefined;
}) {
  const { references, events, state } = replay({ records, session });

  if (request.type === "start") {
    for (const first of events.filter((event) => event.type === "start")) {
      const sameSource =
        request.source !== undefined && isDeepStrictEqual(first.source, request.source);
      if (first.id === request.id || sameSource) {
        const retry = { ...request, id: sameSource ? first.id : request.id };
        if (!isDeepStrictEqual(requestFields({ event: first }), retry)) {
          throw new Error("conflicting version retry");
        }

        return { record: first, retry: true };
      }
    }

    const next = records.length + 1;
    const record = parseEvent({
      value: {
        ...request,
        seq: 1,
        version: next,
        session_id: session,
        schema_version: 1,
        ...(next > 1 ? { previous_version: next - 1 } : {}),
      },
    });
    applyEvent({ state, event: record, references });

    return { record, retry: false };
  }

  if (
    !state ||
    version === undefined ||
    !Number.isSafeInteger(version) ||
    version !== state.header.version
  ) {
    throw new Error("stale version: read the current session");
  }

  if ("intention" in request && request.intention !== state.header.intention) {
    throw new Error("intention changed: start a new version");
  }

  const existing = events.find((event) => event.version === version && event.id === request.id);
  if (existing) {
    const saved = requestFields({ event: existing });
    if (existing.type === "aligned") {
      if (!("source" in request)) {
        delete saved.source;
      }

      if (!("intention" in request)) {
        delete saved.intention;
      }
    }

    if (!isDeepStrictEqual(saved, request)) {
      throw new Error("conflicting event retry");
    }

    if (existing.type === "aligned" && state.aligned?.id !== existing.id) {
      throw new Error("alignment reopened: read the current session before finalizing");
    }

    return { record: existing, retry: true };
  }

  const source = { version, event_id: state.previous.id };
  if (
    request.type === "aligned" &&
    "source" in request &&
    !isDeepStrictEqual(request.source, source)
  ) {
    throw new Error("aligned must cite the preceding response in this version");
  }

  const record = parseEvent({
    value: {
      ...request,
      ...(request.type === "aligned" ? { intention: state.header.intention, source } : {}),
      seq: state.seq + 1,
      version,
    },
  });
  applyEvent({ state, event: record, references });

  return { record, retry: false };
}

type Response = Extract<Event, { type: "response" }>;
type Reference = Pick<Event, "id" | "type" | "version" | "seq"> & {
  question_id: string | null | undefined;
};
type Alignment = {
  header: Header;
  seq: number;
  previous: Event;
  ambiguities: Record<string, Ambiguity>;
  questions: Record<string, Event & Question>;
  responses: Record<string, Response>;
  aligned: Extract<Event, { type: "aligned" }> | null;
};

function sourceEvent({
  source,
  references,
}: {
  source: Source | undefined;
  references: Record<string, Reference>;
}) {
  if (!source) {
    throw new Error("expected a JSON object");
  }

  const event = references[`${source.version}:${source.event_id}`];
  if (!event) {
    throw new Error("source event does not exist");
  }

  return event;
}

// Writes replay the log with the same rules used for the proposed event. Prefix JSON dictionary keys so IDs such as __proto__ stay ordinary data.
function applyEvent({
  state,
  event,
  references,
}: {
  state: Alignment | null;
  event: Event;
  references: Record<string, Reference>;
}): Alignment {
  if (references[`${event.version}:${event.id}`]) {
    throw new Error("duplicate event ID");
  }

  if (event.type === "start") {
    if (state && event.version === state.header.version) {
      throw new Error("start must be the first event in a version");
    }

    if (event.seq !== 1) {
      throw new Error("sequence gap or conflict");
    }

    if (event.version !== (state?.header.version ?? 0) + 1) {
      throw new Error("event version mismatch");
    }

    if (state) {
      if (event.previous_version !== state.header.version) {
        throw new Error("invalid previous version");
      }

      const source = sourceEvent({ source: event.source, references });
      if (source.version !== state.header.version) {
        throw new Error("change must cite the preceding version");
      }

      if (event.intention === state.header.intention) {
        throw new Error("unchanged intention cannot create a version");
      }
    }

    return {
      header: event,
      seq: 1,
      previous: event,
      ambiguities: {},
      questions: {},
      responses: {},
      aligned: null,
    };
  }

  if (!state) {
    throw new Error("invalid alignment header");
  }

  if (event.seq !== state.seq + 1) {
    throw new Error("sequence gap or conflict");
  }

  if (event.version !== state.header.version) {
    throw new Error("event version mismatch");
  }

  if ("intention" in event && event.intention !== state.header.intention) {
    throw new Error("intention changed: start a new version");
  }

  switch (event.type) {
    case "understanding": {
      // Resolve only with relevant prior evidence, including the latest answer to its question.
      for (const ambiguity of event.ambiguities) {
        const previous = state.ambiguities[`$${ambiguity.id}`];
        if (previous && previous.value !== ambiguity.value) {
          throw new Error("changed ambiguity needs a new ID");
        }

        if (ambiguity.status === "resolved") {
          const evidence = references[`${event.version}:${ambiguity.resolved_by}`];
          if (
            !previous ||
            !evidence ||
            !["response", "research", "context"].includes(evidence.type)
          ) {
            throw new Error("resolution needs prior evidence");
          }

          if (evidence.type === "response" && evidence.question_id != null) {
            if (
              !state.questions[`$${evidence.question_id}`]?.ambiguity_ids.includes(ambiguity.id)
            ) {
              throw new Error("response does not address this ambiguity");
            }

            if (state.responses[`$${evidence.question_id}`]?.id !== evidence.id) {
              throw new Error("resolution must use the latest response");
            }
          }
        }

        state.ambiguities[`$${ambiguity.id}`] = ambiguity;
      }

      break;
    }
    case "research":
      break;
    case "context": {
      const source = sourceEvent({ source: event.source, references });
      if (source.version >= event.version) {
        throw new Error("context must cite an older version");
      }

      break;
    }
    case "question": {
      if (!event.ambiguity_ids.every((id) => state.ambiguities[`$${id}`]?.status === "open")) {
        throw new Error("question must cite open ambiguities");
      }

      if (event.ambiguity_ids.length === 0 && event.confirms_intention !== true) {
        throw new Error("question needs ambiguities or final confirmation");
      }

      const current = alignmentView({ state });
      if (
        event.confirms_intention === true &&
        (event.ambiguity_ids.length !== 0 ||
          current.ambiguities.length > 0 ||
          current.questions.length !== 0)
      ) {
        throw new Error("clear ambiguities and questions before confirmation");
      }

      state.questions[`$${event.id}`] = event;
      break;
    }
    case "response": {
      const question = event.question_id == null ? null : state.questions[`$${event.question_id}`];
      if (event.question_id != null && !question) {
        throw new Error("response refers to an unknown question");
      }

      // A recommendation never counts as the user's selection.
      const options = question?.selections ?? [];
      if (!(event.selected_ids ?? []).every((id) => options.some((option) => option.id === id))) {
        throw new Error("response contains an unknown selection");
      }

      if (event.confirms_intention === true && question?.confirms_intention !== true) {
        throw new Error("confirmation needs a final confirmation question");
      }

      if (question) {
        // A correction reopens earlier resolutions without rewriting the original events.
        for (const id of question.ambiguity_ids) {
          const ambiguity = state.ambiguities[`$${id}`];
          if (!ambiguity) {
            throw new Error("question refers to an unknown ambiguity");
          }

          if (ambiguity.status === "resolved") {
            const { resolved_by, ...remaining } = ambiguity;
            state.ambiguities[`$${id}`] = { ...remaining, status: "open" };
          }
        }

        state.responses[`$${question.id}`] = event;
      }

      break;
    }
    case "aligned": {
      // Bind approval to the immediately preceding confirmation in this intention version.
      const previous = state.previous;
      if (!isDeepStrictEqual(event.source, { version: event.version, event_id: previous.id })) {
        throw new Error("aligned must cite the preceding response in this version");
      }

      if (previous.type !== "response" || previous.confirms_intention !== true) {
        throw new Error("aligned needs actual user confirmation");
      }

      const current = alignmentView({ state });
      if (current.ambiguities.length > 0 || current.questions.length !== 0) {
        throw new Error("open ambiguities or questions prevent alignment");
      }

      if (event.intention !== state.header.intention) {
        throw new Error("aligned must contain the intention");
      }

      state.aligned = event;
      break;
    }
    default:
      throw new Error("unknown event type");
  }

  // Later evidence makes the existing approval historical until the user confirms again.
  if (event.type !== "aligned") {
    state.aligned = null;
  }

  state.seq = event.seq;
  state.previous = event;

  return state;
}

function alignmentView({ state }: { state: Alignment }) {
  return {
    ambiguities: Object.values(state.ambiguities).filter(
      (ambiguity) => ambiguity.status === "open",
    ),
    questions: Object.values(state.questions).filter(
      (question) =>
        !state.responses[`$${question.id}`] &&
        (question.confirms_intention === true ||
          question.ambiguity_ids.some((id) => state.ambiguities[`$${id}`]?.status === "open")),
    ),
  };
}
