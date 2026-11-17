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
   - Give the verifier only these inputs: `ALIGN.md` when it exists, otherwise the request; `ALIGN.approved.md` when that copy exists; and the artifacts. Artifacts are the diff, produced output, or external state the proofs point at. Never pass the implementation conversation, reasoning, or self-assessment.
   - The verifier runs steps 2 and 3 and returns the judgment, including the evidence. The caller writes `VERIFY.md` and does not judge.
2. When `ALIGN.md` is present, run the `criteria-hash` script from the `task-recording` skill: `criteria-hash <ALIGN.md>`. It covers the full and light forms. Compare its digest to the `Criteria hash:` line in `ALIGN.approved.md` when that copy exists, otherwise to the line in `ALIGN.md`. A mismatch or a missing line fails. Leave the stored line and the copy unchanged.
   - Diff the `# End state` and `# Criteria` sections of `ALIGN.md` against `ALIGN.approved.md`. Flag when either section differs. When the copy is absent, record that and skip the diff.
3. Judge each end state item pass or fail against its proof. A proof is a command, a test, a screenshot, or a URL. Run the command or test, or inspect the screenshot or URL, and cite what came back. An end state item is a numbered `##` heading under `# End state`. When that section has none, it is a success criterion, or a `Done when` line in the light form. With no `ALIGN.md`, take the items from the request and record that in `VERIFY.md`. Do not edit the work or weaken a proof. Describe reproducible failures. Missing evidence stays unresolved.
4. Report one verification outcome for the checked revision. Include the hash result when one was checked, the drift flag, each item as pass, fail, or unresolved with its evidence, and items met/total. Claim success only when every end state item passes with evidence, the criteria hash matches, and, when the approved copy exists, the end state items and criteria match it. Record a same-session judgment as a self-check.
