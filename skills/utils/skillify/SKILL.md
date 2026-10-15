---
name: skillify
description: Use when turning a reusable procedure into a skill.
---

## Rules

- Keep secrets, raw transcripts, and unrelated session history out of the skill.
- Commit or publish only with explicit permission.

## Steps

1. Extract the reusable procedure from the session or supplied brief: trigger, outcome, steps, boundaries, failure handling, and verification.
   - Return `NOT_SKILL_WORTHY` if no repeatable procedure remains.
2. Find an existing skill that owns the behavior, or choose a focused name and destination using the repository's conventions.
3. Apply [write-skill](../write-skill/SKILL.md) to create or update that skill from the extracted procedure.
   - Return `NEEDS_HUMAN` if write-skill is unavailable.
4. Show the resulting skill and any unverified behavior.
   - It must have one clear owner, a reliable trigger, executable steps, boundaries, and a checkable outcome.
