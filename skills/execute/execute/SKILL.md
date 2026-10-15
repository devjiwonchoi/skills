---
name: execute
description: Use when carrying development implementation through verification and review.
---

## Rules

- Complete [explain](../../utils/explain/SKILL.md) and render its required visuals in chat before asking a question or requesting approval.

## Steps

When running under Auto, read [execution recording](references/auto-mode.md) and initialize the execution journal before working stages record their outcomes.

When Auto supplies a task directory, follow its [state contract](../../auto/references/state.md) throughout implementation, verification, and review. Record meaningful work starts and outcomes before advancing, and the current state before yielding.

1. Read the authorized request, agreed intent, constraints, success criteria, and available plan. Without a plan, outline the approach and checks; wait for any required approval before implementation.
2. Make focused changes within approved intent and plan limits. Compare cumulative changes with the last approved plan, or the original request and decisions; show the diff, reason, and impact and obtain approval before material changes or work beyond delegated limits.
3. Verify every success criterion at the current revision, distinguishing inspection, tests, builds, runtime, and CI evidence. Missing evidence remains unresolved.
4. Follow [Review](../review/SKILL.md) for the current revision.
5. If iteration yields no new evidence or progress, report the blocker and needed decision. Otherwise report the completed revision, evidence, and remaining delivery work.
