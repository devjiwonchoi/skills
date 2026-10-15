# Plan recording

Follow the shared [CLI recording](../../../utils/references/recording.md) setup. Reuse Align's root and session ID. Resolve this skill's real path to find `<jwn-root>`.

Run `node <jwn-root>/cli/dist/index.mjs plan --schema` for event fields and descriptions.
Record each plan step as it happens using those descriptions.

Every Plan write requires the same session's latest Align version to be `aligned` and the candidate to reference that exact event. If Align is missing, reopened, or superseded, finish Align and save a new candidate before advancing. Historical Plan records remain readable.

Invoke `node <jwn-root>/cli/dist/index.mjs plan <read|write> --root <root> --session <id>`.
For writes, provide stdin JSON with a quoted heredoc (`<<'JSON'`) and pass `--version <N>` except for `type: start`. Retain the returned version.

For reads, retain `version` and `nextOffset` for subsequent calls with `--version` and `--offset`.
Read the latest version from offset 0 after context loss or when `latestVersion` changes.
