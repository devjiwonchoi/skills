---
name: moniterate
description: Use when asked to monitor and iterate on a pull request.
---

## Steps

1. Check CI and review comments on the latest PR head.
2. If a human leaves review comments or a blocker needs human input, report it to the user and pause the loop.
3. Rerun failed CI checks that appear flaky and inspect each retry.
4. Autonomously fix failures introduced by our changes and valid bot findings, then verify, commit, and push.
5. Recheck CI and bot comments on the latest PR head after reruns or pushes.
6. Repeat every five minutes until CI is green and bot reviews have finished with no unaddressed comments, then report readiness for human review.
