---
name: plan
description: Use when planning development work.
---

## Rules

- Complete [explain](../../utils/explain/SKILL.md) and render its required visuals in chat before asking a question or requesting approval.

## Steps

1. **Agree.** Read the request and existing agreement or plan.
   - For consequential open decisions, follow [align](../align/SKILL.md)'s Ground and Clarify steps.
   - Reuse an unchanged approved agreement.
   - Otherwise present a brief intent and scope draft for user review first. Follow [align](../align/SKILL.md) to discuss open decisions, revise with user feedback, and obtain explicit approval before detailed planning.
2. **Design.** Use [three-steps](../../utils/three-steps/SKILL.md) before writing executable work as a versioned plan using the template.
   - Keep the version during agent review and refinements within the original plan. Increment it only when necessary changes diverge from that plan. Preserve the original plan and last approved content for cumulative comparison.
   - When Auto supplies a task directory, use its plan path and [state contract](../../auto/references/state.md) for document versions and approval events.
   - Before confirmation, build and show a lightweight prototype, PoC, or simulation of the proposed result and affected flow from start to finish.
   - Limit pre-approval implementation to this preview. Distinguish observed behavior from simulated or unverified outcomes.
   - Incorporate user feedback into the plan before approval.
3. **Debate.** Always read and follow the [multi-agent debate](references/debate.md) to review and revise the plan before confirmation.
   - If consensus is incomplete, return the pending plan and unresolved issues without advancing to confirmation.
4. **Assess drift.** Compare cumulative changes with agreed intent and the last explicitly approved plan.
   - Require approval for changed intent or constraints, changes beyond delegated limits, material approach or system changes, changed external contracts, new external dependencies, weaker checks, changed delivery commitments, expanded delegation, or material increases in cost, effort, or risk.
   - Preserve prior approvals and show the cumulative diff, reason, and impact before affected work.
5. **Confirm.** Present initial plans and approval-required revisions in full.
   - Stay in planning until the user explicitly approves the specific plan version. Agreement approval, agent consensus, and requests to refine the plan do not count as plan approval.
   - Record that approval before dependent execution. Advance the approved baseline only through that confirmation. Continue permitted refinements without renewed approval.
6. **Continue.** For standalone work, offer [Auto](../../auto/SKILL.md) after approval. If requested at any stage, hand off task documents and approval records.

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
