---
name: plan
description: Use when planning a task.
argument-hint: "[--effort low|medium|high]"
---

The goal is to turn the user's aligned intention into a concrete plan they can approve.

Follow [CLI recording](references/recording.md) for every invocation, including standalone use.

1. Run [Align](../align/SKILL.md) or resume the current alignment.
2. Measure task difficulty to choose effort, or use `--effort`.
   - Low: quick write-up.
   - Medium: one agent reviews the plan.
   - High: an agent squad [debates the plan](references/debate.md).
3. Draft the approach, work units, verification, and adaptation boundaries.
4. Use [Explain](../../utils/explain/SKILL.md) to present the expected result and plan. When existing instructions settle the consequential choices, record acceptance from those instructions and proceed without another confirmation. Otherwise, ask approval of this plan version once. Honor any explicit approval request or pending decision.
5. Follow [plan review](references/review.md) for the chosen effort after acceptance or approval. Bring blockers back to the user immediately. Revisit changed decisions before execution without reopening settled choices.
6. Proceed to [Execute](../../execute/execute/SKILL.md) after required reviews clear.
