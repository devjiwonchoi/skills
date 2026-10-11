---
name: pr
description: Always use when writing or updating a PR title or description.
---

## Rules

- Keep only what a reviewer who has not read the conversation needs to understand the problem and solution, and omit work logs.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Review commit purposes, dependency order, and overall history when preparing a PR.

## Examples

- Add `align` skill
- Fix login redirect
- Remove unused option

## Template

Follow this exact template:

```markdown
### Why?

<Problem and why it matters.>

### How?

<How the change solves it.>
```
