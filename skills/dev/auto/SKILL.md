---
name: auto
description: Use when carrying a development task through completion.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.

## Steps

1. **Agree.** Read the request and current artifacts before reusing completed work. Establish the problem, outcome, scope, constraints, success criteria, and delegated decisions; reuse settled decisions and resolve consequential uncertainty through sources or the user.
   - Obtain explicit approval for new agreements. Preserve approved intent; changes need a diff, reason, impact, and explicit approval before dependent work.
2. **Plan.** Define executable units, dependencies, checks, and permitted refinements; obtain initial approval before implementation.
   - Compare cumulative changes with the last explicitly approved plan; advance its baseline only through approval of a specific version.
   - Seek approval beyond delegated boundaries, including material approach/system changes, changed contracts, new external dependencies, weaker checks, changed delivery commitments, or material increases in cost, effort, or risk.
3. **Implement and examine.** Make focused changes, run required checks, and collect evidence for every success criterion at the current revision.
   - Distinguish inspection, tests, builds, runtime, and CI evidence; missing required evidence remains unresolved.
   - Use a fresh reviewer when available, validate actionable findings, and disclose independent-review limits.
   - Correct supported failures and findings, repeat affected checks and review, and reassess changed intent or plans before affected work.
   - If retries yield no new evidence or progress, report the blocker and needed decision.
4. **Deliver.** Prepare coherent commits and reviewer-facing descriptions of the final changes and evidence.
   - Pause dependent delivery for unresolved required decisions or evidence. Honor existing permissions; committing, pushing, opening a PR, merging, and deploying require distinct authorization.
   - Prepare reviewable artifacts before requesting missing authorization. Confirm the delivered revision and report evidence, links, remaining work, and pending decisions.
