---
name: plan
description: Use when planning development work.
---

## Steps

1. **Ground.** Read the request, agreed intent, constraints, success criteria, and existing plan. Resolve consequential gaps against code, sources, or the user; no separate agreement document is required.
2. **Design.** Write executable work as a versioned plan using the template.
3. **Assess drift.** Compare cumulative changes with agreed intent and the last explicitly approved plan.
   - Require approval for changed intent or constraints, changes beyond delegated limits, material approach or system changes, changed external contracts, new external dependencies, weaker checks, changed delivery commitments, expanded delegation, or material increases in cost, effort, or risk.
   - Preserve prior approvals and show the cumulative diff, reason, and impact before affected work.
4. **Confirm.** Present initial plans and approval-required revisions in full; record the user's explicit confirmation of the specific version before dependent execution. Advance the approved baseline only through that confirmation. Continue permitted refinements without renewed approval.

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
