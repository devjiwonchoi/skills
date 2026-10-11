---
name: plan
description: Use when planning development work.
---

## Steps

1. **Agree.** Read the request and existing agreement or plan.
   - Reuse an unchanged approved agreement.
   - Otherwise present a brief intent and scope draft for user review first. Follow [align](../align/SKILL.md) to discuss open decisions, revise with user feedback, and obtain explicit approval before detailed planning.
2. **Design.** Write executable work as a versioned plan using the template.
   - When Auto supplies a task directory, use its plan path and [state contract](../../auto/references/state.md) for document versions and approval events.
3. **Debate.** Always read and follow the [multi-agent debate](references/debate.md) to review and revise the plan before confirmation.
   - If consensus is incomplete, return the pending plan and unresolved issues without advancing to confirmation.
4. **Assess drift.** Compare cumulative changes with agreed intent and the last explicitly approved plan.
   - Require approval for changed intent or constraints, changes beyond delegated limits, material approach or system changes, changed external contracts, new external dependencies, weaker checks, changed delivery commitments, expanded delegation, or material increases in cost, effort, or risk.
   - Preserve prior approvals and show the cumulative diff, reason, and impact before affected work.
5. **Confirm.** Present initial plans and approval-required revisions in full. Follow [explain](../../utils/explain/SKILL.md) to explain the plan before requesting confirmation. Record the user's explicit confirmation of the specific version before dependent execution. Advance the approved baseline only through that confirmation. Continue permitted refinements without renewed approval.

## Template

Write in the user's language.

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
