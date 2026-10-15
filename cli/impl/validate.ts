import { verify as verifyArtifacts } from "../shared/file-hash.ts";
import type { Event } from "./schema.ts";
import type { State } from "./state.ts";

export function begin({ state }: { state: State }) {
  state.implementing = true;
}
// Review owns coverage reconciliation; Impl owns the resulting revision and verification.
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
    state.revision = event.revision;
    state.verification = null;
    state.implementing = false;
    return;
  }
  if (state.implementing) {
    throw new Error("implementation outcome is required before verification");
  }
  if (event.revision !== state.revision) {
    if (event.previous_revision !== state.revision) {
      throw new Error("revision reconciliation must name the current previous_revision");
    }
    state.revision = event.revision;
  } else if (event.coverage !== undefined || event.previous_revision !== undefined) {
    throw new Error("coverage reconciliation on verification requires a new revision");
  }
  state.verification = event;
}

export function verifyEvidence({ root, state }: { root: string; state: State }) {
  const verification = state.verification;
  if (!verification || verification.outcome !== "passed") {
    throw new Error("current verification has not passed");
  }
  verifyArtifacts({ root, evidence: verification.evidence, recorded: verification.artifacts });
}
