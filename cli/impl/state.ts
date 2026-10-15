import type { Event } from "./schema.ts";

export type State = {
  coverage: Map<
    string,
    {
      section: { id: string; path: string; behavior: string };
      reviewedRevision: string | null;
      reason: string | null;
      evidence: string[];
    }
  >;
  revision: string | null;
  implementing: boolean;
  verification: Extract<Event, { type: "verified" }> | null;
};
export function create({
  revision,
  sections,
  reason,
}: {
  revision: string | null;
  sections: { id: string; path: string; behavior: string }[];
  reason: string | undefined;
}): State {
  return {
    revision,
    implementing: false,
    verification: null,
    coverage: new Map(
      sections.map((section) => [
        section.id,
        { section, reviewedRevision: null, reason: reason ?? null, evidence: [] },
      ]),
    ),
  };
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
