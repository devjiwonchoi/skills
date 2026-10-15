import { isDeepStrictEqual } from "node:util";

import { parseEvent, requestFields, type Candidate, type Event, type Request } from "./schema.ts";

// Replay original records on writes. Authorization precedes review; neither carries to a new candidate.
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
  let previous: Candidate | null = null;
  let current: Event[] = [];
  const candidateIds = new Set<string>();
  for (const [index, values] of records.entries()) {
    const events = values.map((value) => parseEvent({ value }));
    const first = events[0];
    if (first?.type !== "start" || first.session_id !== session || first.version !== index + 1) {
      throw new Error("invalid plan header or ownership");
    }

    if (candidateIds.has(first.id)) {
      throw new Error("duplicate candidate ID across versions");
    }

    candidateIds.add(first.id);
    if (
      previous &&
      isDeepStrictEqual(
        requestFields({ event: previous }),
        requestFields({ event: { ...first, id: previous.id } }),
      )
    ) {
      throw new Error("unchanged candidate cannot create a version");
    }

    const ids = new Set<string>();
    let authorized = false;
    for (const [position, event] of events.entries()) {
      if (event.seq !== position + 1 || event.version !== first.version) {
        throw new Error("sequence gap or event version mismatch");
      }

      if (ids.has(event.id)) {
        throw new Error("duplicate event ID");
      }

      ids.add(event.id);
      if (position > 0) {
        if (event.type === "start" || event.candidate_id !== first.id) {
          throw new Error("event must target the current candidate");
        }

        if (event.type === "approved" || event.type === "accepted") {
          authorized = true;
        } else if (!authorized) {
          throw new Error("acceptance or user approval is required before detailed review");
        }
      }
    }

    previous = first;
    current = events;
  }

  if (request.type === "start") {
    for (const values of records) {
      const first = parseEvent({ value: values[0] });
      if (first.id === request.id) {
        if (!isDeepStrictEqual(requestFields({ event: first }), request)) {
          throw new Error("conflicting candidate retry");
        }

        return { record: first, retry: true };
      }
    }

    if (
      previous &&
      isDeepStrictEqual(requestFields({ event: previous }), { ...request, id: previous.id })
    ) {
      throw new Error("unchanged candidate cannot create a version");
    }

    return {
      record: parseEvent({
        value: {
          ...request,
          seq: 1,
          version: records.length + 1,
          session_id: session,
          schema_version: 1,
        },
      }),
      retry: false,
    };
  }

  if (!previous || version !== previous.version) {
    throw new Error("stale version: read the current plan");
  }

  if (request.candidate_id !== previous.id) {
    throw new Error("event must target the current candidate");
  }

  const existing = current.find((event) => event.id === request.id);
  if (existing) {
    if (!isDeepStrictEqual(requestFields({ event: existing }), request)) {
      throw new Error("conflicting event retry");
    }

    return { record: existing, retry: true };
  }

  if (
    request.type === "review" &&
    !current.some((event) => event.type === "approved" || event.type === "accepted")
  ) {
    throw new Error("acceptance or user approval is required before detailed review");
  }

  return {
    record: parseEvent({ value: { ...request, seq: current.length + 1, version } }),
    retry: false,
  };
}
