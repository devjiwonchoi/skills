---
name: pr
description: Always use when writing or updating a PR title or description.
---

## Rules

- Write the PR description for a reviewer who has not read the conversation.
- Keep titles short: action verb + change. Put purpose and explanation in the description.
- Base the title on the final diff and retain the details needed to identify the change.
- Use `$commit` to review the commit history when preparing a PR.

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
