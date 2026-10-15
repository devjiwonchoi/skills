# Align recording

Follow the shared [CLI recording](../../../utils/references/recording.md) setup. Resolve this skill's real path to find `<jwn-root>`.

Run `node <jwn-root>/cli/dist/index.mjs align --schema` for event fields and descriptions.
Record each alignment step as it happens using those descriptions.

For a clear request, retain the verbatim prompt in `start`. Write `aligned` with `source` pointing to this version's `start` and a `reason` explaining why the prompt and answers suffice. Resolve all ambiguities and questions first. Complete any requested final confirmation instead of bypassing it. Never invent user responses or approval.

Invoke `node <jwn-root>/cli/dist/index.mjs align <read|write> --root <root> --session <id>`.
For writes, provide stdin JSON with a quoted heredoc (`<<'JSON'`) and pass `--version <N>` except for `type: start`. Retain the returned version.

For reads, retain `version` and `nextOffset` for subsequent calls with `--version` and `--offset`.
Read the latest version from offset 0 after context loss or when `latestVersion` changes.
