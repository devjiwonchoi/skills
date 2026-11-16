---
name: verify
description: Use when verifying development work.
---

## Options

- By default, hand judgment to a fresh subagent that did not implement the work.
- Without subagents, judge in the current session and record the pass as a self-check.

## Steps

Follow the `execution-recording` skill for every invocation, including standalone use.

1. Identify the checked revision, including uncommitted changes, or the produced output or external state when no files changed. Collect evidence for each stated proof.
   - Give the judge only `ALIGN.md` when it exists, otherwise the request, plus the diff or produced output and that evidence. Never pass the implementation conversation, reasoning, or self-assessment.
   - The judge runs steps 2 and 3 and returns the judgment. The caller writes `VERIFY.md`.
2. When `ALIGN.md` is present, run the `criteria-hash` script from the `task-recording` skill: `criteria-hash <ALIGN.md>`. It covers the full and light forms. Compare its digest to the `Criteria hash:` line found anywhere outside the hashed section. A mismatch or a missing line fails. Leave the stored line unchanged. When there is no `ALIGN.md`, skip the hash check.
3. Judge each end state item against its stated proof. An end state item is a success criterion, or a `Done when` line in the light form. With no `ALIGN.md`, take the items from the request and record that in `VERIFY.md`. Do not edit the work or weaken a proof. Describe reproducible failures. Missing evidence stays unresolved.
4. Report one verification outcome for the checked revision: the hash result when one was checked, end state items met/total, the evidence, and unresolved gaps. Claim success only when every end state item meets its proof with evidence and, when `ALIGN.md` is present, the criteria hash matches. Record a same-session judgment as a self-check.
