# Task recording

Use Markdown under `.jwn/<task>/` for Align, implementation, verification, and review, including standalone invocations. Ordinary conversation creates no records. Create each document only when its stage needs it. Do not create a replacement journal or general recording command.

## Task ownership

Use the caller's project root and task directory when supplied. Otherwise use the current Git working-tree root, known non-Git project directory, or the session's working directory. Retain one task ID across stages and compaction, using the chat ID when available or choosing an ID once.

For tasks with authorized follow-up work, keep the current state and next action in `STATUS.md` before each turn ends. During an approved run, end each turn by stating its state: continuing with the next step, waiting on what, needing the user and why, or done with evidence shown in the conversation.

Read existing records before continuing. Record the goal, owning chat, and caller in `STATUS.md`, distinguishing standalone stages and an Align workflow through approved delivery. Do not select another task by recency, interleave writers, or overwrite unrelated records. Keep task records outside the deliverable diff using existing ignore rules or a worktree-local exclusion.

## Documents and owners

| Document    | Owner                                                        | Contents                                                                                                                |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `ALIGN.md`  | Align                                                        | Goal, intention, Don'ts, decisions, end state, success criteria, human checkpoints, todos, summary, and actual approval |
| `STATUS.md` | Active stage                                                 | Current stage and state, implementation outcomes, blockers, pending decisions, next action, and work history            |
| `VERIFY.md` | Verify                                                       | Checked changes, criterion results, commands or scenarios, evidence, and gaps                                           |
| `REVIEW.md` | Review                                                       | Stable finding IDs, statuses, evidence, reviewed changes, pass history, and coverage gaps                               |
| `RETRO.md`  | Explicitly invoked Retro                                     | Observed workflow problems and proposed jwn improvements                                                                |

Use headings, lists, and tables as useful. Preserve earlier approvals, results, and finding history rather than replacing them with a latest-success summary. Link detailed logs and artifacts instead of copying them into every document. Keep secrets and unrelated history out of records.

Record actual observations before advancing. On interruption or completion, update the current stage, state, unfinished work, and next action in `STATUS.md`. An invoked stage returns its outcome to its caller. A standalone stage stops at its requested boundary. Approved Align continues through Iterate, which follows Ship and Moniterate within the approved delivery. Preserve explicit user limits and do not infer merge, deployment, or messaging permission. Irreversible actions approved with exact values in `ALIGN.md` are authorized.

## Evidence and recovery

Identify evidence by the diff base, HEAD, and relevant staged, unstaged, untracked, and dependency state. Save enough file or diff evidence to compare the checked changes after interruption. HEAD alone does not identify an uncommitted revision. Keep commands, outcomes, source kinds, and artifact paths with their results.

After context loss, read `STATUS.md` and the entire owning task's `ALIGN.md` when present before continuing. Read the other documents relevant to the current stage. Restore actual decisions, approval scope, unresolved findings, coverage, and next action. Inspect the current files before reusing verification or review. Preserve historical evidence while marking affected completion stale when files or requirements changed.

Missing, conflicting, or unreadable records do not establish approval or completion. Report the gap and continue only work whose authorization and prerequisites remain known. Never retry a denied action through another recording path.

Old JSONL-only tasks are outside this workflow's recovery support. Preserve their files without parsing, converting, or inferring authorization. Report that context is unavailable and establish the current task from the user's request before creating separate Markdown records. Do not silently restart an old task or select another directory.

While the host prohibits writes, keep the current plan and pending record updates in conversation. Save them when writes become allowed without inventing earlier approvals or results.
