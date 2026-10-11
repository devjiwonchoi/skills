# Multi-agent debate

1. Give separate agents the same plan and approved agreement for independent reviews.
   - **Advocate:** Defend useful choices and explain benefits and tradeoffs.
   - **Critic:** Find failure scenarios, unnecessary complexity, and better alternatives.
   - **Skeptic:** Challenge assumptions and unsupported claims.
2. Share their reviews, have them rebut one another, and revise the plan using supported improvements. Repeat debate, revision, and re-review within a bounded round budget.
3. Preserve the approved agreement. Return proposed changes to it to the user for approval before revising dependent parts.
4. Require every reviewer to explicitly approve the same final version with no substantive blocker unresolved. Reviewer consensus does not grant user approval to execute.
5. Stop when the round budget is exhausted or discussion makes no progress. Return the best current plan with unresolved objections and needed evidence or user decisions.
   - If separate agents are unavailable, report that multi-agent consensus is incomplete.
