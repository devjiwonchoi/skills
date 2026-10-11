---
name: quick-impl
description: Use when implementing development work.
---

## Steps

1. **Establish the work.** Read the user's authorized request and constraints, plus any existing plan or findings.
   - If no plan exists, state a concise approach, work units, and checks from the available context. This outline does not establish user approval.
   - Pause dependent work when required approval is missing or pending.
2. **Implement the work.** Make the smallest coherent changes that fulfill the request, reusing existing patterns where suitable.
   - Address supported findings within the authorized scope. Check relevant implementation or authoritative sources for consequential factual gaps.
   - Compare accumulated amendments with the last actual user-approved plan, or the original request and decisions if no approved plan exists.
   - For consequential changes beyond agreed limits, show the cumulative diff, reason, and impact and pause affected work for a human decision.
     - These include material changes to approach or contracts, new external dependencies, weaker checks, or material increases in cost, effort, or risk.
   - Never change approved intent or constraints automatically.
3. **Report the implementation.** Identify the changed revision, concrete changes, completed work, remaining work, and check results.
   - Distinguish implemented behavior from verified behavior. Continue authorized corrections when subsequent examination finds supported issues.
