# CLI recording

Use the CLI to record Align, Plan, and execution stages in `.jwn/<session-id>/`, including standalone invocations. Ordinary conversation does not initialize records. Only Auto writes `status.json` and `progress.jsonl`.

## Root and session

Use the caller's project root and session ID when supplied. Otherwise, use the current Git working-tree root or the known non-Git project directory. For non-Git recovery, check the current directory and its ancestors for the nearest `.jwn/`. Establish the project directory with the user only if it is unclear.

Retain one session ID across stages and compaction. Use the chat ID when available or generate an ID once. Read existing records before resuming and confirm their ownership, goal, and actual approvals against the current request. Do not select another session by recency, overwrite unrelated records, or interleave writers.

The CLI appends `.jwn/<session-id>/` to `--root`. Pass the project root, not the task directory. Standalone recording does not start Auto or authorize additional stages.

## Git ignore on initialization

1. Before writing the first task record, check `git rev-parse --is-inside-work-tree`. If `true`, run `git check-ignore -q -- .jwn/` from the working-tree root.
2. On exit code `1`, append `.jwn/` only if absent to the global `core.excludesFile`, defaulting to `$XDG_CONFIG_HOME/git/ignore` or `~/.config/git/ignore`. Preserve existing contents and Git configuration.
3. Recheck exclusion after registration. Report unexpected Git errors, write errors, or failed exclusion before continuing dependent work.
