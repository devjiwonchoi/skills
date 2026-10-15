---
name: moniterate
description: Use when asked to monitor and iterate on a pull request.
---

## Steps

1. Recover [delivery recording](../ship/references/recording.md). Refresh actual PR head/base, required checks and expected bot reviews from repository policy and the approved Plan. Absence of comments does not establish completion of an expected bot review.
2. Validate human and bot findings against the approved requirements. Repair confirmed in-scope defects under existing authorization. Escalate new requirements, changed decisions or blockers needing user input. Optional nits do not restart implementation. Reconcile review-thread state under existing authorization before readiness.
3. Rerun failed CI checks that appear flaky and inspect each retry.
4. Follow [Iterate](../../iterate/iterate/SKILL.md) for failures introduced by our changes and valid in-scope findings within existing authorization. Commit and push only after execution completes.
5. Recheck CI and bot comments on the latest PR head after reruns or pushes.
6. Keep Ship pending while CI or expected bot reviews are incomplete. Use an available authorized wait or resumption mechanism and record the next action. Record `ready` only after current execution evidence and fresh per-PR checks/reviews pass at the recorded heads and bases. Report readiness for human review.
