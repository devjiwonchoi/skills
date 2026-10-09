---
name: write-skill
description: Always use when writing a skill.
---

## Rules

- Write one short sentence per requested behavior.
- Preserve the user's actions and completion conditions.
- Leave routine implementation details to the agent.
- Omit defaults and instructions already covered elsewhere.
- Use Steps for sequences and loops, Rules for constraints, and Template for fixed output.
- Link details needed only in some cases with explicit reading conditions.

## Steps

1. Write description as `Use when <main task>.` or `Always use when <main task>.`, excluding inspected inputs, supporting actions, and completion conditions.
2. Draft instructions directly from the user's request.
3. Delete added actions and conditions, then merge repeated behaviors.

## Description examples

- Good: `Use when asked to translate text.`
- Good: `Always use when preparing commits.`
- Good: `Use when asked to debug a test.`
- Bad: `Use when asked to debug a test's logs and stack traces.`
- Bad: `Use when asked to translate text, preserve tone, and return a polished translation.`

## Template

```markdown
---
name: <skill-name>
description: <Use when or Always use followed by the main task only>
---

<instructions using only the needed sections>
```
