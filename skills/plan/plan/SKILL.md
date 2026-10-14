---
name: plan
description: Use when planning a task.
argument-hint: "[--effort low|medium|high]"
---

The goal is to turn the user's aligned intention into a concrete plan they can approve.

When running under Auto, read [Auto mode](references/auto-mode.md).

1. Run [Align](../align/SKILL.md) or resume the current alignment.
2. Measure task difficulty to choose effort, or use `--effort`.
   - Low: quick write-up.
   - Medium: one agent reviews the plan.
   - High: an agent squad [debates the plan](references/debate.md).
3. Draft the approach, work units, verification, and adaptation boundaries. Use [Explain](../../utils/explain/SKILL.md) to show the expected result and ask approval of the plan version. Iterate on requested changes.
4. After approval, follow [plan review](references/review.md) for the chosen effort. Bring blockers back to the user immediately. If the plan changes, repeat step 3 before execution.
5. Proceed to [Execute](../../execute/execute/SKILL.md) after required reviews clear.
