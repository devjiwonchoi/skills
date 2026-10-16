---
name: review
description: Use when reviewing development changes.
---

## Options

- By default, review directly in the current session.
- With `--cross`, follow [cross-model review](references/cross.md) for one pass by the other model instead.

## Steps

Follow [execution recording](../iterate/references/recording.md) for every invocation, including standalone use.

1. Read the repository, target revision, diff base or scope, available session context, and retained findings and pass history in `REVIEW.md`.
   - Review stacks together with each PR's base/head and findings attributed to its PR.
   - Run checks as the caller and provide their revision and output paths. Request additional checks only for missing evidence.
2. Compare the changes with approved requirements and success criteria. Review correctness, regressions, security, and maintainability in one pass using the selected mode. Use retained findings and coverage to focus on uncovered sections and affected behavior. Record findings with priorities, locations, evidence, failure scenarios, and coverage gaps. Do not edit reviewed files. Delegate only to the other model when `--cross` is selected.
   - Check diff and transcript access first. Stop on missing access and report the review incomplete. Do not retry denied operations.
3. Validate findings and identify actionable fixes. Match observations by root cause and failing behavior. Update existing finding IDs, including reopening resolved findings on recurrence. Distinct failures at the same location remain separate. Retain status history, evidence, and coverage.
4. Save findings and the pass's reviewed revision, mode, covered sections, and gaps in `REVIEW.md`. Return accumulated unresolved findings and evidence paths. Let Iterate own corrections and additional passes. Keep incomplete review unresolved.
