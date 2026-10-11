---
name: quick-impl
description: Use when implementing development work.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.

## Steps

1. Read the authorized request, constraints, and available plans or findings. Without a plan, outline the approach, work units, and checks; this does not establish approval. Pause dependent work for missing or pending required approval.
2. Make the smallest coherent changes, reusing existing patterns. Resolve consequential factual gaps from implementation or authoritative sources and address supported findings within authorization.
   - Compare cumulative changes with the last actual user-approved plan, or the original request and decisions. Never change approved intent or constraints automatically.
   - For changes beyond agreed limits, show the cumulative diff, reason, and impact; pause affected work for a human decision. Include material changes to approach or contracts, new external dependencies, weaker checks, or materially increased cost, effort, or risk.
3. Report the changed revision, concrete changes, completed and remaining work, and check results, distinguishing implemented from verified behavior. Continue authorized corrections for supported issues.
