import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { capture, verify } from "../shared/file-hash.ts";
import { observe } from "./github.ts";
import { events, requestFields, type Request } from "./schema.ts";
import { action, apply, pending, replay } from "./state.ts";

export function readState(input: {
  records: unknown[][];
  session: string;
  version: number | undefined;
}) {
  const { state } = replay(input);
  if (!state || (input.version !== undefined && input.version !== 1)) {
    throw new Error("stale version: read the current Ship journal");
  }
  return state;
}
export function checkHistory(input: { records: unknown[][]; session: string }) {
  replay(input);
}

export function next({
  root,
  ...input
}: {
  records: unknown[][];
  session: string;
  version: number | undefined;
  root: string;
}) {
  const state = readState(input);
  try {
    if (state.observation) {
      verify({
        root,
        evidence: state.observation.evidence,
        recorded: state.observation.artifacts,
      });
    }
    if (state.observation?.type === "ready" && state.targets) {
      state.observation = {
        ...state.observation,
        observations: observe({ root, targets: state.targets.pull_requests }).observations,
      };
    }
  } catch (error) {
    return { action: "recover", stage: "observation", reason: (error as Error).message };
  }
  return {
    ...action({ state }),
    revision: state.targets?.revision ?? null,
    pull_requests: state.targets?.pull_requests ?? [],
  };
}

export function validate({
  records,
  session,
  version,
  request,
  root,
}: {
  records: unknown[][];
  session: string;
  version: number | undefined;
  request: Request;
  root: string;
}) {
  const { state, history } = replay({ records, session });
  const prior = history.find((event) => event.id === request.id);
  if (prior && (request.type === "start" || version === prior.version)) {
    if (!isDeepStrictEqual(requestFields({ event: prior }), request)) {
      throw new Error("conflicting Ship event retry");
    }
    return { record: prior, retry: true };
  }
  if (request.type === "start") {
    if (history.length) {
      throw new Error("Ship already exists; resume its journal");
    }
    return {
      record: events.parse({
        ...request,
        seq: 1,
        version: 1,
        session_id: session,
        schema_version: 1,
      }),
      retry: false,
    };
  }
  if (!state || version !== 1) {
    throw new Error("stale version: read the current Ship journal");
  }
  let extra = {};
  if (request.type === "observed" || request.type === "ready") {
    if (!state.targets || pending({ state }).length) {
      throw new Error("record targets and reconcile outstanding effects before observation");
    }
    const live = observe({ root, targets: state.targets.pull_requests });
    const path = join(root, ".jwn", session, "ship", "evidence", `${randomUUID()}.json`);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, JSON.stringify(live.evidence) + "\n", { flag: "wx", flush: true });
    extra = {
      observations: live.observations,
      evidence: [path],
      artifacts: capture({ root, evidence: [path] }),
    };
  } else if (request.type === "result") {
    extra = { artifacts: capture({ root, evidence: request.evidence }) };
  }
  const record = events.parse({ ...request, ...extra, seq: history.length + 1, version: 1 });
  apply({ state, event: record });
  return { record, retry: false };
}
