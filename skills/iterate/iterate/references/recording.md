# Execution recording

## Root and session

Follow the shared [CLI recording](../../../utils/references/recording.md) setup. Use the same project root and session ID across execution stages. Under Auto, also follow its [state contract](../../../auto/references/state.md).

Resolve this skill's real path to find `<jwn-root>`. Run `node <jwn-root>/cli/dist/index.mjs <command> --schema` for event fields and `<command> <read|write> --root <root> --session <id>` for records. Writes take stdin JSON through a quoted heredoc (`<<'JSON'`). Pass `--version <N>` except for `start` and retain the returned version.

All commands share `.jwn/<session-id>/iterate/v<N>.jsonl` and its lock. After initialization, each skill writes only its owned events:

| Skill      | Command   | Events                                                  |
| ---------- | --------- | ------------------------------------------------------- |
| Iterate    | `iterate` | `start`, `iteration`, `blocked`, `resumed`, `completed` |
| Quick-impl | `impl`    | `impl_started`, `implemented`                           |
| Verify     | `impl`    | One `verified` outcome per checked snapshot             |
| Review     | `review`  | `scope`, `review_pass`                                  |
| Impl       | —         | None                                                    |

The first invoked execution stage initializes a missing journal through `iterate write` with `type: start`, the authorized goal, approved plan reference or `null`, and required review sections. Use `null` revision before initial implementation or the actual current snapshot when entering existing work, including standalone Verify or Review. This initialization does not invoke Iterate's workflow. Each stage then writes its owned events from the table above.

Read before resuming and confirm ownership, goal, approval and scope against the request. A changed approved plan creates a new version with a reason and reopens coverage, retaining finding IDs and evidence. Earlier evidence does not approve the successor. Correction rounds and code revisions stay in the same version. Goal changes return to Align.

Fresh event IDs identify writes. Stable finding IDs identify issues. Retry a lost response with the same ID, payload and version. On rejection, read before proceeding. Never change an ID to bypass a conflict or missing prerequisite. Preserve damaged logs and stop dependent work on recording failure.

## Revisions and evidence

Identify each revision by the diff base, HEAD, staged and unstaged changes, relevant untracked content and reviewed dependency context. Keep a content digest and detailed evidence under the ignored task directory or another absolute directory outside the changeset. Compare actual files before and after checks or review and before reusing evidence. HEAD alone is insufficient.

`implemented` names the current `previous_revision` and reconciles every review section. Reopen changed and affected behavior. Retain previously reviewed coverage only with a supported reason. Verify supplies the same reconciliation if authorized fixes change the snapshot. A new revision invalidates verification and review completion. Unresolved findings survive.

Verify records `passed`, `failed` or `incomplete`, the checked revision, evidence paths and gaps. Detailed criterion results belong in the evidence artifact. Passing requires evidence for every required criterion and no unresolved gaps. Implementation and verification cannot close findings.

## Review passes

Before each pass, read retained findings, coverage evidence and the scope returned by `iterate next`. Review the full scope initially. After corrections, review the fix delta and affected behavior while retaining supported unaffected coverage. Use `scope` to add discovered behavior or reopen sections, including affected public contracts, security boundaries and dependencies. Keep section IDs tied to stable file/behavior identities. Never drop uncovered scope to finish.

Match findings by root cause and failing behavior. Reuse the same ID, issue and section identity for repeated or recurring failures, accumulating evidence. Distinct failures at the same location get distinct IDs. Reinspect retained coverage when new evidence reveals a gap.

Record coverage and findings only after completing one direct pass with accessible diff and session context. Record inaccessible or incomplete review with gaps and no accepted coverage or findings. Resolve or dismiss a finding only with evidence from a pass reviewing its section. Return to the caller after each pass. Iterate owns correction and additional review when invoked.

## Recovery and completion

`read` returns records and `nextOffset` for incremental reads. `iterate next` replays full history under the lock and returns `{ version, state }`. It takes no offset. Use the latest version after compaction or when `latestVersion` changes. Recorded readiness does not establish actual approval, semantic impact or live file identity. Inspect actual files and unfinished work before advancing or retrying.

Resume interrupted implementation in its current round. Start another iteration after completion only for newly authorized work with a reason. Append `resumed` only after resolving the recorded blocker. Missing or failed verification/review evidence remains unresolved until its owner records a valid result. Stop on rounds that make no progress.

Standalone stages stop after their requested work. Invoked stages return their outcome to the owning workflow, which continues authorized work once prerequisites are satisfied. Impl continues from a successful Quick-impl to Verify. Remaining work returned by `iterate next` does not authorize additional stages on its own. Quick-impl ends after `implemented` without performing verification or review. Only Iterate records `completed`, after current verification passed, review completed with required coverage, no validated P0–P2 findings remain open, and actual files still match. P3 findings do not restart implementation.

Under Auto, reference the detailed log from progress and update status through the state contract. Execution completion advances to Ship, not Auto's `done`.
