---
name: retro
description: Use when reviewing and improving the jwn workflow.
---

## Rules

- Run when Iterate finishes a task or when explicitly invoked. Propose changes without editing skills or memory, messaging other sessions, committing, publishing, or scheduling work.
- Use observed workflow evidence. Distinguish user preferences, implementation defects, and defects in jwn instructions. Label unverified causes as hypotheses.

## Failures

1. End state not reached: a success criterion fails, the task is cancelled, or the user finishes it by hand.
2. Result rejected: the user edits, reverts, or requests changes to an accepted result, a sign the end state was misaligned.
3. Process rejected: the user interrupts, repeats a request, or changes permissions or settings mid-run, a sign the system, permissions, or preferences failed.
4. Needless ask: the user's answer matches the recommended option, or they approve without change where no approval was required, a sign the question was not needed. Plan approval and approval of irreversible actions never count.
5. Missed ask: review or the Ship comparison finds a silent departure from the end state, work crosses an approval boundary without asking, or the user says they should have been asked.
6. Ignored preference or rule: the user restates a saved preference or rule, or a check for one fails.

## Steps

1. Read the current session, relevant task records, and additional material supplied by the user. Use shared [task recording](../references/recording.md) for this task's `RETRO.md`. Do not choose another task by recency or include secrets and unrelated history.
2. Check the task for each failure above and for other friction, such as duplicate recording or late previews. Cite the actual request, outcome, or artifact as the signal, and the responsible jwn instruction when known. Mark a failure not found, or not yet observable when its signals come later, such as edits after acceptance.
3. Apply [Delete](../delete/SKILL.md) to seek removal or simplification before adding rules. Consolidate proposals with the same cause and read existing Retro proposals before adding duplicates. Do not turn an isolated complaint into a universal requirement.
4. For each found failure or friction, prefer prevention in this order: structure that makes it impossible, then types, lint, tests, and written instructions last. Record the observed case, cause and confidence, affected instruction, specific removal or replacement, expected effect, and how to check that effect, preferring a check that fails on the observed case. State when evidence is insufficient instead of inventing a fix.
5. Save the evidence and proposals in `RETRO.md` and present the smallest useful changes. Stop at proposals. Keep the owning workflow's stage and next action intact. No observed problem is a valid result.
