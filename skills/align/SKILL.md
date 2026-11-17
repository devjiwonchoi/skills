---
name: align
description: Use when planning or starting a task.
---

The goal is to agree with the user on an observable end state for any request, such as research, brainstorm, build, fix, debug, or computer-use tasks, and how each part will be proven, settle every one-way door, then hand off to Iterate.

## Steps

1. Read the request, the preferences file, and existing task records per the `task-recording` skill.
   - When `EXPLORE.md` is in the task folder, start from it.
   - If the preferences file is missing, no one-way door is already allowed.
   - Read `rules.md` and the `## Learned` rules in the preferences file. Follow them in the plan. When a rule and the request disagree, settle that with the user before approval. A missing `rules.md` adds no rules.
   - If the goal or approach is unsettled and there is no `EXPLORE.md`, follow the `explore` skill first.
2. Research only what the end state still needs, with the `research` skill.
   - Research the topic or inspect the brownfield repository, fanning out subagents for wide searches.
   - Run work that shares a browser, screen, or account in sequence.
   - Leave the deliverable work to todos.
   - For bugs, reproduce and find the root cause with the `debug` skill. If it stays unknown, make diagnosis its own todo.
   - For a one-way door, do reversible prep now to learn real values, such as filling a cart and reading the checkout total.
   - Fill gaps from context instead of asking.
3. Classify every action and decision.
   - A two-way door is reversible. Decide it and report the choice in the plan. Do not ask.
   - A one-way door is irreversible, such as buying, paying, sending, deleting, publishing, merging, or deploying. Unless the preferences file already allows it, ask it now with exact values, using the `socratic` skill and the host's question interface when available.
   - When the preferences file allows a one-way door, record the values and which preference allows it. Do not ask.
4. Pick the light or full form from the [template](references/template.md). Use light for a simple task and full otherwise.
5. Open the plan with the end state items. Each item is an observable outcome and names one concrete proof: `E2E: <node-id>`, a file, a command, a test, a screenshot, or a URL.
   - After the items, write `## E2E workflow` with the one diagram from the [template](references/template.md), then the criteria, then the files list when code changes, then the fan-out todos, then the stacked PR plan.
   - The diagram is the only diagram. Each user-visible step is a node in a `flowchart LR`. Group each Playwright journey as a subgraph whose label is the spec file name in kebab-case. Keep each journey to at most 7 nodes. Write work methods, logic, and files changed as plain lists in PR order.
   - An `E2E:` proof names a node id in a journey, such as `E2E: reply-in-thread`. A file proof names a path in the files list.
   - Do not add a logic diagram, a file-tree diagram, or a second diagram. A throwaway HTML prototype stays out of `ALIGN.md`. A todo may build one when UI is involved.
   - In the light form, keep the same opening, including the one diagram. Add the files list when code changes.
6. Write the criteria after the diagram. Start each with an action verb and name the end state item that proves it.
   - In both forms, write the Intention, one line on why the user wants the result, and the Don'ts: what stays out of scope and what must not happen even within scope.
7. Break the work into fan-out todos using the todo spec in the [template](references/template.md), then write the stacked PR plan per the `pr` skill.
   - State what to achieve and how, step by step, so a subagent can run each todo with no other context.
   - Fan out independent work across parallel todos and subagents. Fix shared paths, names, and interfaces in the plan first so that work does not wait.
   - Give todos that could share a file or stateful resource, such as a screen, browser session, or account, a dependency.
   - Mark todos that need tools, grants, or a screen that subagents lack as main agent.
   - For file changes, include commit, push, PR, and the `moniterate` skill todos unless the user limits delivery. Follow the `commit` and `pr` skills. The Stack section states each commit message, PR title and description, branch, base, reviewers to request, and how later fixes land. In the light form, put delivery in one todo and one Stack entry.
8. Check coverage in both directions and revise on gaps.
   - Every end state item has one concrete proof, is named by a criterion, and is built by a todo.
   - Every criterion names the end state item that proves it.
   - Every todo serves an end state item. Cut any that does not.
   - Every `E2E:` proof names a node in a journey subgraph. Every file proof names a path in the files list.
   - No todo does what a Don't rules out.
9. Predict where the run could need a human and clear each point now.
   - Check for sign-in or 2FA, CAPTCHA, missing access or permission grants, missing information, payment or credential entry, external waits, and host or tool rules that forbid an action.
   - Plan an action only the user may perform as a user step.
   - Ask only a one-way door that the preferences file does not already allow, with the exact values from step 2, so Iterate never pauses for it.
   - End with every checkpoint cleared or approved with exact values, and with every one-way door settled. Leave two-way doors as reported decisions.
10. Present the plan in the template format for its form. It opens with the end state items and ends with its Summary.
    - The diagram is the one `e2e-workflow` accepts. When the plan is already a file, run `e2e-workflow check <ALIGN.md>` from this skill's folder. Do not ask for approval when the check fails.
    - Ask only about an unsettled one-way door. Revise from the affected step until they approve the plan. Do not ask a two-way decision.
11. On approval, save `ALIGN.md` in the task folder following the `task-recording` skill, then follow the `iterate` skill with it.
    - Run `e2e-workflow check <ALIGN.md>` from this skill's folder, then `criteria-hash <ALIGN.md>` from the `task-recording` skill folder for either form, and write `Criteria hash: <digest>` outside the hashed section. A failing check is not approval.
    - Copy that approved file to `ALIGN.approved.md` in the same folder. The copy freezes the diagram with the rest of the contract. Replace the copy only on a later approval.
    - Later stages read that diagram and do not redraw it.
    - Approval settles every choice the plan states, including reported two-way decisions, the branch, commits, push, PR, and one-way values. Do not ask for them again.
    - Continue in the current context. Do not force compaction.
    - While host plan mode blocks writes, keep the plan in conversation and save it once writes are allowed. Write the check, the hash, and the approved copy in that same save.
