---
name: plan
description: Use when planning a task.
argument-hint: "[--effort low|medium|high]"
---

The goal is to turn the user's intention into a concrete plan they can approve.

Follow [Plan recording](references/recording.md), including standalone use. Respect the host's active mode. This skill cannot switch the host into or out of Plan Mode.

1. Read the request, existing decisions, and task records. State the goal, constraints, success criteria, and unresolved choices. Keep user requirements distinct from proposed implementation choices.
2. Follow [Research](../../utils/research/SKILL.md) to resolve facts from the repository and relevant sources. Use [Socratic](../../utils/socratic/SKILL.md) to ask only consequential questions that require user judgment. Reuse answers and permissions already established in the conversation.
3. Choose effort from task difficulty, or use `--effort`: low needs no independent reviewer, medium needs one, and high uses the [plan debate](references/debate.md).
4. Use [Explain](../../utils/explain/SKILL.md) to show a small preview before lengthy preparation or debate. Include a file tree with change-purpose comments for file changes, Mermaid for meaningful structure or sequence, and [code flow](../../utils/explain/references/code-flow.md) when behavior needs explanation. Omit inapplicable views. Label unverified proposals.
5. Develop the approach, work units, and adaptation boundaries. Map success criteria to observable checks and expected results. For behavior changes, trace entrypoints, value flow, packaging, and callers. Resolve consequential choices about proof with the user before dependent preparation.
6. Prepare tests or reproduction within the authorized scope and host mode. When allowed, run them against the unchanged implementation and record the checked files, command or scenario, and result. Distinguish an expected failure from an environment failure. Explain an unavailable or inapplicable baseline. Keep product implementation for Iterate.
7. Present the complete plan, expected result, checks, baseline evidence, and remaining decisions. Record acceptance from existing instructions when they settle the choices. Otherwise, obtain approval of this plan version once. Honor explicit approval requests and pending decisions.
8. Follow [plan review](references/review.md) after acceptance or approval. Record the current version and reviewer verdicts. Bring blockers to the user immediately and revisit changed decisions without reopening settled choices.
9. Proceed to [Iterate](../../iterate/iterate/SKILL.md) after required reviews clear, including standalone Plan use. Pass the task directory, authorized plan, checks, and baseline evidence. While host Plan Mode is active, return the plan and pending execution instead. A baseline or plan review does not prove implementation success.
