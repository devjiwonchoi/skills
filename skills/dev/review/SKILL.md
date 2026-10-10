---
name: review
description: Use when reviewing development changes.
---

## Steps

1. **Ground the review.** Read the approved alignment, current plan, approved baseline, cumulative plan diff, exact changes, and verification evidence.
2. **Get an independent review.** Give that context to a fresh reviewer who did not implement the changes.
   - Ask the reviewer to inspect the implementation for correctness, regressions, security, and maintainability where relevant.
   - Require actionable findings with affected locations, supporting evidence, and concrete failure scenarios.
   - If an independent reviewer is unavailable, disclose the limitation before reviewing the changes yourself.
3. **Resolve the result.** Validate findings against the changes and evidence. Distinguish supported findings from missing evidence or blocked review.
   - Route fixes through [$quick-impl](../quick-impl/SKILL.md), [$verify](../verify/SKILL.md), and a fresh review of the changed revision.
   - Return to [$plan](../plan/SKILL.md) or [$align](../align/SKILL.md) when resolving a finding would cross their decision boundaries.
4. **Record and hand off.** Report the reviewed revision, findings, unresolved evidence, and limitations.
   - Treat blocked or incomplete review as unresolved.
   - Hand the exact reviewed revision and evidence to `ship` when actionable findings are resolved and verification supports completion.
