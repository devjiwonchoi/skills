---
name: moniterate
description: Use when asked to monitor and iterate on a pull request.
---

## Steps

1. Read the approved delivery scope and current task records through shared [task recording](../../utils/references/recording.md). Check CI and review comments on the latest PR head. Record the PR URL, checked head, remaining work, and next check in `STATUS.md`.
2. If a human leaves review comments, a fix falls outside the approved scope, merge or deployment is needed, or a blocker needs human input, report it to the user and pause the loop.
3. Rerun failed CI checks that appear flaky and inspect each retry.
4. Follow [Iterate](../../iterate/iterate/SKILL.md) for failures introduced by our changes and valid bot findings within existing authorization. Commit and push only after execution completes.
5. Recheck CI and bot comments on the latest PR head after reruns or pushes.
6. Check again about every five minutes with any available means, and keep the run going while waiting. Stop when CI is green and bot reviews have finished with no unaddressed comments, or report a blocker when repeated failures make no progress. Preserve the latest head, results, blockers, and next action in `STATUS.md` so monitoring resumes after context loss. Record and report readiness for human review only for that checked head, without merging.
