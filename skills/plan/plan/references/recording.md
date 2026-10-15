# Plan recording

Follow the shared [CLI recording](../../../utils/references/recording.md) setup. Reuse Align's root and session ID. Resolve this skill's real path to find `<jwn-root>`.

Run `node <jwn-root>/cli/dist/index.mjs plan --schema` for event fields and descriptions.
Record each plan step as it happens using those descriptions.

Include the verification methods, expected outcomes, prepared tests or reproduction, and baseline evidence or its limitation in the candidate. Record `accepted` with the actual existing user instruction in `value` and why it settles the plan's consequential choices in `reason`. Use `approved` only for an actual user approval of this candidate. Neither event carries to a new version or bypasses a pending decision or explicit approval request. New acceptance or approval follows the effort's required clear reviews. Historical authorization-before-review records remain readable and retain their actual permissions. Include scoped implementation, commit, push, PR and repair permissions and adaptation boundaries in the candidate.

Every Plan write requires the same session's latest Align version to be `aligned` and the candidate to reference that exact event. If Align is missing, reopened, or superseded, finish Align and save a new candidate before advancing. Historical Plan records remain readable.

Invoke `node <jwn-root>/cli/dist/index.mjs plan <read|write> --root <root> --session <id>`.
For writes, provide stdin JSON with a quoted heredoc (`<<'JSON'`) and pass `--version <N>` except for `type: start`. Retain the returned version.

For reads, retain `version` and `nextOffset` for subsequent calls with `--version` and `--offset`.
Read the latest version from offset 0 after context loss or when `latestVersion` changes.

Use `plan next` to confirm current Align, candidate authorization and each reviewer's latest verdict before execution. It returns `review`, `authorize` or `iterate`.
