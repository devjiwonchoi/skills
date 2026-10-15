---
name: verify
description: Use when verifying development work.
---

## Steps

Follow [execution recording](../iterate/references/recording.md) for every invocation, including standalone use.

1. Identify success criteria and the checked revision, including uncommitted changes. Derive checks from the request, available plans, and implementation.
2. Run the approved checks and save actual evidence files for each criterion. Distinguish inspection, builds, tests, runtime, and CI results by what they prove; missing evidence remains unresolved.
3. Describe reproducible failures. Correct only within existing authorization; seek a decision beyond agreed limits and never weaken required checks. Recheck affected criteria; reuse evidence only where changes cannot affect it.
4. Report one verification outcome for the checked revision, evidence, and unresolved gaps. Reconcile coverage if authorized fixes changed the revision. Report criterion results and claim success only when required checks pass and every criterion has evidence.
