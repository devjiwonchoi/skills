import type { Event } from "./schema.ts";
import type { State } from "./state.ts";

export function apply({
  state,
  event,
  revision,
  implementing,
}: {
  state: State;
  event: Event;
  revision: string | null;
  implementing: boolean;
}) {
  switch (event.type) {
    case "scope": {
      if (implementing || event.revision !== revision) {
        throw new Error("scope must target the current completed revision");
      }
      for (const section of event.additions) {
        if (state.coverage.has(section.id)) {
          throw new Error("scope section already exists");
        }
        state.coverage.set(section.id, {
          section,
          reviewedRevision: null,
          reason: event.reason,
          evidence: [],
        });
      }
      for (const id of event.reopen) {
        const item = state.coverage.get(id);
        if (!item) {
          throw new Error("unknown reopened section");
        }
        state.coverage.set(id, { ...item, reviewedRevision: null, reason: event.reason });
      }
      state.pass = null;
      break;
    }
    case "review_pass": {
      if (implementing || event.revision !== revision) {
        throw new Error("review must target the current completed revision");
      }
      for (const id of event.reviewed) {
        if (!state.coverage.has(id)) {
          throw new Error("unknown reviewed section");
        }
      }
      for (const finding of event.findings) {
        if (!event.reviewed.includes(finding.section_id)) {
          throw new Error("finding dispositions require review of their section in this pass");
        }
        const prior = state.findings.get(finding.id);
        if (prior && (prior.issue !== finding.issue || prior.section_id !== finding.section_id)) {
          throw new Error("finding ID must retain its issue and section identity");
        }
        if (!prior && finding.status !== "open") {
          throw new Error("new finding must be open");
        }
        if (
          [...state.findings.values()].some(
            (item) =>
              item.id !== finding.id &&
              item.issue === finding.issue &&
              item.section_id === finding.section_id,
          )
        ) {
          throw new Error("reuse the existing finding ID for this issue");
        }
        state.findings.set(finding.id, {
          ...finding,
          evidence: [...new Set([...(prior?.evidence ?? []), ...finding.evidence])],
        });
      }
      for (const id of event.reviewed) {
        const prior = state.coverage.get(id)!;
        state.coverage.set(id, {
          ...prior,
          reviewedRevision: event.revision,
          reason: null,
          evidence: event.evidence,
        });
      }
      state.pass = event;
      break;
    }
  }
}
