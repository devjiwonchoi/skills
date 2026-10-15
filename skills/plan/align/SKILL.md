---
name: align
description: Always use when clarifying ambiguous requests.
---

The goal is to losslessly _tokenize_ the user's intention as an alignment so the agent can use it as the north star.

Follow [CLI recording](references/recording.md) for every invocation, including standalone use.

1. Break down the user's prompt and understand the user's intention.
2. List the understanding and ambiguities.
3. Use [research](../../utils/research/SKILL.md) to fill the ambiguities.
4. Create questions and recommended answers only for ambiguities that need user judgment.
5. Use [socratic](../../utils/socratic/SKILL.md) to ask until the ambiguities are cleared.
6. Resolve new ambiguities through research or user judgment as above.
7. Summarize and proceed when existing instructions establish the intention. Record the request and why it suffices. Ask only about consequential interpretations or explicitly requested confirmation.
8. Continue to [Plan](../plan/SKILL.md) within the requested workflow without asking again whether to proceed. Stop after alignment when invoked alone.
