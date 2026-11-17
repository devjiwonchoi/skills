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
   - Give the verifier only these inputs. Pass `ALIGN.approved.md` when that copy exists. Pass `ALIGN.md` only to diff against that copy. Pass review rules from the default branch or the frozen record-root copies. Pass the artifacts. Artifacts are the diff, produced output, or external state the proofs point at. Never pass the implementation conversation, reasoning, or self-assessment.
   - The frozen copies are `rules.md`, the `## Learned` rules in the preferences file, and `checklist.md` in the record root per the `task-recording` skill. Read repository review-rule files from the default branch. Do not read the contract or review rules from the revision under test, or from a file that revision adds or edits. A missing source adds nothing. When the default branch cannot be read, record the gap and do not use the revision's copy. Judge the end state items. Do not turn those review rules into extra end state items. The `review` skill applies `checklist.md`.
   - The verifier runs steps 2 and 3 and returns the judgment, including the evidence. The caller writes `VERIFY.md` and does not judge.
2. When `ALIGN.md` is present, run the `criteria-hash` script from the `task-recording` skill: `criteria-hash <ALIGN.md>`. It covers the full and light forms. Compare its digest to the `Criteria hash:` line in `ALIGN.approved.md` when that copy exists, otherwise to the line in `ALIGN.md`. A mismatch or a missing line fails. Leave the stored line and the copy unchanged.
   - Diff the `# End state` and `# Criteria` sections of `ALIGN.md` against `ALIGN.approved.md`. Flag when either section differs. When the copy is absent, record that and skip the diff.
3. Judge each end state item pass or fail against its proof. When `ALIGN.approved.md` exists, take the items, criteria, and proofs from it. When it does not, record the absence and take them from `ALIGN.md`. With neither, take the items from the request and record that. Do not take items, criteria, or proofs from the revision under test. A proof is a command, a test, a screenshot, or a URL. Run the command or test, or inspect the screenshot or URL, and cite what came back. An end state item is a numbered `##` heading under `# End state`. When that section has none, it is a success criterion, or a `Done when` line in the light form. Do not edit the work or weaken a proof. Describe reproducible failures. Missing evidence stays unresolved.
   - Flag a self-judging change when the diff modifies a judge for an item. A judge is a Playwright journey or spec file that the item's proof runs or cites, or a screenshot baseline matching `*-snapshots/*.png` that the proof uses. A Playwright journey or spec file is a `*.spec.*` or `*.journey.*` file Playwright runs, or a file in a Playwright journeys directory. A baseline directory named for a journey or spec belongs to that file.
   - Record `self-judging change` on that item in `VERIFY.md`, with the judge files. Count the item as proven only after 지원님 explicitly confirms it. Record that confirmation when 지원님 gives it. Do not confirm it yourself. A passing run of the modified judge is not confirmation.
4. Report one verification outcome for the checked revision. Include the hash result when one was checked, the drift flag, each `self-judging change`, each item as pass, fail, or unresolved with its evidence, and items met/total. An unconfirmed self-judging item is unmet. Claim success only when every end state item passes with evidence, no self-judging item is awaiting confirmation, the criteria hash matches, and, when the approved copy exists, the end state items and criteria match it. Record a same-session judgment as a self-check.
