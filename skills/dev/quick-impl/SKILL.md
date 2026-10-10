---
name: quick-impl
description: Use when implementing planned development work.
---

## Steps

1. **Resume the plan.** Read the approved alignment, current plan, and any verification or review findings.
   - If the plan is missing or required approval is pending, use [$plan](../plan/SKILL.md) before dependent implementation.
2. **Implement the work.** Make the smallest coherent changes that fulfill the plan, reusing existing patterns where suitable.
   - Address supported verification failures and review findings within the plan's adaptation boundaries.
   - Use [$research](../../utils/research/SKILL.md) for consequential factual gaps.
   - Route plan amendments through `$plan` for cumulative drift assessment. Pause affected work while required approval is pending.
   - Keep the approved alignment unchanged. If its intent or constraints must change, return through `$plan` to [$align](../align/SKILL.md).
3. **Hand off for verification.** Give `verify` the changed revision, changes made, completed work units, remaining work, and alignment and plan references.
   - Distinguish implemented behavior from verified behavior.
   - Repeat implementation when verification or review returns actionable findings.
