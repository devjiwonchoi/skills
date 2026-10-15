import { events, type Event } from "./schema.ts";

export type State = {
  header: Extract<Event, { type: "start" }>;
  targets: Extract<Event, { type: "targets" }> | null;
  operations: Map<
    string,
    {
      attempt: Extract<Event, { type: "attempt" }>;
      result: Extract<Event, { type: "result" }> | null;
    }
  >;
  observation: Extract<Event, { type: "observed" | "ready" }> | null;
};

export function pending({ state }: { state: State }) {
  return [...state.operations.values()].filter(
    (operation) => !operation.result || operation.result.outcome === "uncertain",
  );
}
export function action({ state }: { state: State }) {
  const operations = pending({ state });
  if (operations.length) {
    return { action: "reconcile", operations };
  }
  if (!state.targets) {
    return { action: "publish" };
  }
  if (!state.observation) {
    return { action: "observe" };
  }
  for (const item of state.observation.observations) {
    if (!item.open || item.checks === "stale" || item.bots === "stale") {
      return { action: "reconcile", reason: "PR identity, head, base or state changed" };
    }
    if (item.findings || item.checks === "failed" || item.bots === "failed") {
      return { action: "repair" };
    }
    if (item.draft || item.checks === "pending" || item.bots === "pending") {
      return { action: "wait" };
    }
  }
  return { action: state.observation.type === "ready" ? "complete" : "ready" };
}
export function apply({ state, event }: { state: State; event: Event }) {
  switch (event.type) {
    case "start":
      throw new Error("start belongs at the version header");
    case "attempt": {
      if (pending({ state }).length) {
        throw new Error("reconcile outstanding external effects before another mutation");
      }
      const prior = [...state.operations.values()]
        .reverse()
        .find(
          (item) =>
            item.attempt.operation === event.operation && item.attempt.target === event.target,
        );
      if (
        prior &&
        prior.result?.outcome === "failed" &&
        (event.retry_of !== prior.attempt.id || !event.reason)
      ) {
        throw new Error("retry needs its failed attempt and a corrected cause");
      }
      if (prior && prior.result?.outcome === "succeeded" && !event.reason) {
        throw new Error("completed operation needs a new-work reason before repetition");
      }
      state.operations.set(event.id, { attempt: event, result: null });
      state.observation = null;
      break;
    }
    case "result": {
      const operation = state.operations.get(event.attempt_id);
      if (!operation) {
        throw new Error("unknown publication attempt");
      }
      if (operation.result && operation.result.outcome !== "uncertain") {
        throw new Error("operation already has a known outcome");
      }
      if (operation.result?.outcome === "uncertain" && !event.reconciled) {
        throw new Error("uncertain outcome needs actual reconciliation");
      }
      operation.result = event;
      state.observation = null;
      break;
    }
    case "targets":
      if (pending({ state }).length) {
        throw new Error("reconcile external effects before replacing targets");
      }
      state.targets = event;
      state.observation = null;
      break;
    case "observed":
    case "ready": {
      if (!state.targets || pending({ state }).length) {
        throw new Error("record targets and reconcile external effects before observing readiness");
      }
      const wanted = state.targets.pull_requests;
      if (
        event.observations.length !== wanted.length ||
        event.observations.some((item, index) => item.url !== wanted[index]?.url)
      ) {
        throw new Error("observation must cover every recorded PR in order");
      }
      state.observation = event;
      if (event.type === "ready" && action({ state }).action !== "complete") {
        throw new Error("current PR heads, checks and reviews are not ready");
      }
      break;
    }
  }
}
export function replay({ records, session }: { records: unknown[][]; session: string }) {
  if (records.length > 1) {
    throw new Error("Ship retains one journal per task");
  }
  const history = (records[0] ?? []).map((value) => events.parse(value));
  const header = history[0];
  if (!header) {
    return { history, state: null };
  }
  if (header.type !== "start" || header.session_id !== session || header.version !== 1) {
    throw new Error("invalid Ship header or ownership");
  }
  const state: State = { header, targets: null, operations: new Map(), observation: null };
  const ids = new Set<string>();
  for (const [index, event] of history.entries()) {
    if (event.seq !== index + 1 || event.version !== 1 || ids.has(event.id)) {
      throw new Error("invalid Ship sequence, version or duplicate ID");
    }
    ids.add(event.id);
    if (index > 0) {
      apply({ state, event });
    }
  }
  return { history, state };
}
