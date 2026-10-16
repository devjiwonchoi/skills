# Execution recording

Follow shared [task recording](../../../utils/references/recording.md) for the project root, task ownership, Markdown documents, and evidence. Under Auto, also follow its [state contract](../../../auto/references/state.md).

## Stage ownership

Read `STATUS.md`, the authorized plan when available, and relevant verification and review before acting. Initialize missing documents for the requested stage only. Record the caller, requested scope, current changes, and next action so recovery preserves standalone boundaries.

- Iterate records iterations, blockers, resumed work, and completion in `STATUS.md`.
- Quick-impl records implementation outcomes and unverified work in `STATUS.md`.
- Verify appends results and evidence to `VERIFY.md`.
- Review maintains findings and pass history in `REVIEW.md`.
- Impl passes implementation and verification outcomes to its caller.

Keep correction rounds in the same task and retain finding IDs. Return changes in intent or specifically approved decisions to Plan. Preserve actual authorization and previous results when the plan changes. Do not silently reuse evidence for a changed scope.

## Revisions and verification

Record the diff base, HEAD, staged and unstaged changes, relevant untracked files, and dependency context with evidence sufficient to identify the checked files. Compare actual files before and after checks or review and before reusing evidence. HEAD alone is insufficient.

Implementation identifies changed and affected behavior and reopens the corresponding checks and review. Retain unaffected coverage only with a supported reason. A changed revision invalidates completion for affected behavior, and unresolved findings survive.

Verify records passed, failed, or incomplete with criterion results, commands or scenarios, evidence paths, and gaps. Passing requires evidence for every required criterion. Implementation and verification do not close review findings. Missing or environment-blocked evidence remains incomplete.

## Review history

Before each pass, read retained findings and coverage in `REVIEW.md`. Review the full scope initially. After corrections, review the fix delta and affected behavior, retaining supported unaffected coverage. Reopen affected public contracts, security boundaries, dependencies, or sections where new evidence exposes a gap. Do not drop uncovered scope to finish.

Give each finding a stable ID such as `R1`. Record priority, root cause, failing behavior, location, evidence, and open, resolved, or dismissed status. Match duplicates by root cause and failing behavior rather than wording or line number. Update the same ID for repeated or recurring failures, including reopening resolved findings. Distinct failures at one location receive distinct IDs. Preserve status changes and their evidence.

Append a pass entry identifying the reviewed changes, selected mode, covered sections, remaining gaps, and finding IDs added or updated. Resolve or dismiss a finding only with evidence from a pass reviewing its affected behavior. Record inaccessible or incomplete review as incomplete without claiming coverage. Return to the caller after one pass. Iterate owns corrections and additional passes.

## Recovery and completion

After context loss, read `STATUS.md`, the relevant authorized plan, `VERIFY.md`, and `REVIEW.md`. Restore actual approvals, incomplete checks, unresolved findings, and covered or reopened behavior. Inspect actual files before using prior results. Resume an interrupted round rather than inventing a successful outcome or starting another task.

Standalone stages stop after their requested work. Quick-impl does not verify or review. Impl continues from successful implementation to Verify. Standalone Plan continues through Iterate and approved Ship and Moniterate after post-approval compaction and required reviews, subject to host mode. Check the plan's actual delivery authorization before publishing. These transitions do not authorize merge, deployment, or messaging by themselves.

Only Iterate reports execution complete after current verification passes, required review coverage is complete, no validated P0–P2 findings remain unresolved, and actual files still match the checked changes. P3 nits do not restart implementation. Stop and report a blocker when repeated rounds make no progress. Under Auto, execution completion advances to Ship, not Done.
