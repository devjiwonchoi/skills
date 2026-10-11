---
name: auto
description: Use when carrying a development task through completion.
---

## Rules

- Keep a durable checkpoint after each transition with the current stage, document locations and versions, approved baselines, change revision, evidence, and pending decisions or next action.

## Steps

1. **Resume the task.** Read the request and any checkpoint. Check the current artifacts before reusing completed work.
2. **Agree on the work.** Establish the problem, desired outcome, scope, constraints, success criteria, and delegated decisions from the user's request and available evidence.
   - Reuse settled decisions without requiring documents in a particular format.
   - Resolve consequential uncertainty with applicable sources or the user.
   - Obtain explicit approval of new agreements before dependent work.
   - Preserve approved intent. Present changed agreements with their diff, reason, and impact and wait for explicit approval before dependent work.
3. **Plan the implementation.** Define executable work units, dependencies, checks, and permitted refinements. Obtain approval of the initial plan before implementation.
   - Compare accumulated revisions with the last explicitly user-approved plan. Advance that baseline only through explicit approval of a specific version.
   - Seek approval for changes beyond delegated boundaries, material approach or system changes, changed contracts, new external dependencies, weaker checks, changed delivery commitments, or material increases in cost, effort, or risk.
4. **Implement and examine.** Make focused changes, execute the required checks, and collect evidence for each success criterion at the current revision.
   - Keep inspection, tests, builds, runtime, and CI evidence distinct. Missing required evidence remains unresolved.
   - Have a fresh reviewer examine the changes when available. Validate actionable findings against the changes and evidence and disclose limits on independent review.
   - Correct supported failures and findings, then repeat affected checks and review. Reassess changed intent or plans before continuing affected work.
   - If repeated attempts produce no new evidence or progress, report the blocker and the decision needed.
5. **Deliver and report.** Prepare the requested delivery with coherent commits and a description of the final changes and verification.
   - Pause dependent delivery while required decisions or evidence remain unresolved. Treat committing, pushing, opening a PR, merging, and deploying as distinct authorized actions.
   - Prepare reviewable artifacts before asking for missing authorization. Use permission already provided in the conversation.
   - Confirm the delivered revision and report evidence, resource links, and any remaining work or pending human decision.
