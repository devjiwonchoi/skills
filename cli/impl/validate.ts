import type { Event } from "./schema.ts";
import type { State } from "./state.ts";

export function begin({ state }: { state: State }) {
  state.implementing = true;
}
// Validate initial required coverage until Review takes ownership of section reconciliation.
export function apply({ state, event }: { state: State; event: Event }) {
  if (event.type === "impl_started") {
    begin({ state });
    return;
  }
  if (event.type === "implemented") {
    if (!state.implementing) {
      throw new Error("implementation start is required before its outcome");
    }
    if (event.previous_revision !== state.revision) {
      throw new Error("revision reconciliation must name the current previous_revision");
    }
    reconcile({ state, coverage: event.coverage });
    state.revision = event.revision;
    state.verification = null;
    state.implementing = false;
    return;
  }
}

function reconcile({
  state,
  coverage,
}: {
  state: State;
  coverage: { section_id: string; retain: boolean; reason: string }[] | undefined;
}) {
  if (!coverage || coverage.length !== state.coverage.size) {
    throw new Error("revision requires explicit reconciliation of every scope section");
  }
  for (const item of coverage) {
    const prior = state.coverage.get(item.section_id);
    if (!prior) {
      throw new Error("unknown coverage section");
    }
    if (item.retain && prior.reviewedRevision === null) {
      throw new Error("cannot retain uncovered scope");
    }
    state.coverage.set(item.section_id, { ...prior, reason: item.reason });
  }
}
