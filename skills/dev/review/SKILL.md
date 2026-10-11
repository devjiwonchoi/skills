---
name: review
description: Use when reviewing development changes.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.

## Steps

1. Read the request, agreed intent and constraints, actual changes, and available planning or verification evidence.
2. Give that context to a fresh reviewer who did not implement the changes. Request relevant correctness, regression, security, and maintainability findings with locations, evidence, and concrete failure scenarios. If unavailable, disclose that limitation before reviewing yourself.
3. Validate findings and gather missing evidence. Apply focused fixes only when authorized, run affected checks, and obtain fresh review of the changed revision; otherwise report actionable fixes. Before changing approved intent or exceeding agreed adaptation boundaries, show cumulative differences from the last user-approved state, reason, and impact and pause affected work for a decision.
4. Report the reviewed revision, supported findings and locations, evidence gaps, and limitations. Keep blocked or incomplete review unresolved.
