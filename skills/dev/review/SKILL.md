---
name: review
description: Use when reviewing development changes.
---

## Steps

1. **Ground the review.** Read the request, agreed intent and constraints, actual changes, and any available plan or verification evidence.
2. **Get an independent review.** Give that context to a fresh reviewer who did not implement the changes.
   - Ask the reviewer to inspect the implementation for correctness, regressions, security, and maintainability where relevant.
   - Require actionable findings with affected locations, supporting evidence, and concrete failure scenarios.
   - If an independent reviewer is unavailable, disclose the limitation before reviewing the changes yourself.
3. **Validate and resolve findings.** Check each finding against the changes and evidence. Gather missing evidence needed to assess it.
   - Distinguish supported defects from missing evidence or blocked review.
   - When corrections are authorized, make focused fixes, run the affected checks, and obtain a fresh review of the changed revision.
   - Otherwise, report actionable fixes without modifying the implementation.
   - If a fix would change approved intent or exceed agreed adaptation boundaries, show accumulated differences from the last user-approved state, reason, and impact and pause affected work for the user's decision.
4. **Report the result.** State the reviewed revision, supported findings and affected locations, remaining evidence gaps, and limitations.
   - Treat blocked or incomplete review as unresolved.
