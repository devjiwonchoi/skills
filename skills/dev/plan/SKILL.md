---
name: plan
description: Use when planning development work.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.
- Compare against the last explicitly approved plan; advance that baseline only through explicit approval of a specific version.

## Steps

1. **Ground.** Read the request, agreed intent, constraints, success criteria, and existing plan. A separate agreement document is optional. Resolve consequential gaps against relevant sources or the user before dependent planning.
2. **Design.** Save executable work as a versioned plan using the template.
3. **Assess drift.** Compare accumulated changes with the agreed intent and approved baseline.
   - Require approval for changed intent or constraints, changes outside delegated boundaries, material approach or system changes, changed external contracts, new external dependencies, weaker checks, changed delivery commitments, expanded delegation, or material increases in cost, effort, or risk.
   - Preserve prior approvals and show the cumulative diff, reason, and impact before affected work.
4. **Confirm.** Present initial plans and approval-required revisions in full; record the user's explicit confirmation and version before dependent execution. Continue permitted refinements without renewed approval. Hand off the current plan's location/version and approved baseline.

## Template

```markdown
# Plan

Version: <current version>
Intent: <Agreed goal, constraints, and success criteria or source.>
Approved baseline: <Preserved version/location and actual confirmation, or pending.>

## Approach and evidence
<Strategy, reasons, tradeoffs, sources, and factual gaps.>

## Work units
<Changes, files or entry points, dependencies, and useful commit/PR boundaries.>

## Verification
<Checks, expected evidence, and applicable commands per success criterion.>

## Adaptation boundaries
- Agent may refine: <Delegated implementation choices.>
- Ask the user: <Reserved changes and limits.>

## Changes from approved baseline
<Cumulative diff, reason, impact, and whether approval is required and why, or none.>
```
