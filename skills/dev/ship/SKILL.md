---
name: ship
description: Use when delivering development changes.
---

## Steps

1. **Check readiness.** Read the approved alignment, current plan, and verification and review results for the exact changes being delivered.
   - If required alignment or plan approval is missing or pending, pause delivery and return to [$align](../align/SKILL.md) or [$plan](../plan/SKILL.md).
   - If required verification or review remains unresolved, report the blocker and pause delivery.
   - If later changes affect those results, refresh the affected [$verify](../verify/SKILL.md) and [$review](../review/SKILL.md) before delivery.
2. **Prepare the delivery.** Use [$commit](../commit/SKILL.md) for commit history and [$pr](../pr/SKILL.md) for PR titles and descriptions.
   - Use `gh-stack` for dependent pull requests.
   - Prepare the concrete artifacts needed for the requested delivery.
3. **Apply the authorized scope.** Use authorization already provided in the conversation.
   - Treat committing, pushing, opening a PR, merging, and deploying as distinct actions.
   - If a required action lacks authorization, present the prepared result and ask only for that action before proceeding.
4. **Deliver and confirm.** Complete the authorized actions and inspect the applicable delivery checks for the resulting revision.
   - Distinguish failed checks from pending or blocked checks.
   - Route required fixes through [$quick-impl](../quick-impl/SKILL.md), verification, and fresh review before delivering the updated revision.
   - Report what was delivered, its commit or resource links, check results, and any remaining blockers.
