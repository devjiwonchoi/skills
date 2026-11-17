---
name: iterate
description: Use when executing an aligned plan.
---

## Rules

- Complete the `explain` skill before asking a question.
- With `--cross`, pass `--cross` to every Review invocation, including correction passes. Otherwise use Review's default mode.
- After approval, keep going while the work stays inside the approved contract and the same failing item has had fewer than 3 fix attempts. Each stop below is a useful outcome. Report it with the evidence. Do not treat it as a failure.
  - Stop after 3 fix attempts on the same failing item. Report the item, each attempt, and the evidence.
  - Stop when the failure cannot be reproduced. Report what was tried.
  - Stop when the next change would leave the approved contract. Do not widen the contract to keep going.
  - Stop when the next action is high risk. A one-way door cannot be undone, such as buying, paying, sending, deleting, publishing, merging, or deploying. Run one only with the exact values the contract approved.
  - Make reversible (two-way door) decisions beyond the plan, record each in `STATUS.md`, and report them at the end. Do not pause for them.
  - Re-align only when the user approves a new end state, including the E2E workflow diagram. A new approval replaces `ALIGN.approved.md`. Until that approval, stop and report. Do not leave the end state silently, and do not keep implementing outside the contract. Verify flags the changed items, criteria, or diagram.
  - Do not redraw the E2E workflow diagram. Read it from the approved contract, `ALIGN.approved.md` or the default branch copy, never from the working change. Cite its node ids.
  - Do not ask again for anything the approved plan settles.
- Subagents never ask the user. They make two-way door decisions and return those decisions and any stop to the main agent, which records the decisions in `STATUS.md` and applies the stop rule.

## Steps

Follow the `execution-recording` skill for every invocation, including standalone use.

1. Read `ALIGN.md` and `STATUS.md` for the task.
   - Read `rules.md` and the `## Learned` rules in the preferences file per the `task-recording` skill before executing. Follow them in every todo. Give each subagent those rules with its todo. A missing `rules.md` adds no rules.
   - Run only an `ALIGN.md` whose status says approved.
   - An end state item is a numbered `##` heading under `# End state`. The `## E2E workflow` heading is the diagram, not an item. When that section has no numbered headings, an item is a success criterion, or a `Done when` line in the light form.
   - Add findings supplied by the caller, such as CI failures, bot comments, or Ship corrections, as fix todos. CI or bot findings a caller passes in, including from Moniterate or standalone Ship, run within existing authorization without an `ALIGN.md`.
   - Follow the `align` skill only for new scope with no approved end state. Quick-impl may proceed only when the user's request itself is the spec.
2. Execute: fan out the work. Run every unfinished todo whose dependencies are done, in parallel, each in its own subagent, with its todo spec, the rules read in step 1, the `ALIGN.md` path if one exists, otherwise the original request, and the rule that the subagent makes two-way door decisions, returns them and any stop, and does not ask.
   - Hold delivery todos, such as commit, push, PR, and Moniterate, for step 5, where Ship runs them.
   - Go to step 3 when only held todos remain.
   - Run main-agent todos in the session. Without subagents, run every todo in the session in dependency order.
   - Todos that change files follow the `impl` skill scoped to that todo.
   - Re-run a failed todo with its failure evidence. The same failing item gets at most 3 fix attempts, then the stop rule applies.
   - Run an irreversible action only with the exact values the contract approved. Otherwise the stop rule applies.
3. Review: check every end state item with the `verify` skill, except those served only by held delivery todos. Ship proves those.
   - The verifier is a separate subagent. It receives the approved contract and the artifacts. The contract is `ALIGN.approved.md`, or the default branch copy when that file is missing or the checked change edits it. It may see the working `ALIGN.md` only to flag drift.
   - When files changed, also follow the `review` skill once for the current revision.
4. Repeat: turn failed end state items and validated P0–P2 findings into fix todos and return to step 2.
   - Each return counts as one fix attempt for that item. After 3 failed attempts, stop and report. Do not return again.
   - Review the fix delta and affected behavior.
5. Finish: when a stop rule applies, report that useful outcome with its reason, attempts, and evidence, and skip delivery. When delivery todos exist and no stop applies, follow the `ship` skill for them unless the caller owns delivery, then record them done. Otherwise report each end state item as pass or fail with evidence, including the two-way door decisions in `STATUS.md`.
6. Remember: after the final report, follow the `remember` skill for this task, then ask any closing question Ship returned. Skip it when Moniterate or Ship invoked this run.
