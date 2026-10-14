---
name: align
description: Always use when clarifying ambiguous requests.
---

The goal is to losslessly _tokenize_ the user's intention as an alignment so the agent can use it as the north star.

When running under Auto, read [Auto mode](references/auto-mode.md).

1. Break down the user's prompt and understand the user's intention.
2. List the understanding and ambiguities.
3. Use [research](../../utils/research/SKILL.md) to fill the ambiguities.
4. Create questions and recommended answers for the remaining ambiguities.
5. Use [socratic](../../utils/socratic/SKILL.md) to ask until the ambiguities are cleared.
6. Create and ask new questions when new ambiguities arise.
7. Confirm the final alignment with the user.
8. Briefly summarize the final alignment in your own words and ask whether to proceed to [Plan](../plan/SKILL.md).
