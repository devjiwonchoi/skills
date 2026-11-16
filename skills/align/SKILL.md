---
name: align
description: Use when planning or starting a task.
---

The goal is to agree with the user on an observable end state for any request, such as research, brainstorm, build, fix, debug, or computer-use tasks, and how each part will be proven, settle every question and permission, then hand off to Iterate.

## Steps

1. Read the request, the preferences file, and existing task records per the `task-recording` skill.
   - If the preferences file is missing, no one-way door is already allowed.
   - If the request is very ambiguous, restate the goal in your own words and get confirmation before continuing.
2. Gather context with the `research` skill.
   - Research the topic or inspect the brownfield repository, fanning out subagents for wide searches.
   - Run work that shares a browser, screen, or account in sequence.
   - Gather only what the end state, decisions, and criteria need. Leave the deliverable work to todos.
   - For bugs, reproduce and find the root cause with the `debug` skill. If it stays unknown, make diagnosis its own todo.
   - For a one-way door, do reversible prep now to learn real values, such as filling a cart and reading the checkout total.
   - Fill gaps from context instead of asking.
3. Classify every action and decision. Settle what is still open with the `socratic` skill, using the host's question interface when available.
   - A two-way door is reversible. Decide it and report the choice afterward.
   - A one-way door is irreversible, such as buying, paying, sending, deleting, publishing, merging, or deploying. Settle it now with exact values, unless the preferences file already allows it.
   - When the preferences file allows a one-way door, record the values and which preference allows it.
4. Pick the light or full form from the [template](references/template.md). Use light for a simple task and full otherwise.
5. Draw the end state with the `explain` skill, without a closing question. Approval happens in step 10.
   - End state items are the success criteria. In the light form they are the `Done when` lines. Name each item's proof, the observable check that shows it is met.
   - In the full form, show a Mermaid walkthrough of the full workflow, then the file tree when code changes, with a comment on why each file is created, modified, or deleted. Show behavior in Mermaid, never code or pseudo code.
   - If UI is involved, build a throwaway HTML prototype.
   - In the light form, write a short end state, and a file tree when code changes. Add a diagram only when that end state does not make the flow clear.
6. Write numbered success criteria. Start each with an action verb and name what meets it and the observable check that proves it.
   - In the light form, fold them into each todo's done-when check instead.
   - In both forms, write the Intention, one line on why the user wants the result, and the Don'ts: what stays out of scope and what must not happen even within scope.
7. Break the work into todos using the todo spec in the [template](references/template.md).
   - State what to achieve and how, step by step, so a subagent can run each todo with no other context.
   - Fan out independent work across parallel todos and subagents. Fix shared paths, names, and interfaces in the plan first so that work does not wait.
   - Give todos that could share a file or stateful resource, such as a screen, browser session, or account, a dependency.
   - Mark todos that need tools, grants, or a screen that subagents lack as main agent.
   - For file changes, include commit, push, PR, and the `moniterate` skill todos unless the user limits delivery. Follow the `commit` and `pr` skills to state each commit message, PR title and description, branch, base, reviewers to request, and how later fixes land. Plan PRs as a stack per the `pr` skill. In the light form, put them in one delivery todo.
8. Check coverage in both directions and revise on gaps.
   - Every end state item is met by the end state, built by a todo, and proven by its named check.
   - Every todo serves an end state item. Cut any that does not.
   - No todo does what a Don't rules out.
   - In the light form, every done-when check proves the end state.
9. Predict where the run could need a human and clear each point now.
   - Check for sign-in or 2FA, CAPTCHA, missing access or permission grants, missing information, payment or credential entry, external waits, and host or tool rules that forbid an action.
   - Plan an action only the user may perform as a user step.
   - Settle every one-way door that the preferences file does not already allow, with the exact values from step 2, so Iterate never pauses for it.
   - End with every checkpoint cleared or approved with exact values, and with every question and permission settled.
10. Present the plan in the template format for its form, leading with the end state and ending with its Summary.
    - Check that every Mermaid diagram parses first.
    - Revise with the user from the affected step until they approve.
11. On approval, save `.jwn/<task>/ALIGN.md` following the `task-recording` skill, then follow the `iterate` skill with it.
    - Run `criteria-hash <ALIGN.md>` from the `task-recording` skill folder for either form, and write `Criteria hash: <digest>` outside the hashed section.
    - Approval settles every choice the plan states, including the branch, commits, push, PR, and one-way values. Do not ask for them again.
    - Continue in the current context. Do not force compaction.
    - While host plan mode blocks writes, keep the plan in conversation and save it once writes are allowed.
