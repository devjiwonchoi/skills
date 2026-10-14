# Multi-agent debate

1. After user approval, give separate agents the same approved plan version and current alignment for independent reviews.
   - **Advocate:** Defend useful choices and explain benefits and tradeoffs.
   - **Critic:** Find failure scenarios, unnecessary complexity, and better alternatives.
   - **Skeptic:** Challenge assumptions and unsupported claims.
2. Share the reviews, have reviewers rebut one another, and identify supported corrections. Bring blockers to the user immediately.
3. Group plan changes into a new version and return to [Plan](../SKILL.md) for user approval before re-reviewing affected behavior. Return intention changes to [Align](../../align/SKILL.md) before dependent work.
4. Require every reviewer to explicitly approve the same current, user-approved content and version with no substantive blocker unresolved. Reviewer consensus does not replace user approval.
5. Repeat within a bounded round budget. Stop when the budget is exhausted or discussion makes no progress. Return the current plan with unresolved objections and needed evidence or user decisions.
   - If separate agents are unavailable, report that multi-agent consensus is incomplete.
