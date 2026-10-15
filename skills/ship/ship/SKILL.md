---
name: ship
description: Use when delivering development changes.
---

## Steps

1. Check the requested delivery, agreed intent, final diff, and available evidence. Resolve required decisions, approvals, checks, and review before dependent delivery. Follow [Review](../../execute/review/SKILL.md) for required review.
   - Return supported correction work to [Execute](../../execute/execute/SKILL.md) within existing authorization.
2. Follow [Commit](../commit/SKILL.md) and [PR](../pr/SKILL.md) to establish the commit and PR structure before delivery. Draft reviewer-facing titles and descriptions from the final diff.
3. Before delivery or requesting authorization, use [explain](../../utils/explain/SKILL.md) to show final behavior and diff, evidence for agreed success criteria, commit boundaries and messages, their PR grouping and dependencies, titles and descriptions, and remaining risks or gaps. Link the diff and evidence.
4. Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Changes to approved intent or material plan changes need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
5. Follow [Verify](../../execute/verify/SKILL.md) to check and reconcile the resulting revision, then follow Review for affected review before completing authorized delivery. Repeat the explanation if the presented result changes.
6. After publishing a PR, follow [Moniterate](../moniterate/SKILL.md) within the existing scope and authorization. Obtain its readiness report before reporting the final result.
7. Report the final revision, links, evidence, and readiness for human review.
   - For published PRs, recommend reviewers from repository guidance, ownership, and review history. Explain why and finish by asking whether to request review. Send only after user approval. If none are supported, explain the gap and ask the user to name one.
