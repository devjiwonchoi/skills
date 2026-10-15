# Auto state

Read this when Auto starts or when writing records for an Auto-managed task. Auto initializes `status.json` and `progress.jsonl` and supplies their paths to downstream skills. Align, Plan, and execution stages always record through the CLI, including standalone invocations. Preserve and adopt existing standalone records with their actual approvals and evidence.

## Root and ownership

Follow the shared [CLI recording](../../utils/references/recording.md) setup for the root, session ID, and Git exclusion before initialization. Reuse this session's standalone task directory when adopting its records.

Each session directory holds one task. Before reusing Auto state, validate `workflow: "auto"`, the recorded goal, and the current request. Another task or another active session requires a user decision. Same-session compaction retains ownership.

## Documents

Store `status.json` and `progress.jsonl` in `.jwn/<session-id>/`. Follow [Align recording](../../plan/align/references/recording.md) for `align/v<N>.jsonl` and [Plan recording](../../plan/plan/references/recording.md) for `plan/v<N>.jsonl`. Use `null` until a record or its actual approval exists.

Execute and its stages share `execute/v<N>.jsonl` through [execution recording](../../execute/execute/references/recording.md). Reference detailed outcomes there from Auto progress rather than duplicating findings or coverage. Execution completion advances to Ship; only Ship can establish Auto's final readiness.

Alignment references are `{ "path": "align/v<N>.jsonl", "event_id": "..." }`, with paths relative to `.jwn/<session-id>/`. `alignment` identifies the current version's `start` event. `approvedAlignment` identifies an actual `aligned` event, preserving whether it relies on the request or explicit confirmation. Keep historical authorization, but advance dependent work only when the latest record in the latest intention version is `aligned`. Plan references use the same `{ path, event_id }` shape: `plan` identifies the current `start` candidate and `approvedPlan` its actual `approved` or `accepted` event in `plan/v<N>.jsonl`. These existing field names do not turn request-based acceptance into user approval. Acceptance or approval precedes detailed review. Before execution, read the latest candidate and each reviewer's latest verdict: low needs none, medium one, high three distinct clear reviewers; any `changes_requested` blocks execution. Confirm the candidate's pinned Align is still current and aligned. Preserve historical authorization while a blocker is unresolved. Legacy Markdown plan references remain strings such as `plan/PLAN.v<N>.md`; read them normally and preserve their actual approvals without implicit migration. Preserve existing legacy paths until explicitly migrated. Preserve legacy Markdown agreement references and their approvals when recovering existing tasks until explicitly migrated.

1. Preserve existing Markdown plan paths, versions, contents, and approval records in place. Initialize references from actual documents and confirmations. New Plan candidates use the CLI without migrating or overwriting legacy documents.
2. Adjust relative and incoming links to retain their targets. Do not overwrite conflicting destinations or move unrelated documents.
3. Any change to Align's `intention` creates a new JSONL version. For JSONL plans, group edits before saving a changed complete candidate as a new version. Bounded implementation refinements need not rewrite the plan; return changes to approved decisions to the user. Preserve the existing version policy for legacy Markdown plans. Preserve original and last authorized content for cumulative comparison. Keep previous versions and authorization references until a successor is actually accepted or approved. Updating a plan's authorization record does not require a new content version.
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
- For an external wait, record its trigger and actual resumption mechanism in `nextAction`. If none is available, record how to resume without claiming automatic continuation.
- Evidence identifies the observation, outcome, source kind, command, revision, and artifact where applicable. Distinguish inspection, tests, builds, runtime, and CI. Reference detailed output instead of embedding raw logs or secrets.
- Append progress first, then atomically replace `status.json` using a temporary file in the same session directory. Report write errors before continuing dependent work. Follow [recovery](recovery.md) after interrupted writes or conflicting records.
