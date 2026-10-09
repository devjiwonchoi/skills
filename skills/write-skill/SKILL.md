---
name: write-skill
description: Always use when writing a skill.
---

## Rules

- Prefer one short sentence per requested behavior, adding detail only to prevent a consequential misinterpretation.
- Leave routine execution and verification to the agent.

## Steps

1. Write description as `Use when <main task>.` or `Always use when <main task>.`
   - Exclude inspected inputs, supporting actions, and completion conditions.
   - Retain only context needed to distinguish the invocation, such as a file format.
2. Draft from the request and agreed clarifications.
   - Preserve actions, constraints, and completion conditions.
   - Ask only when a consequential ambiguity needs user judgment.
3. Choose the needed sections.
   - Use Steps for ordered or repeated work, keeping every action, branch, and stop in its relevant step.
   - Reserve Rules for independent guidance.
   - Reserve Template for fixed output.
   - Link occasional details with explicit reading conditions.
4. Trim the draft.
   - Remove scope expansion, invented policies, routine procedures, and rules already loaded elsewhere.
   - Keep necessary clarifications.
   - Merge repetition and shorten each remaining instruction.
5. Walk through a realistic use and a relevant branch.
   - Check that required behavior and stopping conditions survive the cuts.

## Description examples

- Good: `Always use when preparing commits.`
- Good: `Use when translating PDF documents.`
- Good: `Use when monitoring a PR.`

## Template

```markdown
---
name: <skill-name>
description: <Use when or Always use when followed by the main task only>
---

<instructions using only the needed sections>
```
