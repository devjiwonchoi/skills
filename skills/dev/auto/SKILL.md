---
name: auto
description: Use when carrying a development task through completion.
---

## Steps

1. **Align.** Establish the problem, outcome, scope, constraints, success criteria, and delegated decisions. Reuse settled decisions; resolve consequential uncertainty through code, sources, or the user.
   - Obtain the user's explicit approval for new agreements. Preserve approved intent; changes need a diff, reason, impact, and explicit approval before dependent work.
2. **Plan.** Define executable units, dependencies, checks, and permitted refinements; obtain initial approval before implementation.
   - Compare cumulative changes with the last explicitly approved plan; advance its baseline only through approval of a specific version.
   - Seek approval beyond delegated limits, including material approach/system changes, changed contracts, new external dependencies, weaker checks, changed delivery commitments, or material increases in cost, effort, or risk.
3. **Execute.** Make focused changes, run required checks, and collect evidence for every success criterion at the current revision.
   - Distinguish inspection, tests, builds, runtime, and CI evidence; missing evidence remains unresolved.
   - Use a fresh reviewer who did not implement the changes; disclose limits if unavailable.
   - Validate findings, correct supported issues, and repeat affected checks and review within approved intent and plan limits. Reuse evidence only where changes cannot affect it.
   - If retries yield no new evidence or progress, report the blocker and needed decision.
4. **Ship.** Prepare coherent commits and reviewer-facing descriptions. Resolve required decisions and evidence before dependent delivery.
   - Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Prepare reviewable results before requesting missing authorization.
   - Complete authorized delivery and monitor CI and review feedback on the resulting revision. Within authorization, fix regressions and supported bot findings, verify and publish corrections, and recheck until required CI passes and bot reviews finish with no unresolved findings.
   - Inspect each retry of suspected flaky checks. Report human feedback, blockers, or iteration without progress and wait for a decision.
   - Confirm the final revision and report evidence, links, readiness for human review, and pending decisions.
