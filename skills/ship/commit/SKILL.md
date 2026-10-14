---
name: commit
description: Always use when preparing or creating commits.
---

## Rules

- Plan commit boundaries from the final diff before committing or reshaping history.
- Give each commit one purpose. Split distinct changes within a feature.
- Keep supporting tests and documentation with their change.
- Order commits by dependency and keep the project working after each commit.
- Briefly explain what changed, why, and how in each commit message.
- Preserve unrelated working-tree and staged changes, and commit only when authorized.
- When follow-up work supersedes, reverses, or relocates an earlier change, reshape affected commits around the final solution before the next delivery.
- Append a commit only when it remains a coherent, independently reviewable change in the final solution.
