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
3. Draft the approach, work units, adaptation boundaries, and permissions for implementation, commit, push, PR publication and follow-up repairs. Preserve narrower existing permissions. Map each success criterion to a test, reproduction, or other observable check with its expected result and evidence. Resolve consequential choices about what proves success with the user before dependent preparation. Reuse methods already established by the request or repository.
   - For behavior changes, trace the affected entrypoints and value flow through producers, packaging, and callers. Check the actual caller or package version where relevant. Cover these paths in verification and identify unverified assumptions.
4. Prepare the tests or reproduction within the authorized scope before implementation. Run them against the unchanged implementation when possible to confirm the expected failure. Record the checked revision, command or scenario, and observed result. Distinguish a reproduced failure from an environment failure, and explain when a failing baseline is unavailable or inapplicable. Keep product implementation for Iterate.
5. Follow [plan review](references/review.md) for the chosen effort. Correct supported findings and re-review affected behavior before final authorization.
6. Use [Explain](../../utils/explain/SKILL.md) to present the final reviewed candidate, verification methods, baseline evidence, adaptation boundaries, and delivery permissions together. Record acceptance when existing instructions settle these choices. Otherwise, obtain approval of this version once. Never invent or broaden permission.
7. Confirm `plan next` reports `iterate`, then proceed to [Iterate](../../iterate/iterate/SKILL.md). Pass the approved verification methods, prepared tests or reproduction, baseline evidence and delivery permissions. A failing baseline does not establish implementation success.
