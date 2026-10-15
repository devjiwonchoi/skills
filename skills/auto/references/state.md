# Auto state

Read this when Auto starts or when writing records for an Auto-managed task. Auto initializes `status.json` and `progress.jsonl` and supplies their paths to downstream skills. Standalone Align, Plan, and execution stages do not emit workflow records or artifacts automatically. Preserve existing standalone records during recovery.

## Root and ownership

- For Git projects, use the current working-tree root, not the shared Git directory or another worktree.
- For non-Git recovery, check the current directory and its ancestors for the nearest `.jwn/`. For a new task, use the known project directory. Establish that directory with the user if it is unclear.
- Use `.jwn/<session-id>/` as the task directory. Retain the session ID across stages and compaction. Use the chat ID when available or generate an ID once. Each session directory holds one task. Before reusing state, validate `workflow: "auto"`, the recorded goal, and the current request. Another task or another active session requires a user decision. Same-session compaction retains ownership. Do not overwrite unrelated files or interleave writers.

## Git ignore on initialization

1. When first initializing Auto's state, including adoption of standalone Align records, check `git rev-parse --is-inside-work-tree`. If `true`, run `git check-ignore -q -- .jwn/` from the working-tree root.
2. On exit code `1`, automatically append `.jwn/` only if absent to the global `core.excludesFile`, defaulting to `$XDG_CONFIG_HOME/git/ignore` or `~/.config/git/ignore`. Preserve existing contents and Git configuration.
3. Recheck exclusion after registration. Report unexpected Git errors, write errors, or failed exclusion before continuing dependent work.

## Documents

Store `status.json` and `progress.jsonl` in `.jwn/<session-id>/`. Follow [Align recording](../../plan/align/references/auto-mode.md) for `align/v<N>.jsonl` and [Plan recording](../../plan/plan/references/auto-mode.md) for `plan/v<N>.jsonl`. Use `null` until a record or its actual approval exists.

Execute and its stages share `execute/v<N>.jsonl` through the [execution state contract](../../execute/execute/references/auto-mode.md). Reference detailed outcomes there from Auto progress rather than duplicating findings or coverage. Execution completion advances to Ship; only Ship can establish Auto's final readiness.

Alignment references are `{ "path": "align/v<N>.jsonl", "event_id": "..." }`, with paths relative to `.jwn/<session-id>/`. `alignment` identifies the current version's `start` event. `approvedAlignment` identifies an actual `aligned` event. Keep historical approvals, but advance dependent work only when the latest record in the latest intention version is `aligned`. Plan references use the same `{ path, event_id }` shape: `plan` identifies the current `start` candidate and `approvedPlan` its actual `approved` event in `plan/v<N>.jsonl`. Approval precedes detailed review. Before execution, read the latest candidate and each reviewer's latest verdict: low needs none, medium one, high three distinct clear reviewers; any `changes_requested` blocks execution. Confirm the candidate's pinned Align is still current and aligned. Preserve historical approval while a blocker is unresolved. Legacy Markdown plan references remain strings such as `plan/PLAN.v<N>.md`; read them normally and preserve their actual approvals without implicit migration. Preserve existing legacy paths until explicitly migrated. Preserve legacy Markdown agreement references and their approvals when recovering existing tasks until explicitly migrated.

1. Preserve existing Markdown plan paths, versions, contents, and approval records in place. Initialize references from actual documents and confirmations. New Plan candidates use the CLI without migrating or overwriting legacy documents.
2. Adjust relative and incoming links to retain their targets. Do not overwrite conflicting destinations or move unrelated documents.
3. Any change to Align's `intention` creates a new JSONL version. For JSONL plans, group edits before saving a changed complete candidate as a new version. Bounded implementation refinements need not rewrite the plan; return changes to approved decisions to the user. Preserve the existing version policy for legacy Markdown plans. Preserve original and last approved content for cumulative comparison. Keep previous versions and approval references until an actual successor is approved. Updating a plan's approval record does not require a new content version.
4. Supply the absolute task directory and document paths to downstream skills. Record document changes and actual approvals as events.

## Events and status

Append events to `progress.jsonl`, one complete JSON object per line, with consecutive sequences starting at 1. Each event contains the resulting `status`. `status.json` is a snapshot of the latest event's `status`.

The example is formatted for reading:

```json
{
  "seq": 1,
  "at": "2026-10-12T00:00:00Z",
  "kind": "initialized",
  "summary": "Started Auto for the agreed task.",
  "evidence": [],
  "status": {
    "workflow": "auto",
    "title": "Add compact recovery",
    "goal": "Restore this task after context compaction.",
    "branch": "jiwon/auto-recovery",
    "sessionId": null,
    "stage": "align",
    "state": "running",
    "updatedAt": "2026-10-12T00:00:00Z",
    "blocker": null,
    "nextAction": "Read the existing agreement.",
    "alignment": null,
    "approvedAlignment": null,
    "plan": null,
    "approvedPlan": null,
    "lastEventSeq": 1
  }
}
```

- Stages are `align`, `plan`, `execute`, `ship`, and `done`. States are `running`, `awaiting_approval`, `blocked`, and `complete`.
- Use the actual branch and available session identity. Use `null` for unavailable values, including a detached or non-Git branch.
- Keep `status.lastEventSeq` equal to `seq` and `status.updatedAt` equal to `at`. Record the actual response and document version in approval events and documents.
- Record meaningful starts before acting and observed outcomes before advancing. Include decisions, verification, review, retries, and blockers. Before yielding, handing off, or finishing, record the current state and next action. Only mark `complete` when required work is complete.
- Evidence identifies the observation, outcome, source kind, command, revision, and artifact where applicable. Distinguish inspection, tests, builds, runtime, and CI. Reference detailed output instead of embedding raw logs or secrets.
- Append progress first, then atomically replace `status.json` using a temporary file in the same session directory. Report write errors before continuing dependent work. Follow [recovery](recovery.md) after interrupted writes or conflicting records.
