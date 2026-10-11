---
name: verify
description: Use when verifying development work.
---

## Steps

1. **Establish the target.** Read the requested behavior, success criteria, and any existing plan or implementation notes. Identify the revision and any uncommitted changes being checked.
   - Derive the required checks from the request and relevant implementation when no plan or handoff exists.
2. **Collect evidence.** Execute the required checks and establish evidence for each success criterion.
   - Keep source inspection, builds, tests, runtime behavior, and CI results distinct. State what each result proves.
   - Record the revision, checks performed, results, and relevant evidence.
   - Treat missing or unavailable checks as unresolved. Do not replace required evidence with assumptions or unrelated passing checks.
3. **Handle failures.** Record reproducible failures, supporting evidence, and what needs correction.
   - Apply corrections only within existing authorization. A request to verify does not itself authorize implementation changes.
   - Recheck affected criteria after corrections. Prior evidence remains usable only where changes cannot affect its result.
   - Do not weaken required checks to claim success. Seek a human decision when necessary changes exceed agreed limits.
4. **Report the outcome.** Present the checked revision, criterion-by-criterion results, evidence, failures, and unresolved gaps with their impact.
   - Claim successful verification only when required checks pass and all success criteria are supported.
