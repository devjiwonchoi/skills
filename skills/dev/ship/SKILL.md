---
name: ship
description: Use when delivering development changes.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.

## Steps

1. Read the requested delivery, agreed intent and constraints, exact changes, and available check or review results. Gather missing required evidence; when independent review is required, use a fresh reviewer who did not implement the changes. Report unresolved required decisions, approvals, checks, or review and pause dependent delivery.
2. Preserve unrelated working-tree and staged changes. Group commits by purpose and dependency with brief what/why/how messages. Write reviewer-facing PR titles and descriptions from the final diff; base dependent PRs on their parent branches.
3. Honor prior decisions and permissions, treating commit, push, PR creation, merge, and deploy separately. For an unauthorized required action, present the prepared result and ask only for that action. Keep approved intent fixed; before changing it or materially changing approved plans, show cumulative differences from the last user-approved state, reason, and impact and await the user's decision.
4. Complete authorized delivery and inspect checks for the resulting revision. Refresh earlier checks or review affected by new changes before delivery. Report the exact delivered revision and links, check results distinguishing failed, pending, and blocked, and remaining blockers.
