---
name: verify
description: Use when verifying development work.
---

## Steps

1. **Establish the target.** Read the approved alignment, current plan, and implementation handoff. Identify the revision and any uncommitted changes being checked.
2. **Collect evidence.** Execute the planned checks and establish evidence for each alignment success criterion.
   - Keep source inspection, builds, tests, runtime behavior, and CI results distinct. State what each result proves.
   - Record the revision, checks performed, results, and relevant evidence.
   - Treat missing or unavailable checks as unresolved. Do not replace required evidence with assumptions or unrelated passing checks.
3. **Resolve failures.** Send reproducible failures and their evidence to [$quick-impl](../quick-impl/SKILL.md).
   - Route changes to the approach or verification requirements through [$plan](../plan/SKILL.md) for drift assessment.
   - Recheck affected criteria after fixes. Prior evidence remains usable only where the changes cannot affect its result.
   - If required evidence remains unresolved, report the gap and its impact without claiming successful verification.
4. **Hand off for review.** When required checks pass and all success criteria are supported, give `review` the verified revision, alignment and plan references, and evidence.
