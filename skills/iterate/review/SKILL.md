---
name: review
description: Use when reviewing development changes.
---

## Options

- By default, hand one pass to a fresh subagent that did not do the work.
- With `--cross`, follow [cross-model review](references/cross.md) for one pass by the other model instead.
- Without subagents, review in the current session and record the pass as a self-review.

## Steps

Follow [execution recording](../iterate/references/recording.md) for every invocation, including standalone use.

1. Read the repository, target revision, diff base or scope, and retained findings and pass history in `REVIEW.md`.
   - Review stacks together with each PR's base/head and findings attributed to its PR.
   - Run checks as the caller and provide their revision and output paths. Request additional checks only for missing evidence.
   - Give the reviewer only read access to the repository, the target revision and diff base or scope, `ALIGN.md`, repository rules and user preferences, check evidence, retained findings and coverage, and a factual summary of what happened, such as todos run, deviations, approvals, and re-aligned decisions. Never pass the implementation conversation, reasoning, or self-assessment.
   - The reviewer runs step 2 and returns findings and coverage. The caller keeps steps 3 and 4 and writes `REVIEW.md`.
2. Compare the changes with approved requirements, success criteria, and Don'ts. Review correctness, regressions, security, and maintainability in one pass using the selected mode. Use retained findings and coverage to focus on uncovered sections and affected behavior. Record findings with priorities, locations, evidence, failure scenarios, and coverage gaps. Do not edit reviewed files.
   - Check diff access first. Stop on missing access and report the review incomplete. Do not retry denied operations.
3. Validate findings and identify actionable fixes. Match observations by root cause and failing behavior. Update existing finding IDs, including reopening resolved findings on recurrence. Distinct failures at the same location remain separate. Retain status history, evidence, and coverage.
4. Save findings and the pass's reviewed revision, mode, covered sections, and gaps in `REVIEW.md`. Return accumulated unresolved findings and evidence paths. Let Iterate own corrections and additional passes. Keep incomplete review unresolved.
