---
name: plan
description: Use when planning development work.
---

## Rules

- Preserve the last user-approved version as the comparison baseline. Advance it only through explicit approval of a specific version.

## Steps

1. **Ground the plan.** Read the request, agreed intent, scope, constraints, success criteria, and any existing plan.
   - Use the user's existing decisions without requiring a separate agreement document. Resolve consequential gaps before dependent planning.
   - Check decision-relevant facts against local implementation, tests, documents, or authoritative sources applicable to the project.
2. **Design the work.** Design executable work from the available evidence. Save a versioned plan using the template below.
3. **Assess drift.** Compare the proposed plan with the agreed intent and approved baseline, including accumulated changes.
   - If the intent or constraints must change, preserve the agreement and present the diff, reason, and impact for explicit approval before affected work.
   - Revisions outside the agreed adaptation boundaries require approval.
   - Require approval for material changes to the approach or affected systems, changed external contracts, new external dependencies, or weaker verification.
   - Also require approval for changed delivery commitments, expanded delegation, or material increases in cost, effort, or delivery risk.
4. **Confirm and hand off.**
   - For initial plans or revisions requiring approval, present the full plan and wait for explicit approval before dependent execution.
     - Record the actual user response and approved version as the new baseline.
   - For permitted refinements, continue without renewed approval.
   - Provide the current plan's location and version, approved baseline, and agreed intent as the basis for implementation.

## Template

```markdown
# Plan

Version: <current revision>
Intent: <agreed goal, constraints, and success criteria, or their source reference>
Approved baseline: <preserved plan location, version, and actual user confirmation, or pending>

## Approach and evidence
<Strategy, reasons, tradeoffs, sources, and unresolved factual gaps.>

## Work units
<Executable units with intended changes, files or entry points, dependencies, and commit or PR boundaries where useful.>

## Verification
<Checks, expected evidence, and commands where applicable for each success criterion.>

## Adaptation boundaries
- Agent may refine: <Implementation choices delegated within this plan.>
- Ask the user: <Changes requiring approval and any agreed limits.>

## Changes from approved baseline
<Cumulative diff, reason, and impact, or none. State whether approval is required and why.>
```
