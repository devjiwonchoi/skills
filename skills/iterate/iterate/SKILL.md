---
name: iterate
description: Use when executing an aligned plan.
---

## Rules

- Complete [Explain](../../utils/explain/SKILL.md) before asking a question.
- With `--cross`, pass `--cross` to every Review invocation, including correction passes. Otherwise use Review's default mode.
- Stop and ask only when reality differs from `ALIGN.md` or a loop makes no progress.
  - Reality differs when values change, an unplanned blocker appears, or an approved decision needs to change.
  - A loop makes no progress when a fix attempt leaves the same failure or finding and adds no new evidence.
  - Do not ask again for anything the approved plan settles.
- Subagents never ask the user. They return blockers, changed values, and needed decisions to the main agent, which applies the stop rule.

## Steps

Follow [execution recording](references/recording.md) for every invocation, including standalone use.

1. Read `ALIGN.md` and `STATUS.md` for the task.
   - Run only an `ALIGN.md` whose status says approved.
   - Add findings supplied by the caller, such as CI failures, bot comments, or Ship corrections, as fix todos.
   - Without an `ALIGN.md`, turn the request or findings into todos in the same spec within existing authorization.
   - Follow [Align](../../align/SKILL.md) first when intent or decisions are unsettled.
2. Execute: start every unfinished todo whose dependencies are done, each in its own subagent with its todo spec, the `ALIGN.md` path, and the rule that subagents return decisions instead of asking.
   - Hold delivery todos, such as commit, push, PR, and Moniterate, for step 5, where Ship runs them.
   - Go to step 3 when only held todos remain.
   - Run main-agent todos in the session. Without subagents, run every todo in the session in dependency order.
   - Todos that change files follow [Impl](../impl/SKILL.md) scoped to that todo.
   - Re-run a todo with its failure evidence until its done-when passes.
   - Run one-way todos only with their approved values.
3. Review: check every success criterion with [Verify](../verify/SKILL.md), except those served only by held delivery todos. Ship proves those.
   - When files changed, also follow [Review](../review/SKILL.md) once for the current revision.
4. Repeat: turn failed criteria and validated P0–P2 findings into fix todos and return to step 2.
   - Review the fix delta and affected behavior.
5. Finish: when delivery todos exist, follow [Ship](../../ship/ship/SKILL.md) for them unless the caller owns delivery, then record them done. Otherwise report the result against each criterion with evidence.
