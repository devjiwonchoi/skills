---
name: remember
description: Use when saving durable lessons or learning from user corrections to previous work.
user-invocable: true
---

Apply user corrections first. Judge corrections, rejections, and directed frustration from conversation context, excluding quotes and unrelated profanity. For feedback-triggered use, propose remembering only when it reveals a concrete lesson that will help in future tasks.

## Steps

1. Use [distill](../distill/SKILL.md) to extract durable lessons from the work and conversation, including corrections, failures, recoveries, and decisions.
   - Ask for each lesson's evidence and future use.
2. Compare candidates with existing memory and instructions, excluding secrets, raw logs, guesses, duplicates, and transient state.
   - Return `NOTHING_TO_REMEMBER` if none remain.
3. Recommend memory, instructions, `skillify`, or both for each candidate, explaining why.
   - Use native memory for retrievable preferences, facts, decisions, mistakes, or recoveries.
   - Use instructions for behavior that should always apply within its scope.
   - Nominate specialized, repeatable procedures for `skillify`, with their trigger, outcome, and verification.
4. Choose the narrowest useful scope and verify proposed storage through [research](../../utils/research/SKILL.md).
   - Check the active harness's supported destinations, precedence, and write mechanisms, reusing verified findings that still apply.
   - Mark unsupported storage proposals unavailable without discarding Skillify nominations.
   - Return `NO_SAFE_DESTINATION` only if no candidate has a supported writable destination or a Skillify nomination.
5. Present one batch for approval with each lesson's evidence, future use, proposed destination and reason, exact change, and confidence, staleness, or conflict concerns.
   - Include Skillify nominations and any research proposed for persistence.
   - Let the user approve, edit, deselect, or reject each item.
6. Write only approved final forms, preserving unrelated content, and read back the saved content and scope.
   - Report unsuccessful verification without claiming persistence.
   - Return approved Skillify briefs without invoking Skillify.
