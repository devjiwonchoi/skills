import type { Event } from "./schema.ts";

export type State = {
  revision: string | null;
  implementing: boolean;
  verification: Extract<Event, { type: "verified" }> | null;
};
export function create({ revision }: { revision: string | null }): State {
  return { revision, implementing: false, verification: null };
}
// Impl selects the first unfinished stage. Execute coordinates the outer review loop.
export function next({ state }: { state: State }) {
  if (state.implementing || state.revision === null) {
    return { action: "impl", step: "quick-impl" };
  }
  if (!state.verification) {
    return { action: "impl", step: "verify" };
  }
  if (state.verification.outcome !== "passed") {
    return { action: "blocked", reason: state.verification.gaps.join("\n") };
  }
  return { action: "complete" };
}
