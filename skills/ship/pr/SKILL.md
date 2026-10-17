---
name: pr
description: Always use when handling PRs.
---

## Rules

- Before creating or updating PRs, follow [Commit](../commit/SKILL.md) to establish or reconcile the commit structure.
- Map commits to review contexts and independently reviewable outcomes.
- Keep new shared code with its first real caller when the caller is needed to understand its purpose or assess its contract. Use separate commits within that PR.
- Split outcomes into separate PRs when each is independently understandable and reviewable.
- Stack dependent PRs on their parent branches in dependency order.
- Keep only what a reviewer who has not read the conversation needs to understand the problem and solution, and omit work logs.
- Explain new abstractions through their actual entrypoint, caller, and resulting behavior.
- Do not append validation notes or explain how changes were validated in PR descriptions.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Push each change to the PR that owns its review scope.
- When scope changes, rewrite the PR title and description around the final solution.
- Open PRs as ready for review unless the user explicitly requests a draft.
- For dependent PRs, put `Stacked on #<parent PR>.` before `### Why?`. Preserve or update it whenever editing the description, and verify the saved body.

## Examples

- Add `retro` skill
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
