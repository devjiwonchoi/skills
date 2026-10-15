---
name: auto
description: Use when carrying a development task through completion.
---

## Steps

1. Read [state](references/state.md) to initialize this session's `.jwn/<session-id>/` or [recover](references/recovery.md) existing work and continue from its recorded stage.
   - Adopt this session's standalone stage records and Plan documents with their actual approvals and evidence. Start at the first unfinished stage, reusing unchanged, unconflicted approvals consistent with the current intention.
2. Follow [Align](../plan/align/SKILL.md) with the project root and retained alignment session ID.
3. Follow [Plan](../plan/plan/SKILL.md) with the same root and session ID. Advance after acceptance from existing instructions or required user approval, and after required detailed reviews clear.
4. Follow [Execute](../execute/execute/SKILL.md) with the Auto task directory.
5. Follow [Ship](../ship/ship/SKILL.md) for authorized delivery.
   - Advance to `done`/`complete` only after Ship reports verified readiness for human review. Until then, retain the `ship` stage and its remaining work.
6. Before yielding with required work unfinished, continue available authorized actions. For an external wait, use an available authorized resumption mechanism. Otherwise, report the concrete decision or blocker and how to resume. Honor explicit user stops and required approval waits.

Pass the task directory to each stage. Use the state contract to record stage changes, approvals, blockers, delivery outcomes, and the final state.
