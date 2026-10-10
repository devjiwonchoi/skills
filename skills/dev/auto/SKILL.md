---
name: auto
description: Use when carrying a development task through completion.
---

## Rules

- Keep a durable checkpoint after each transition with the current stage, document locations and versions, approved baselines, change revision, evidence, and pending decisions or next action.

## Steps

1. **Resume the task.** Read the request and any checkpoint. Check the current artifacts before reusing completed work.
2. **Align and plan.** Use [$align](../align/SKILL.md) for missing or changed intent and [$plan](../plan/SKILL.md) for missing or amended plans.
   - Reuse an unchanged approved alignment and a valid current plan.
   - Wait for required human decisions before dependent work.
3. **Implement and iterate.** Run [$quick-impl](../quick-impl/SKILL.md), [$verify](../verify/SKILL.md), and [$review](../review/SKILL.md) in order.
   - Repeat the affected stages for supported failures and findings.
   - Route plan changes through `$plan` and intent changes through `$align` before continuing affected work.
   - If repeated attempts produce no new evidence or progress, report the blocker and the decision needed.
4. **Deliver.** Use [$ship](../ship/SKILL.md) for the requested delivery within the user's authorized scope.
5. **Report the outcome.** State what completed, its evidence and resource links, and any remaining work or pending human decision.
