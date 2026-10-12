# Auto state

Read this when Auto starts or when writing records for an Auto-managed task. Only Auto initializes `.jwn/` and supplies its paths to downstream skills. Standalone skill invocations do not create it.

## Root and ownership

- For Git projects, use the current working-tree root, not the shared Git directory or another worktree.
- For non-Git recovery, check the current directory and its ancestors for the nearest `.jwn/`. For a new task, use the known project directory. Establish that directory with the user if it is unclear.
- One root holds one task. Before reusing state, validate `workflow: "auto"`, the recorded goal, and the current request. Another task or another active session requires a user decision. Same-session compaction retains ownership. Do not overwrite unrelated files or interleave writers.

## Git ignore on initialization

1. When first creating `.jwn/`, check `git rev-parse --is-inside-work-tree`. If `true`, run `git check-ignore -q -- .jwn/` from the working-tree root.
2. On exit code `1`, automatically append `.jwn/` only if absent to the global `core.excludesFile`, defaulting to `$XDG_CONFIG_HOME/git/ignore` or `~/.config/git/ignore`. Preserve existing contents and Git configuration.
3. Recheck exclusion after registration. Report unexpected Git errors, write errors, or failed exclusion before continuing dependent work.

## Documents

Store `ALIGN.v<N>.md`, `PLAN.v<N>.md`, `status.json`, and `progress.jsonl` directly in `.jwn/`. Document references are relative to `.jwn/`. Use `null` until a document or its actual approval exists.

1. Move existing documents for this task into their versioned paths. Preserve their version numbers, semantic content, comments, and approval records. If unversioned, assign an unused version without implying approval. Initialize current and approved references from these documents and actual confirmations, preserving pending approvals.
2. Adjust relative and incoming links to retain their targets. Do not overwrite conflicting destinations or move unrelated documents.
3. Create a new numbered agreement file for each substantive agreement revision. For plans, follow [Plan](../../plan/plan/SKILL.md)'s version rule and update the current file for same-version refinements. Preserve the original plan and last approved content in task history before editing them. Keep previous versions and the last approved references until the user explicitly approves a specific successor. Updating a document's actual approval record does not require a new content version.
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
- Append progress first, then atomically replace `status.json` using a temporary file in `.jwn/`. Report write errors before continuing dependent work. Follow [recovery](recovery.md) after interrupted writes or conflicting records.
