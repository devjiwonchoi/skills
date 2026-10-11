---
name: auto
description: Use when carrying a development task through completion.
---

## Steps

1. **Agree.** Establish the problem, outcome, scope, constraints, success criteria, and delegated decisions. Reuse settled decisions; resolve consequential uncertainty through code, sources, or the user.
   - Obtain the user's explicit approval for new agreements. Preserve approved intent; changes need a diff, reason, impact, and explicit approval before dependent work.
2. **Plan.** Define executable units, dependencies, checks, and permitted refinements; obtain initial approval before implementation.
   - Compare cumulative changes with the last explicitly approved plan; advance its baseline only through approval of a specific version.
   - Seek approval beyond delegated limits, including material approach/system changes, changed contracts, new external dependencies, weaker checks, changed delivery commitments, or material increases in cost, effort, or risk.
3. **Implement and examine.** Make focused changes, run required checks, and collect evidence for every success criterion at the current revision.
   - Distinguish inspection, tests, builds, runtime, and CI evidence; missing evidence remains unresolved.
   - Use a fresh reviewer who did not implement the changes; disclose limits if unavailable.
   - Validate findings, correct supported issues, and repeat affected checks and review within approved intent and plan limits. Reuse evidence only where changes cannot affect it.
   - If retries yield no new evidence or progress, report the blocker and needed decision.
4. **Deliver.** Prepare coherent commits and reviewer-facing descriptions. Resolve required decisions and evidence before dependent delivery.
   - Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Prepare reviewable results before requesting missing authorization.
   - Complete authorized delivery; confirm the resulting revision and report evidence, links, remaining work, and pending decisions.
