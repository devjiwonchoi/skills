---
name: align
description: Always use when clarifying ambiguous requests.
---

The goal is to losslessly _tokenize_ the user's intention as an alignment so the agent can use it as the north star.

Read `node <jwn-root>/cli/index.mts align --help` for usage and `align --schema` for record fields and caller rules. Resolve this skill’s real path to find `<jwn-root>`.

Store records in `.jwn/<session-id>/align/`. Use `read` to recover records and retain its version and `nextOffset` for incremental reads. If `latestVersion` changes, read that version from offset 0. Use `write` throughout clarification. `type: start` begins a new intention version.

1. Break down the user's prompt and understand the user's intention.
2. List the understanding and ambiguities.
3. Use [research](../../utils/research/SKILL.md) to fill the ambiguities.
4. Create questions and recommended answers for the remaining ambiguities.
5. Use [socratic](../../utils/socratic/SKILL.md) to ask until the ambiguities are cleared.
6. Create and ask new questions when new ambiguities arise.
7. Write `type: aligned` after the user's final confirmation.
8. Briefly summarize the final alignment in your own words and ask whether to proceed to planning.
