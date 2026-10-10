---
name: plan
description: Use when planning development work.
---

## Rules

- Preserve the last user-approved version as the comparison baseline. Advance it only through explicit approval of a specific version.

## Steps

1. **Ground the plan.** Read the approved alignment and any existing plan.
   - If no approved alignment exists, use [$align](../align/SKILL.md) first.
   - Use [$research](../../utils/research/SKILL.md) for factual gaps that affect implementation decisions.
2. **Design the work.** Design executable work from the available evidence. Save a versioned plan using the template below.
3. **Assess drift.** Compare the proposed plan with the approved alignment and baseline, including accumulated changes.
   - If the alignment must change, pause affected work and return to `$align`.
   - Revisions outside the agreed adaptation boundaries require approval.
   - Require approval for material changes to the approach or affected systems, changed external contracts, new external dependencies, or weaker verification.
   - Also require approval for changed delivery commitments, expanded delegation, or material increases in cost, effort, or delivery risk.
4. **Confirm and hand off.**
   - For initial plans or revisions requiring approval, present the full plan and wait for explicit approval before dependent execution.
     - Record the actual user response and approved version as the new baseline.
   - For permitted refinements, continue without renewed approval.
   - Hand the current plan's location and version, approved baseline, and alignment reference to `quick-impl`.

## Template

```markdown
# Plan

Version: <current revision>
Alignment: <document location and approved version>
Approved baseline: <preserved plan location, version, and actual user confirmation, or pending>

## Approach and evidence
<Strategy, reasons, tradeoffs, sources, and unresolved factual gaps.>

## Work units
<Executable units with intended changes, files or entry points, dependencies, and commit or PR boundaries where useful.>

## Verification
<Checks, expected evidence, and commands where applicable for each alignment success criterion.>

## Adaptation boundaries
- Agent may refine: <Implementation choices delegated within this plan.>
- Ask the user: <Changes requiring approval and any agreed limits.>

## Changes from approved baseline
<Cumulative diff, reason, and impact, or none. State whether approval is required and why.>
```
