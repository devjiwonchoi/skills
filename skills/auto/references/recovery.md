# Recover Auto

Read this after context loss or when Auto encounters existing state. Resolve this reference from the installed Auto skill's directory, not from a presumed path in the user's project.

1. Resolve the root using [state](state.md). Without `.jwn/`, finish without creating state or starting Auto.
2. Read `status.json` and `progress.jsonl`. Validate ownership using the state contract before writing or resuming.
3. Validate the full log against its event format and sequences. Report missing or empty logs, malformed JSON, sequence gaps or duplicates, and partial trailing records. Do not skip or rewrite events, or invent outcomes.
4. Restore a missing, malformed, or stale snapshot from the final event of a valid log belonging to this task. Report snapshots ahead of the log or conflicting with their corresponding event before dependent work.
5. Read the referenced current and approved documents, skipping `null` and duplicate paths. Report missing referenced documents. Read progress for decisions, unfinished work, evidence, and the next action.
6. Inspect actual files and revision before reusing evidence or retrying unfinished work. A start event is not a result. Record recovery and the next action using the state contract, then summarize the restored stage and pending decisions. Resume only authorized work, preserving pending approvals and existing delivery permissions.
