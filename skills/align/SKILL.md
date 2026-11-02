---
name: align
description: Use when planning or starting a task.
---

The goal is to agree with the user on the end state of any request, such as research, brainstorm, build, fix, debug, or computer-use tasks, and how to reach it, then hand off to Iterate.

## Steps

1. Read the request and existing task records.
   - If the request is very ambiguous, restate the goal in your own words and get confirmation before continuing.
2. Gather context with [Research](../utils/research/SKILL.md).
   - Research the topic or inspect the brownfield repository, fanning out subagents for wide searches.
   - Run work that shares a browser, screen, or account in sequence.
   - Gather only what the end state, decisions, and criteria need. Leave the deliverable work to todos.
   - For bugs, reproduce and find the root cause with [Debug](../utils/debug/SKILL.md). If it stays unknown, make diagnosis its own todo.
   - For one-way actions, do reversible prep now to learn real values, such as filling a cart and reading the checkout total.
   - Fill gaps from context instead of asking.
3. Ask only the important decisions with [Socratic](../utils/socratic/SKILL.md), using the host's question interface when available.
4. Pick the light or full form from the [template](references/template.md). Use light for a simple task and full otherwise.
5. Draw the end state with [Explain](../utils/explain/SKILL.md), without a closing question. Approval happens in step 10.
   - In the full form, always show a Mermaid walkthrough of the full workflow. Show behavior in Mermaid, never code or pseudo code.
   - If UI is involved, build a throwaway HTML prototype.
   - In the full form, if files change, show the full file tree with a comment on why each file is created, modified, or deleted.
   - In the light form, skip this step unless a diagram would clarify a flow the Goal does not.
6. Write numbered success criteria. Start each with an action verb and name what meets it and what proves it.
   - In the light form, fold them into each todo's done-when check instead.
7. Break the work into todos using the todo spec in the [template](references/template.md).
   - State what to achieve and how, step by step, so a subagent can run each todo with no other context.
   - Fan out everything that can run in parallel.
   - Give todos that could share a file or stateful resource, such as a screen, browser session, or account, a dependency.
   - Mark todos that need tools, grants, or a screen that subagents lack as main agent.
   - For file changes, include commit, push, PR, and [Moniterate](../ship/moniterate/SKILL.md) todos unless the user limits delivery. Follow [Commit](../ship/commit/SKILL.md) and [PR](../ship/pr/SKILL.md) to state each commit message, PR title and description, branch, base, reviewers to request, and how later fixes land. In the light form, put them in one delivery todo.
8. Check coverage in both directions and revise on gaps.
   - Every criterion is met by the end state, built by a todo, and proven by a done-when check.
   - Every todo serves a criterion. Cut any that does not.
   - In the light form, every done-when check proves the Goal.
9. Predict where the run could need a human and clear each point now.
   - Check for sign-in or 2FA, CAPTCHA, missing access or permission grants, missing information, payment or credential entry, external waits, and host or tool rules that forbid an action.
   - Plan an action only the user may perform as a user step.
   - Tag each todo's door as two-way or one-way.
   - Settle every one-way action, such as buying, paying, sending, deleting, publishing, merging, or deploying, with the exact values learned in step 2.
   - End every checkpoint cleared or approved with exact values.
10. Present the plan in the template format for its form, ending with its Summary.
    - Check that every Mermaid diagram parses first.
    - Revise with the user from the affected step until they approve.
11. On approval, save `.jwn/<task>/ALIGN.md` following [task recording](../utils/references/recording.md), then follow [Iterate](../iterate/iterate/SKILL.md) with it.
    - Approval settles every choice the plan states, including the branch, commits, push, PR, and one-way values. Do not ask for them again.
    - Continue in the current context. Do not force compaction.
    - While host plan mode blocks writes, keep the plan in conversation and save it once writes are allowed.
