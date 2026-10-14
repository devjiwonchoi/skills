---
name: pr
description: Always use when handling PRs.
---

## Rules

- Follow [Commit](../commit/SKILL.md) before creating or updating PRs.
- Split independently reviewable outcomes into separate PRs by default. Group commits only when they share a review context and require joint review.
- Base dependent PRs on their parent branches.
- Keep only what a reviewer who has not read the conversation needs to understand the problem and solution, and omit work logs.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Push changes to their owning PR.
- When scope changes, rewrite the PR title and description around the final solution.
- Open PRs as ready for review unless the user explicitly requests a draft.
- For dependent PRs, put `Stacked on #<parent PR>.` before `### Why?`. Preserve or update it whenever editing the description, and verify the saved body.

## Examples

- Add `align` skill
- Fix login redirect
- Remove unused option

## Template

Follow this exact template, preceded by the stack prefix for dependent PRs:

```markdown
### Why?

<Problem and why it matters.>

### How?

<How the change solves it.>
```
