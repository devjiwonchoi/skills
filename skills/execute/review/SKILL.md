---
name: review
description: Use when reviewing development changes.
---

## Steps

1. Read the repository, target revision, diff base or scope, and available session context.
   - Review stacks together with each PR's base/head and findings attributed to its PR.
   - Run checks as the caller and provide their revision and output paths. Request additional checks only for missing evidence.
2. Review correctness, regressions, security, and maintainability directly. Record findings with priorities, locations, evidence, failure scenarios, and coverage gaps. Do not edit or delegate.
   - Check diff and transcript access first. Stop on missing access and report the review incomplete. Do not retry denied operations.
3. Validate findings and identify actionable fixes.
4. Report the reviewed revision, validated findings, and coverage gaps. Keep incomplete review unresolved.
