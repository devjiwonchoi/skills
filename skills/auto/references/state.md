# Auto state

Read this when Auto starts or when writing records for an Auto-managed task. Only Auto initializes `.jwn/` and supplies its paths to downstream skills. Standalone skill invocations do not create it.

## Root and ownership

- For Git projects, use the current working-tree root, including when invoked from a subdirectory. Do not use the shared Git directory or another worktree's state.
- For non-Git recovery, check the current directory and its ancestors for the nearest `.jwn/`. For a new task, use the known project directory. Establish that directory with the user if it is unclear.
- One root holds one task. Validate `workflow: "auto"`, the recorded goal, and the current request before reusing existing state. Directory existence alone does not establish ownership. Do not overwrite unrelated files or replace another task without the user's decision.
- Preserve an existing writer's ownership. Record the session identity when available. Do not interleave writers or silently take over another active session.

## Documents

Store `ALIGN.v<N>.md`, `PLAN.v<N>.md`, `status.json`, and `progress.jsonl` directly in `.jwn/`. Document references are relative to `.jwn/`. Use `null` until a document or its actual approval exists.

1. Move existing documents for this task into their versioned paths. Preserve their version numbers, semantic content, comments, and approval records. If unversioned, assign an unused version without implying approval.
2. Adjust relative links to retain their original targets and update affected incoming links. Keep these edits limited to paths. Do not overwrite conflicting destinations or move unrelated documents.
3. Create a new numbered file for each substantive document revision. Keep previous versions and the last approved references until the user explicitly approves a specific successor. Updating a document's actual approval record does not require a new content version.
4. Supply the absolute task directory and document paths to downstream skills. Record initialization, migration, revisions, and actual approvals as events.

## Events and status

`progress.jsonl` is the durable history. Append one complete JSON object per line, starting at sequence 1 and increasing by 1. Each event includes the complete resulting `status`, so the snapshot can be restored without guessing changes.

The example below is formatted for reading. Write each event on a single line. `status.json` contains exactly its latest event's `status` object.

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
- Use the actual branch, or `null` outside Git or at detached HEAD. Use the available session identity, or `null` when unavailable. Keep absent blockers and document references explicitly `null`.
- Keep `status.lastEventSeq` equal to `seq` and `status.updatedAt` equal to `at`. Keep actual approval responses and their document versions in approval events and the documents.
- Record meaningful work-unit starts before acting and observed results before moving on. Record decisions, verification, review, retries, blockers, next actions, and completion. An unfinished start remains unfinished until its outcome is observed.
- Evidence entries identify the check or observation, outcome, source kind, relevant command, revision, and artifact location where applicable. Distinguish inspection, tests, builds, runtime, and CI. Reference detailed output instead of embedding raw logs or secrets.
- Append the event first. Then replace `status.json` atomically with the event's status using a temporary file in `.jwn/`. Report write errors and resolve them before continuing work that depends on recording.
- Before yielding for approval, reporting a blocker, handing off, or finishing, record the current state and next action. Mark `complete` only when the authorized task's required work is complete.
- If records disagree or writing was interrupted, follow [recovery](recovery.md). Do not delete, reorder, or rewrite prior events to hide an error.
