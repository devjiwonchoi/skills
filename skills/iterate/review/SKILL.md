---
name: review
description: Use when reviewing development changes.
---

## Steps

Follow [execution recording](../iterate/references/recording.md) for every invocation, including standalone use.

1. Read the repository, target revision, diff base or scope, and available session context.
   - Review stacks together with each PR's base/head and findings attributed to its PR.
   - Run checks as the caller and provide their revision and output paths. Request additional checks only for missing evidence.
2. Compare the changes with approved requirements and success criteria. Review correctness, regressions, security, and maintainability directly in one pass. Use retained findings and coverage to focus on uncovered sections and affected behavior. Record findings with priorities, locations, evidence, failure scenarios, and coverage gaps. Do not edit or delegate.
   - Check diff and transcript access first. Stop on missing access and report the review incomplete. Do not retry denied operations.
3. Validate findings and identify actionable fixes. Match observations by root cause and failing behavior. Update existing finding IDs, including recurrence, and retain accumulated findings and coverage.
4. Return the reviewed revision, accumulated unresolved findings, reviewed sections, and coverage gaps. Let Iterate own corrections and additional passes. Keep incomplete review unresolved.
