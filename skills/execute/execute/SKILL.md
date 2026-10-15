---
name: execute
description: Use when carrying development implementation through verification and review.
---

## Rules

- Complete [explain](../../utils/explain/SKILL.md) and render its required visuals in chat before asking a question or requesting approval.

## Steps

When running under Auto, follow [execution recording](references/auto-mode.md). Otherwise, keep working context in the session without emitting workflow records or artifacts.

1. Read the authorized request, agreed intent, constraints, success criteria, and available plan. Without a plan, outline the approach and checks; wait for any required approval before implementation.
2. Resume at the first unfinished stage. Begin a new iteration only for initial work, unresolved findings, or newly authorized follow-up work after completion. Follow [Impl](../impl/SKILL.md) for initial work or supported findings. Stop if implementation or verification remains incomplete.
3. Follow [Review](../review/SKILL.md) once for the current revision. Pass retained findings and coverage. Stop if review remains incomplete.
4. Repeat from step 2 while validated P0–P2 findings remain unresolved. Review the fix delta and affected behavior after verification.
   - When no P0–P2 findings remain but required coverage is missing, repeat step 3 for uncovered or reopened sections only.
   - Stop and report a blocker if repeated rounds make no progress.
5. Confirm current verification passed, required review coverage is complete, no validated P0–P2 findings remain unresolved, and the working tree matches the checked revision. Report completion, the final revision, evidence, and remaining delivery work.
