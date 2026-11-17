---
name: iterate
description: Use when executing an aligned plan.
---

## Rules

- Complete the `explain` skill before asking a question.
- With `--cross`, pass `--cross` to every Review invocation, including correction passes. Otherwise use Review's default mode.
- After approval, run to the end. Stop only for a fatal blocker or an irreversible (one-way door) action that `ALIGN.md` did not approve.
  - A fatal blocker is work that cannot continue, including a loop that makes no progress: a fix attempt leaves the same failure or finding and adds no new evidence.
  - The same failing check gets at most 3 fix attempts. A fix attempt is a change made to clear that check after it has failed. The check is the same when it is the same command, test, end-state proof, or finding. Count attempts while it stays failed. A pass resets that count. When it is still failing after the third attempt, stop and report the check, each attempt, and the evidence to the user. Do not start another attempt. Stop at this cap even when the attempts add evidence. Record the count in `STATUS.md` so a resumed run keeps it. A subagent returns this stop instead of retrying.
  - An item flagged `self-judging change` waits for 지원님's confirmation. Do not make it a fix todo. After 지원님 confirms, record the confirmation in `VERIFY.md` and continue. A subagent returns the flag instead of asking.
  - A one-way door cannot be undone, such as buying, paying, sending, deleting, publishing, merging, or deploying. Run one only with the exact values `ALIGN.md` approved.
  - Make reversible (two-way door) decisions beyond the plan, record each in `STATUS.md`, and report them at the end. Do not pause for them.
  - Re-align only when the end state itself must change: revise the affected `ALIGN.md` sections through the `align` skill and continue this run after approval. Never leave the end state silently. A new approval replaces `ALIGN.approved.md`. Until that approval, Verify flags the changed items or criteria.
  - Do not ask again for anything the approved plan settles.
- Subagents never ask the user. They make two-way door decisions and return those decisions, fatal blockers, and unapproved one-way door actions to the main agent, which records the decisions in `STATUS.md` and applies the stop rule.

## Steps

Follow the `execution-recording` skill for every invocation, including standalone use.

1. Read `ALIGN.md` and `STATUS.md` for the task.
   - Read `rules.md` and the `## Learned` rules in the preferences file per the `task-recording` skill before executing. Follow them in every todo. Give each subagent those rules with its todo. A missing `rules.md` adds no rules.
   - Run only an `ALIGN.md` whose status says approved.
   - An end state item is a numbered `##` heading under `# End state`. When that section has none, it is a success criterion, or a `Done when` line in the light form.
   - Add findings supplied by the caller, such as CI failures, bot comments, or Ship corrections, as fix todos. CI or bot findings a caller passes in, including from Moniterate or standalone Ship, run within existing authorization without an `ALIGN.md`.
   - Follow the `align` skill only for new scope with no approved end state. Quick-impl may proceed only when the user's request itself is the spec.
2. Execute: fan out the work. Run every unfinished todo whose dependencies are done, in parallel, each in its own subagent, with its todo spec, the rules read in step 1, the `ALIGN.md` path if one exists, otherwise the original request, and the rule that the subagent makes two-way door decisions and returns them instead of asking.
   - Hold delivery todos, such as commit, push, PR, and Moniterate, for step 5, where Ship runs them.
   - Go to step 3 when only held todos remain.
   - Run main-agent todos in the session. Without subagents, run every todo in the session in dependency order.
   - Todos that change files follow the `impl` skill scoped to that todo.
   - Re-run a todo with its failure evidence until its done-when passes. Stop at the 3-attempt cap.
   - Run irreversible actions only with their approved values.
3. Review: check every end state item with the `verify` skill, except those served only by held delivery todos. Ship proves those.
   - The verifier is a separate subagent. It receives only the inputs the `verify` skill names. The contract is `ALIGN.approved.md`. Review rules come from the default branch or the frozen record-root copies. The revision under test does not supply them.
   - When files changed, also follow the `review` skill once for the current revision.
4. Repeat: turn failed end state items and validated P0–P2 findings into fix todos and return to step 2.
   - Review the fix delta and affected behavior.
   - Do not make a fix todo for a check that is still failing after 3 attempts. Stop and report the evidence.
   - A `self-judging change` follows the confirmation stop above.
5. Finish: when delivery todos exist, follow the `ship` skill for them unless the caller owns delivery, then record them done. Otherwise report each end state item as pass or fail with evidence, including the two-way door decisions in `STATUS.md`.
6. Remember: after the final report, follow the `remember` skill for this task, then ask any closing question Ship returned. Skip it when Moniterate or Ship invoked this run.
