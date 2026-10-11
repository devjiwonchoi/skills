---
name: debug
description: Use when finding a bug's root cause before changing code.
---

## Steps

1. Summarize the bug and known facts.
2. List 3 to 10 distinct possible causes as numbered items in likely order, choosing the count based on ambiguity and scope.
   - For each cause, explain how to check it and which results would support or rule it out.
3. Ask the user to approve all items or specific numbers before running checks.
4. Check only approved items with read-only checks by default.
   - Report findings after each check.
   - Stop when evidence points to one root cause.
   - Otherwise, state what remains unknown and propose the smallest next check.
   - Ask again before changing files, settings, or data.
