---
name: verify
description: Use when verifying development work.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.

## Steps

1. Identify the requested behavior, success criteria, and checked revision, including uncommitted changes. Read available plans or notes; derive missing checks from the request and implementation.
2. Run required checks and record evidence for each criterion. Distinguish source inspection, builds, tests, runtime, and CI results and what they prove. Missing checks remain unresolved; assumptions or unrelated passes cannot replace required evidence.
3. Record reproducible failures and needed corrections. Verification alone does not authorize changes; correct only within existing authorization and seek a human decision beyond agreed limits. Never weaken required checks. Recheck affected criteria; reuse evidence only where changes cannot affect it.
4. Report the checked revision, criterion results, evidence, failures, and unresolved gaps with their impact. Claim success only when required checks pass and every criterion has evidence.
