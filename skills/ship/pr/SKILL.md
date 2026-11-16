---
name: pr
description: Always use when handling PRs.
---

## Rules

- Before creating or updating PRs, follow the `commit` skill to establish or reconcile the commit structure.
- Map commits to review contexts and independently reviewable outcomes.
- Keep new shared code with its first real caller when the caller is needed to understand its purpose or assess its contract. Use separate commits within that PR.
- Give each independently reviewable outcome its own PR, and ship those PRs as one stack. The bottom PR targets the approved base. Each later PR's branch is based on the previous PR's branch, in dependency order, and its base is that branch.
- When `gh stack` is available, `gh pr create` each layer in order, bottom to top, with its base, repo-style title, and body, then `gh stack link` those PRs bottom to top. This default path avoids publishing a generated title. Alternatively run `gh stack init --base <base> <first-branch>`, `gh stack add <branch>` per later layer, and `gh stack submit --auto --open`, then immediately fix each title and body with `gh pr edit`. When `gh stack` is missing, branch each PR from the previous head, set its base to that branch, and push it.
- Keep only what a reviewer who has not read the conversation needs to understand the problem and solution, and omit work logs.
- Explain new abstractions through their actual entrypoint, caller, and resulting behavior.
- Do not append validation notes or explain how changes were validated in PR descriptions.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Push each change to the PR that owns its review scope.
- When scope changes, rewrite the PR title and description around the final solution.
- Open PRs as ready for review unless the user explicitly requests a draft.
- Every PR above the bottom starts with `Stacked on #<parent PR>.` before `### Why?`. Preserve or update that line whenever editing the description, and verify the saved body.

## Examples

- Add `retro` skill
- Fix login redirect
- Remove unused option

## Template

Follow this exact template, preceded by `Stacked on #<parent PR>.` for every PR above the bottom of the stack:

```markdown
### Why?

<Problem and why it matters.>

### How?

<How the change solves it.>
```
