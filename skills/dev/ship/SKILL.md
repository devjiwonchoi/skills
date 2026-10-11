---
name: ship
description: Use when delivering development changes.
---

## Steps

1. **Check readiness.** Read the requested delivery, agreed intent and constraints, exact changes, and any available check or review results.
   - Pause dependent delivery when required user decisions or approvals are missing or pending.
   - Confirm required evidence covers these changes. Gather what is missing.
   - When independent review is required, use a fresh reviewer who did not implement the changes.
   - Report unresolved required checks or review and pause dependent delivery.
2. **Prepare the delivery.** Preserve unrelated working-tree and staged changes.
   - Group commits by purpose and dependency. Briefly explain what changed, why, and how in commit messages.
   - Write reviewer-facing PR titles and descriptions from the final diff.
   - Order dependent PRs by implementation dependency and base each on its parent branch.
3. **Apply the authorized scope.** Honor decisions and permissions already provided in the conversation.
   - Treat committing, pushing, opening a PR, merging, and deploying as distinct actions.
   - If a required action lacks authorization, present the prepared result and ask only for that action before proceeding.
   - Keep approved intent fixed. For consequential changes to it or any approved plan, show accumulated differences from the last user-approved state, reason, and impact and wait for the user's decision.
4. **Deliver and confirm.** Complete the authorized actions and inspect the applicable delivery checks for the resulting revision.
   - Distinguish failed checks from pending or blocked checks.
   - If later changes affect earlier checks or review, refresh that evidence before delivering the updated revision.
   - Report what was delivered, its commit or resource links, check results, and any remaining blockers.
