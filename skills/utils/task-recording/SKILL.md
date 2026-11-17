---
name: task-recording
description: Use when recording a task under the jwn record root.
---

# Task recording

Record a task as Markdown under the record root, including standalone invocations. Ordinary conversation creates no records. Create each document only when its stage needs it. Do not create a replacement journal or general recording command.

The record format below is the only statement of where records live and what they contain.

## Record format

Never write records into the project repository.

The root is `$JWN_HOME` when that environment variable is set, and `~/.jwn` otherwise. Every path below is relative to that root.

`VERSION` contains `1`.

Each task lives in `<repo>/<task>/`. `<task>` is the task ID. The task files are `EXPLORE.md`, `ALIGN.md`, `STATUS.md`, `VERIFY.md`, `REVIEW.md`, and `REMEMBER.md`. Read `RETRO.md` when `REMEMBER.md` is absent. Write `REMEMBER.md` and leave an existing `RETRO.md` in place.

`<repo>` is `owner/name` from the `origin` remote URL. Take the last two path segments of `https://host/owner/name` or `git@host:owner/name`, after removing a trailing `.git`. When `origin` is missing or those segments cannot be read, resolve `git rev-parse --git-common-dir` to an absolute path and use the basename of its parent directory. Outside a Git checkout, use the working directory name.

Name a task `<repo>/<task>`.

User preferences and learned rules live in `preferences.md`.

Approved rules live in `rules.md`. The file starts with `# Rules`. Each rule is one bullet:

```markdown
- YYYY-MM-DD <repo>/<task>: <wording>
```

`## Learned` bullets already in `preferences.md` stay in force. Append a new approved rule to `rules.md` and leave every other line as it is.

Weekly files live in `weeks/<YYYY>-W<ww>.md`. `<ww>` is the zero-padded ISO week number. Read `retros/<YYYY>-W<ww>.md` when the `weeks/` file is absent. Write `weeks/` only.

End state items are the success criteria items. Each `##` heading under `# Success criteria` is one item. In the light form, each line matching `^- Done when:` is one item. `REMEMBER.md` counts these items. Verify judges exactly these items.

`REMEMBER.md` starts with YAML front matter. These keys are required, and extra keys are allowed:

- `interventions_after_approval` (int)
- `end_state_items_total` (int)
- `end_state_items_met` (int)
- `review_change_requests` (int)
- `delegated` (bool: true when `interventions_after_approval` is 0 and all end state items are met)
- `date` (`YYYY-MM-DD`, the task finish date in the user's local date, for the weekly file)

All end state items are met when `end_state_items_met` equals `end_state_items_total`. Write the counts as integers and `delegated` as `true` or `false`.

`ALIGN.md` carries a line `Criteria hash: <sha256>`. The line may appear anywhere outside the hashed section. Align and Verify both run this skill's `criteria-hash` script, as `criteria-hash <ALIGN.md>`, and use the hex digest it prints. Nothing else defines the hash. Verify does not rewrite the line.

## Task ownership

Use the caller's task ID when supplied. Otherwise retain one task ID across stages and compaction, using the chat ID when available or choosing an ID once.

Derive `<repo>` as the record format defines. When the caller supplies a project, resolve `origin` and the Git directory from that project.

For tasks with authorized follow-up work, keep the current state and next action in `STATUS.md` before each turn ends. During an approved run, end each turn by stating its state: continuing with the next step, waiting on what, needing the user and why, or done with evidence shown in the conversation.

Read existing records before continuing. Record the goal, owning chat, and caller in `STATUS.md`, distinguishing standalone stages and an Align workflow through approved delivery. Do not select another task by recency, interleave writers, or overwrite unrelated records.

## Documents and owners

| Document    | Owner                                                        | Contents                                                                                                                |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `EXPLORE.md` | Explore                                                      | Chosen direction, rejected directions with reasons, and open questions                                                   |
| `ALIGN.md`  | Align                                                        | Goal, intention, Don'ts, decisions, end state, success criteria, `Criteria hash: <sha256>`, human checkpoints, todos, summary, and actual approval |
| `STATUS.md` | Active stage                                                 | Current stage and state, implementation outcomes, blockers, pending decisions, next action, and work history            |
| `VERIFY.md` | Verify                                                       | Checked changes, criterion results, the recomputed criteria hash, commands or scenarios, evidence, and gaps             |
| `REVIEW.md` | Review                                                       | Stable finding IDs, statuses, evidence, reviewed changes, pass history, and coverage gaps                               |
| `REMEMBER.md` | Remember                                                     | Front matter defined above, then failures and workflow problems found, their signals, proposed prevention, and human review comments under `## Review comments` |

Use headings, lists, and tables as useful. Preserve earlier approvals, results, and finding history rather than replacing them with a latest-success summary. Link detailed logs and artifacts instead of copying them into every document. Keep secrets and unrelated history out of records.

Record actual observations before advancing. On interruption or completion, update the current stage, state, unfinished work, and next action in `STATUS.md`. An invoked stage returns its outcome to its caller. A standalone stage stops at its requested boundary. Approved Align continues through Iterate, which follows Ship and Moniterate within the approved delivery. Preserve explicit user limits and do not infer merge, deployment, or messaging permission. Irreversible actions approved with exact values in `ALIGN.md` are authorized.

## Evidence and recovery

Identify evidence by the diff base, HEAD, and relevant staged, unstaged, untracked, and dependency state. Save enough file or diff evidence to compare the checked changes after interruption. HEAD alone does not identify an uncommitted revision. Keep commands, outcomes, source kinds, and artifact paths with their results.

After context loss, read `STATUS.md` and the entire owning task's `ALIGN.md` when present before continuing. Read the other documents relevant to the current stage. Restore actual decisions, approval scope, unresolved findings, coverage, and next action. Inspect the current files before reusing verification or review. Preserve historical evidence while marking affected completion stale when files or requirements changed.

Missing, conflicting, or unreadable records do not establish approval or completion. Report the gap and continue only work whose authorization and prerequisites remain known. Never retry a denied action through another recording path.

Old JSONL-only tasks are outside this workflow's recovery support. Preserve their files without parsing, converting, or inferring authorization. Report that context is unavailable and establish the current task from the user's request before creating separate Markdown records. Do not silently restart an old task or select another directory.

While the host prohibits writes, keep the current plan and pending record updates in conversation. Save them when writes become allowed without inventing earlier approvals or results.
