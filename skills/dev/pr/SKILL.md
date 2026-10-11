---
name: pr
description: Always use when writing or updating a PR title or description.
---

## Rules

- Keep only what a reviewer who has not read the conversation needs to understand the problem and solution, and omit work logs.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Before creating or updating a PR, verify that commits have clear purposes, follow dependency order, and represent the final solution without superseded steps.
- When scope changes, follow [commit](../commit/SKILL.md) to reconcile the commit structure before updating the PR title and description.

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
