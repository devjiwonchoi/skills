---
name: ship
description: Use when delivering development changes.
---

## Steps

Follow [delivery recording](references/recording.md), including standalone use.

1. Check the requested delivery, agreed intent, final diff, and available evidence. Resolve required decisions, approvals, checks, and review before dependent delivery. Reuse Iterate's verification and review evidence when it remains valid for the current revision, scope, and dependency context. Follow [Verify](../../iterate/verify/SKILL.md) and [Review](../../iterate/review/SKILL.md) only for missing or invalidated evidence.
   - Return supported correction work to [Iterate](../../iterate/iterate/SKILL.md) within existing authorization.
2. Follow [Commit](../commit/SKILL.md) and [PR](../pr/SKILL.md) to establish the commit and PR structure before delivery. Draft reviewer-facing titles and descriptions from the final diff.
3. Before delivery or requesting authorization, use [explain](../../utils/explain/SKILL.md) to show final behavior and diff, evidence for agreed success criteria, commit boundaries and messages, their PR grouping and dependencies, titles and descriptions, and remaining risks or gaps. Link the diff and evidence.
4. Reuse the Plan's actual delivery and repair permissions without asking again. Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Changes to approved intent or material plan changes need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
5. After preparing delivery, reconcile the final revision with the checked evidence. Recheck and review only changed or affected behavior. Repeat the explanation if the presented result changes.
6. Record and reconcile publication results, then follow [Moniterate](../moniterate/SKILL.md) within the existing scope and authorization. Obtain its readiness report before reporting the final result.
7. Report the final revision, links, evidence, and readiness for human review.
   - Recommend supported reviewers when useful. Request review or send messages only with existing explicit authorization. Readiness does not require a new question.
