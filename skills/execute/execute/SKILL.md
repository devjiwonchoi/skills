---
name: execute
description: Use when carrying development implementation through verification and review.
---

## Steps

When Auto supplies a task directory, read its [state contract](../../auto/references/state.md). Throughout the steps below, record each meaningful work-unit start and observed outcome, including verification, review, retries, and blockers, before advancing. Keep status and the next action current before yielding. Standalone invocation does not initialize Auto state.

1. Read the authorized request, agreed intent, constraints, success criteria, and available plan. Without a plan, outline the approach and checks; wait for any required approval before implementation.
2. Make focused changes within approved intent and plan limits. Compare cumulative changes with the last approved plan, or the original request and decisions; show the diff, reason, and impact and obtain approval before material changes or work beyond delegated limits.
3. Verify every success criterion at the current revision, distinguishing inspection, tests, builds, runtime, and CI evidence. Missing evidence remains unresolved.
4. Obtain review from a fresh reviewer who did not implement the changes; disclose the limitation if unavailable. Validate findings, correct supported issues within authorization, and repeat affected checks and review until required criteria pass and supported findings are resolved.
5. If iteration yields no new evidence or progress, report the blocker and needed decision. Otherwise report the completed revision, evidence, and remaining delivery work.
