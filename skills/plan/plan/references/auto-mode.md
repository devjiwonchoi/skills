# Auto mode

Use Auto's root and session ID. Resolve this skill's real path to find `<jwn-root>`.

Run `node <jwn-root>/cli/dist/index.mjs plan --schema` for event fields and descriptions.
Record each plan step as it happens using those descriptions.

Provide the complete natural-language plan in a start event's `content`. The CLI saves it as `plan/v<N>.md` and records its filename and SHA-256 hash in `plan/v<N>.jsonl`. Present that saved Markdown for approval. Do not edit saved candidates. Submit changed content as a new version.

Invoke `node <jwn-root>/cli/dist/index.mjs plan <read|write> --root <root> --session <id>`.
For writes, provide stdin JSON with a quoted heredoc (`<<'JSON'`) and pass `--version <N>` except for `type: start`. Retain the returned version.

For reads, retain `version` and `nextOffset` for subsequent calls with `--version` and `--offset`.
Read the latest version from offset 0 after context loss or when `latestVersion` changes.

Reads return content derived from the hash-checked Markdown. Cursor reads and writes also check the document. Legacy embedded-content records remain readable without migration. Preserve damaged or orphan documents before any repair.
