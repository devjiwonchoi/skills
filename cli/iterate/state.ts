import { isDeepStrictEqual } from "node:util";

import { create as implementation, next as implementationNext } from "../impl/state.ts";
import { apply as implement, begin } from "../impl/validate.ts";
import { create as reviewState, context, reconcile } from "../review/state.ts";
import { apply as reviewEvent } from "../review/validate.ts";
import type { Event } from "./schema.ts";

export type State = {
  impl: ReturnType<typeof implementation>;
  review: ReturnType<typeof reviewState>;
  round: number;
  blocker: string | null;
};
// Iterate only coordinates stage readiness and correction rounds.
export function next({ state }: { state: State }) {
  const review = context({ state: state.review });
  const common = {
    revision: state.impl.revision,
    round: state.round,
    implementing: state.impl.implementing,
    findings: review.findings,
    coverage: review.coverage,
    verification: state.impl.verification,
  };
  if (state.blocker) {
    return { ...common, action: "blocked", reason: state.blocker };
  }
  const impl = implementationNext({ state: state.impl });
  if (impl.action === "impl" && impl.step === "quick-impl") {
    return { ...common, ...impl, unresolvedP0P2: review.unresolvedP0P2 };
  }
  if (review.pass?.outcome === "incomplete") {
    return { ...common, action: "recover", stage: "review", reason: review.pass.gaps.join("\n") };
  }
  if (impl.action !== "complete") {
    if (impl.action === "blocked") {
      return { ...common, action: "recover", stage: "verify", reason: impl.reason };
    }
    return { ...common, ...impl };
  }
  if (review.pass && review.unresolvedP0P2.length > 0) {
    return { ...common, action: "impl", step: "quick-impl", unresolvedP0P2: review.unresolvedP0P2 };
  }
  if (review.sections.length > 0 || !review.pass) {
    return { ...common, action: "review", sections: review.sections };
  }
  return { ...common, action: "complete" };
}
function executionEvent({ state, event }: { state: State; event: Event }) {
  switch (event.type) {
    case "iteration": {
      const work = next({ state });
      if (state.impl.implementing) {
        throw new Error("resume the current implementation iteration");
      }
      const correction =
        (work.action === "impl" && "step" in work && work.step === "quick-impl") ||
        work.action === "recover";
      if (!correction && !(work.action === "complete" && event.reason)) {
        throw new Error(
          "iteration requires implementation work from next or authorized follow-up with a reason",
        );
      }
      if (event.round !== state.round + 1) {
        throw new Error("iteration rounds must be consecutive");
      }
      const pending = context({ state: state.review })
        .unresolvedP0P2.map((finding) => finding.id)
        .sort();
      if (!isDeepStrictEqual([...event.findings].sort(), pending)) {
        throw new Error("iteration must retain all unresolved P0–P2 findings");
      }
      state.round = event.round;
      begin({ state: state.impl });
      break;
    }
    case "blocked": {
      state.blocker = event.reason;
      break;
    }
    case "resumed": {
      if (!state.blocker) {
        throw new Error("no recorded blocker to resume");
      }
      state.blocker = null;
      break;
    }
    case "completed": {
      if (next({ state }).action !== "complete") {
        throw new Error("execution criteria are not complete");
      }
      break;
    }
    case "start":
      throw new Error("start is only allowed at the version header");
  }
}

// A shared lock and replay preserve ordering across different stage commands.
export function apply({ state, event }: { state: State; event: Event }) {
  if (state.blocker && event.type !== "resumed") {
    throw new Error("resolve the recorded blocker before advancing");
  }
  switch (event.type) {
    case "impl_started":
    case "implemented":
    case "verified": {
      const changed =
        event.type === "implemented" ||
        (event.type === "verified" && event.revision !== state.impl.revision);
      implement({ state: state.impl, event });
      if (changed) {
        reconcile({ state: state.review, coverage: event.coverage });
      }
      return;
    }
    case "scope":
    case "review_pass":
      return reviewEvent({
        state: state.review,
        event,
        revision: state.impl.revision,
        implementing: state.impl.implementing,
      });
    default:
      return executionEvent({ state, event });
  }
}
export function startVersion({
  header,
  priorState,
}: {
  header: Extract<Event, { type: "start" }>;
  priorState: State | null;
}): State {
  return {
    impl: implementation({ revision: header.revision }),
    review: reviewState({
      sections: header.scope,
      reason: header.reason,
      previous: priorState?.review ?? null,
    }),
    round: 0,
    blocker: null,
  };
}
