# Auto mode

Read this only when running under Auto. Standalone stages retain context in the session without emitting workflow records or artifacts.

Use Auto's project root and session ID, not its `.jwn/<session-id>/` task directory as `--root`. Resolve this skill's real path to find `<jwn-root>`. Use Auto's initialized task directory and [state contract](../../../auto/references/state.md). Do not start Auto from a working stage.

Execute records `start` once with the authorized goal, approved plan reference or `null`, current revision or `null`, and required review sections. Read existing records and verify ownership, goal, approval, and scope before resuming. A changed approved plan creates a new version with a reason. Correction work and code revisions stay in that version.

Run `node <jwn-root>/cli/dist/index.mjs <execute|impl> --schema` for owned fields and descriptions. Use `<command> <read|write> --root <project-root> --session <id>`. Pass `--version <N>` except for `start`, and use a quoted heredoc for stdin JSON.

All commands share `.jwn/<session-id>/execute/v<N>.jsonl` and its lock. Each command accepts only its own events. Quick-impl and Verify use the Impl command, recording only the events owned by their skill. Impl adds no duplicate records.

| Skill      | Events                        |
| ---------- | ----------------------------- |
| Execute    | `start`                       |
| Quick-impl | `impl_started`, `implemented` |

Fresh IDs identify writes. Retry a lost response with the same ID, payload and version. Preserve damaged logs and stop dependent work on recording failure. Read from offset 0 after context loss. Retain the returned version and `nextOffset` for incremental reads.

A revision identifies the diff base, HEAD, staged, unstaged and relevant untracked content. Compare actual files before and after checks or review. Reconcile every section after changes, reopening changed and affected behavior. Retain only already reviewed coverage with evidence. A new revision invalidates verification and review completion while findings and evidence survive.

Keep evidence in the ignored task directory or another absolute directory outside the changeset. The CLI validates recorded facts, never actual user approval, semantic impact or live file identity.
