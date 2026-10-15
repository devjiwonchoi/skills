import type { Finding, Pass, Section } from "./schema.ts";

export type State = {
  coverage: Map<
    string,
    { section: Section; reviewedRevision: string | null; reason: string | null; evidence: string[] }
  >;
  findings: Map<string, Finding>;
  pass: Pass | null;
};
export function create({
  sections,
  reason,
  previous,
}: {
  sections: Section[];
  reason: string | undefined;
  previous: State | null;
}): State {
  if (
    previous &&
    [...previous.coverage.keys()].some((id) => !sections.some((section) => section.id === id))
  ) {
    throw new Error("a successor must retain existing review sections");
  }
  return {
    coverage: new Map(
      sections.map((section) => [
        section.id,
        {
          section,
          reviewedRevision: null,
          reason: reason ?? null,
          evidence: previous?.coverage.get(section.id)?.evidence ?? [],
        },
      ]),
    ),
    findings: new Map(previous?.findings),
    pass: null,
  };
}
export function reconcile({
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
    state.coverage.set(item.section_id, {
      ...prior,
      reviewedRevision: item.retain ? prior.reviewedRevision : null,
      reason: item.reason,
    });
  }
  state.pass = null;
}

// Report review facts. Execute decides whether to correct or request another pass.
export function context({ state }: { state: State }) {
  const pass = state.pass;
  const findings = [...state.findings.values()];
  const coverage = [...state.coverage.values()];
  const uncovered = coverage
    .filter((item) => item.reviewedRevision === null)
    .map((item) => item.section);
  return {
    pass,
    findings,
    coverage,
    unresolvedP0P2: findings.filter(
      (finding) => finding.status === "open" && finding.priority !== "P3",
    ),
    sections:
      uncovered.length > 0 ? uncovered : pass === null ? coverage.map((item) => item.section) : [],
  };
}
