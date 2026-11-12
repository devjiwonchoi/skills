---
name: ship
description: Use when delivering development changes.
---

## Steps

1. Check the requested delivery, agreed intent, final diff, and available evidence. Resolve required decisions, approvals, checks, and review before dependent delivery. Reuse Iterate's verification and review evidence when it remains valid for the current revision, scope, and dependency context. Follow [Verify](../../iterate/verify/SKILL.md) and [Review](../../iterate/review/SKILL.md) only for missing or invalidated evidence.
   - Hand supported correction work back to the calling [Iterate](../../iterate/iterate/SKILL.md) within existing authorization. When invoked standalone, follow Iterate as its delivery owner.
2. Follow [Commit](../commit/SKILL.md) and [PR](../pr/SKILL.md) to reconcile the commit and PR structure in the approved `ALIGN.md` delivery todos with the final diff, or establish it when no structure was approved. Refine reviewer-facing messages, titles, and descriptions from the final behavior. Return material changes to approved commit boundaries, PR grouping, or dependencies to the user before creating or reshaping them.
3. Before delivery or requesting authorization, use [explain](../../utils/explain/SKILL.md) to show final behavior and diff, evidence for agreed success criteria, commit boundaries and messages, their PR grouping and dependencies, titles and descriptions, and remaining risks or gaps. Link the diff and evidence. When `ALIGN.md` authorizes the delivery, show this and continue without asking.
   - Compare the result with the approved end state in `ALIGN.md`, or with the agreed request when there is none. Lead with a one-line verdict, then show each success criterion, or each done-when check in the light form, with its evidence, failures first. Name where the actual flow and files differ from what `ALIGN.md` expected, and whether any Don't was broken.
   - Treat a departure from the end state that Iterate did not re-align as a failure. Report it and hand it back to Iterate instead of delivering it.
4. Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Reuse the approved `ALIGN.md` authorization for the commits, branch pushes, PRs, and Moniterate its delivery todos state without asking again. Changes to approved intent or material plan changes need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
5. After preparing delivery, reconcile the final revision with the checked evidence. Recheck and review only changed or affected behavior. Repeat the explanation if the presented result changes.
6. After publishing a PR, follow [Moniterate](../moniterate/SKILL.md) within the existing scope and authorization. Obtain its readiness report before reporting the final result.
7. Report the final revision, links, the end-state comparison, and readiness for human review.
   - For published PRs, request the reviewers `ALIGN.md` names without asking. Otherwise recommend reviewers from repository guidance, ownership, and review history. Explain why and finish by asking whether to request review. Send only after user approval. If none are supported, explain the gap and ask the user to name one.
