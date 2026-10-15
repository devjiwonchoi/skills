---
name: pr
description: Always use when handling PRs.
---

## Rules

- Before creating or updating PRs, follow [Commit](../commit/SKILL.md) to establish or reconcile the commit structure.
- Map commits to review contexts and independently reviewable outcomes.
- Split independently reviewable outcomes into separate PRs by default. Group commits in one PR only when they require joint review.
- Stack dependent PRs on their parent branches in dependency order.
- Keep only what a reviewer who has not read the conversation needs to understand the problem and solution, and omit work logs.
- Do not append validation notes or explain how changes were validated in PR descriptions.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Push each change to the PR that owns its review scope.
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
