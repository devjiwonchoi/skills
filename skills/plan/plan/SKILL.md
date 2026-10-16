---
name: plan
description: Use when planning a task.
argument-hint: "[--effort low|medium|high]"
---

The goal is to turn the user's intention into a concrete plan they can approve.

After approval, continue through [Iterate](../../iterate/iterate/SKILL.md) → [Ship](../../ship/ship/SKILL.md) within the approved scope, following the compaction and review steps below.

Follow [Plan recording](references/recording.md), including standalone use. Respect the host's active mode. This skill cannot switch the host into or out of Plan Mode.

1. Read the request, existing decisions, and task records. State the goal, constraints, success criteria, and unresolved choices. Keep user requirements distinct from proposed implementation choices.
2. Follow [Research](../../utils/research/SKILL.md) to resolve facts from the repository and relevant sources. Use [Socratic](../../utils/socratic/SKILL.md) to ask only consequential questions that require user judgment. Reuse answers and permissions already established in the conversation.
3. Choose effort from task difficulty, or use `--effort`: low needs no independent reviewer, medium needs one, and high uses the [plan debate](references/debate.md).
4. Use [Explain](../../utils/explain/SKILL.md) to show a small preview before lengthy preparation or debate. Include a file tree with change-purpose comments for file changes, Mermaid for meaningful structure or sequence, and [code flow](../../utils/explain/references/code-flow.md) when behavior needs explanation. Omit inapplicable views. Label unverified proposals.
5. Develop the approach, work units, and adaptation boundaries. Include commit, push, PR creation, and [Moniterate](../../ship/moniterate/SKILL.md) through readiness for human review, unless the user limits delivery. Use [Commit](../../ship/commit/SKILL.md) and [PR](../../ship/pr/SKILL.md) to present the concrete delivery structure before approval.
   - For each commit, show its proposed message, purpose, affected files or behavior, dependencies, and order. Keep supporting tests and documentation with their change and explain how each commit leaves the project working.
   - For each PR, show its included commits, review scope, why it is separate or grouped, target repository, head and base branches, dependency and publishing order, proposed title, and description following the repository template. State ready-for-review or draft status, checks before opening, and Moniterate's completion conditions. Do not assume a single commit or PR.
   - Map success criteria to observable checks and expected results. For behavior changes, trace entrypoints, value flow, packaging, and callers. Resolve consequential choices about proof with the user before dependent preparation.
6. Prepare tests or reproduction within the authorized scope and host mode. When allowed, run them against the unchanged implementation and record the checked files, command or scenario, and result. Distinguish an expected failure from an environment failure. Explain an unavailable or inapplicable baseline. Keep product implementation for Iterate.
7. Present the complete plan, expected result, checks, baseline evidence, and remaining decisions. Record acceptance from existing instructions when they settle the choices. Otherwise, obtain approval of this plan version once. Honor explicit approval requests and pending decisions.
8. After acceptance or approval, follow [compact and continue](references/continuation.md). Save the authorized plan and next action before compaction. Resume from the plan document after the post-compaction hook. Do not treat a compact request as completed compaction.
9. Follow [plan review](references/review.md) after restoring the authorized plan. Record the current version and reviewer verdicts. Bring blockers to the user immediately and revisit changed decisions without reopening settled choices.
10. Proceed to [Iterate](../../iterate/iterate/SKILL.md) after required reviews clear, including standalone Plan use. Pass the task directory, authorized plan, checks, and baseline evidence. While host Plan Mode is active, return the plan and pending execution instead. A baseline or plan review does not prove implementation success.
11. After Iterate completes, follow [Ship](../../ship/ship/SKILL.md) for the approved commit, push, and PR scope. Ship runs Moniterate after publishing the PR. Reuse existing authorization and valid evidence. Report completion only after Moniterate reports readiness, or record the concrete blocker and next action. Do not infer merge, deployment, or reviewer-message permission.
