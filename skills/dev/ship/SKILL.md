---
name: ship
description: Use when delivering development changes.
---

## Steps

1. Check the requested delivery, agreed intent, final diff, and available evidence. Resolve required decisions, approvals, checks, and review before dependent delivery. Required independent review uses a fresh reviewer who did not implement the changes.
2. Group commits by purpose and dependency with brief what/why/how messages. Write reviewer-facing PR titles and descriptions from the final diff; base dependent PRs on their parent branches.
3. Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Prepare a reviewable result before asking for missing authorization. Changes to approved intent or material plan changes need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
4. Refresh checks or review affected by new changes before delivery. Complete authorized delivery and inspect checks for the resulting revision. Report that revision, links, check results, and blockers.
