---
name: verify
description: Use when verifying development work.
---

## Options

- By default, hand judgment to a fresh subagent that did not implement the work.
- Without subagents, judge in the current session and record the pass as a self-check.

## Steps

Follow the `execution-recording` skill for every invocation, including standalone use.

1. Identify the checked revision, including uncommitted changes, or the produced output or external state when no files changed.
   - Give the verifier only these inputs: `ALIGN.md` when it exists, otherwise the request; `ALIGN.approved.md` when that copy exists; and the artifacts. Artifacts are the diff, Playwright results, produced output, or external state the proofs point at. Never pass the implementation conversation, reasoning, or self-assessment.
   - The verifier runs steps 2 through 4 and returns the judgment, including the evidence. The caller writes `VERIFY.md` and does not judge.
2. When `ALIGN.md` is present, run `criteria-hash <ALIGN.md>` from the `task-recording` skill. It covers the full and light forms. Compare its digest to the `Criteria hash:` line in `ALIGN.approved.md` when that copy exists, otherwise to the line in `ALIGN.md`. A mismatch or a missing line fails. Leave the stored line and the copy unchanged.
   - Diff the `# End state` and `# Criteria` sections of `ALIGN.md` against `ALIGN.approved.md`. Flag when either section differs. When the copy is absent, record that and skip the diff.
   - Run `e2e-workflow diff <ALIGN.md> <ALIGN.approved.md>` from the `align` skill folder when the copy exists. `drift` flags the E2E workflow diagram. `invalid` fails the check. When the copy is absent, run `e2e-workflow check <ALIGN.md>` and record that the diagram was not frozen. Do not redraw the diagram or rewrite the copy.
3. Judge each end state item pass or fail against its proof. Do not edit the work or weaken a proof. Describe reproducible failures. Missing evidence stays unresolved.
   - An end state item is a numbered `##` heading under `# End state`. The `## E2E workflow` heading is the diagram, not an item. When that section has no numbered headings, an item is a success criterion, or a `Done when` line in the light form. With no `ALIGN.md`, take the items from the request and record that in `VERIFY.md`.
   - A proof `E2E: <node-id>` passes only when the Playwright test titled with that node id passed in the spec file named by that node's journey. Cite the spec file and the test result. A missing spec, an ambiguous basename, or a missing test fails. When Playwright could not run, record unresolved.
   - A proof written `- Proof: file` plus a path passes only when the checked change's git diff shows that path with the change the approved files list states. Cite the diff.
   - A command, test, screenshot, or URL proof is judged as before. Run the command or test, or inspect the screenshot or URL, and cite what came back.
4. Judge every node id from `e2e-workflow check` on `ALIGN.approved.md`, or on `ALIGN.md` when the copy is absent. Record pass, fail, or unresolved by node id. When that check fails, record the failure and do not invent node results. Do not draw a replacement diagram.
   - A node in a journey passes when the Playwright test titled with its node id passed in the spec file whose basename is that journey's label. A failed or missing test fails. When Playwright could not run, record unresolved and the blocker.
   - A node outside a journey has no Playwright test. It passes when the checked change's git diff matches the approved `# Files` list. It also passes when that list is absent and the checked change has no file diff. It fails when the diff and the list disagree, or when the list is absent and the checked change has a file diff. Cite the diff.
   - When `# Files` is in the approved contract, compare the git diff with that list even if every node is in a journey. `NEW` is an added path, `MODIFIED` is a changed path, and `DELETED` is a removed path. A listed path with a different change fails. Any other path in the checked change fails.
5. Report one verification outcome for the checked revision. Include the hash result when one was checked, the section drift flag, the diagram result (`match`, `drift`, or `invalid`), each item and each node id as pass, fail, or unresolved with its evidence, and items met/total plus nodes met/total. Claim success only when every end state item and every node passes with evidence, the criteria hash matches, the files list matches the diff when that list exists, and, when the approved copy exists, the end state, the E2E workflow diagram, and the criteria match it. Record a same-session judgment as a self-check.
