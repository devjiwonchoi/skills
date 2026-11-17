---
name: remember
description: Use when reviewing a finished jwn task or the weekly delegation record.
---

## Rules

- Run the per-task steps when Iterate finishes a task or when invoked for a task. Run the weekly steps when the user asks for the weekly record.
- Propose changes without editing skills, messaging other sessions, committing, publishing, or scheduling work.
- Use observed workflow evidence. Distinguish user preferences, implementation defects, and defects in jwn instructions. Label unverified causes as hypotheses.
- Follow the `task-recording` skill for the record root, task folder, preferences file, and weekly file.
- Append a learned rule only after the user approves that wording. Use the approved-rule bullet in the template, under `## Learned` in the preferences file. Add that heading at the end when it is missing, and leave every other line as it is. Name the task per the `task-recording` skill.
- Set `delegated` to true only when `interventions_after_approval` is 0 and `end_state_items_met` equals `end_state_items_total`. `review_change_requests` does not change it.
- `end_state_items_total` is at least 1. `end_state_items_met` is not greater than the total.
- Weeks are local-time ISO weeks. Copy `week`, `week_start`, `week_end`, `tasks`, `delegated`, and `delegation_rate` from the `delegation-rate` script in this skill's folder. That script is the only calculation.

## Failures

1. End state not reached: an end state item fails, the task is cancelled, or the user finishes it by hand.
2. Result rejected: the user edits, reverts, or requests changes to an accepted result, a sign the end state was misaligned.
3. Process rejected: the user interrupts, repeats a request, or changes permissions or settings mid-run, a sign the system, permissions, or preferences failed.
4. Needless ask: the user's answer matches the recommended option, or they approve without change where no approval was required, a sign the question was not needed. Plan approval and approval of irreversible actions never count.
5. Missed ask: review or the Ship comparison finds a silent departure from the end state, work crosses an approval boundary without asking, or the user says they should have been asked.
6. Ignored preference or rule: the user restates a saved preference or rule, or a check for one fails.

## Per-task steps

1. Read the current session, this task's records per the `task-recording` skill, and material the user supplied. Do not choose another task by recency or include secrets and unrelated history.
2. Fill the front matter in the template from evidence. `date` is the local task finish date, `YYYY-MM-DD`. Other keys are allowed.
   - Count `interventions_after_approval` as user messages, interruptions, and manual commits after the ALIGN approval. The approval itself is not an intervention. A manual commit is a commit the user made by hand. Count one event once when it fits more than one of these. When `ALIGN.md` records no approval, count those events across the whole task.
   - `end_state_items_total` is the number of end state items in `ALIGN.md`. End state items are the numbered `##` headings under `# End state`. When that section has no numbered headings, they are the `##` headings under `# Success criteria`, or the Done-when lines in the light form.
   - `end_state_items_met` is how many of those items `VERIFY.md` records as met. An item without that result is unmet.
   - `review_change_requests` is the number of distinct changes a human asked for on the task's pull request. Leave the agent's own findings, bots, and approvals out of this count.
3. Check the task for each failure above and for other friction, such as duplicate recording or late previews. Cite the actual request, outcome, or artifact as the signal, and the responsible jwn instruction when known. Mark a failure not found, or not yet observable when its signals come later, such as edits after acceptance.
4. Apply the `delete` skill to seek removal or simplification before adding rules. Consolidate proposals with the same cause and read existing proposals in `REMEMBER.md`, or in `RETRO.md` when `REMEMBER.md` is absent, before adding duplicates. Do not turn an isolated complaint into a universal requirement.
5. For each found failure or friction, prefer prevention in this order: structure that makes it impossible, then types, lint, tests, and written instructions last. Record the observed case, cause and confidence, affected instruction, specific removal or replacement, expected effect, and how to check that effect, preferring a check that fails on the observed case. State when evidence is insufficient instead of inventing a fix.
6. Save the front matter, evidence, and proposals in `REMEMBER.md`. Do not write `RETRO.md`. Run `sh delegation-rate` from this skill's folder on that file, and correct the front matter until the script exits 0. Present the smallest useful changes. Propose each learned rule for the preferences file per the `task-recording` skill. Stop at proposals. Keep the owning workflow's stage and next action intact. No observed problem is a valid result.

## Weekly steps

1. Run `sh delegation-rate` from this skill's folder on the record root per the `task-recording` skill. Pass `--week YYYY-Www` to select another week. The default is the current local ISO week. The script counts `REMEMBER.md` files whose `date` falls on Monday through Sunday of that week, and `RETRO.md` when that task directory has no `REMEMBER.md`. When it rejects `REMEMBER.md`, fill that front matter with the per-task counting rules and run it again. When it rejects `RETRO.md`, write `REMEMBER.md` with those rules instead of editing `RETRO.md`, and run it again. Read the counted files and the preferences file. Keep the script's file set.
2. Write the weekly file for that same week per the `task-recording` skill. Use the script's `week` value as the heading. Replace that file when it already exists.
3. Copy `week`, `tasks`, `delegated`, and `delegation_rate` from the script unchanged, including `0/0` when that week has no tasks. Under Not delegated, name each task per the `task-recording` skill, with its `reasons` and the evidence from that task. `interventions_after_approval` means the intervention count is above 0. `end_state_incomplete` means met does not equal total. Under Rules learned, list `## Learned` bullets whose date is from `week_start` through `week_end`. Under Proposals, list rules that are still proposals. Write None in an empty section.
4. Present the file. Stop at proposals.

## Template

`REMEMBER.md` starts with YAML front matter. These keys are required. Other keys are allowed.

```yaml
---
date: YYYY-MM-DD
interventions_after_approval: 0
end_state_items_total: 1
end_state_items_met: 1
review_change_requests: 0
delegated: true
---
```

Approved rule:

```markdown
- YYYY-MM-DD <task>: <approved wording>
```

Weekly file:

```markdown
# <week>

delegation_rate: D/N
delegated: D
tasks: N

## Not delegated

- <task>: <reasons>. <evidence>

## Rules learned

- <rule>

## Proposals

- <proposal>
```
