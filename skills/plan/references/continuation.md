# Compact and continue

Follow this after a plan version is accepted or approved, before its required reviews and execution.

1. Save the complete current version in `PLAN.md`, including intent, decisions, checks, delivery scope, and actual authorization. In `STATUS.md`, retain the owning task and caller, absolute task and plan paths, authorized version, pending reviews, and the exact next action after compaction. If the host prohibits these writes, retain the pending updates in conversation and wait until they can be saved before requesting compaction.
2. Mark compaction pending for this approval. Invoke the host's supported compaction action when available. If no compaction action is exposed, ask the user to run `/compact` and wait. Printing a command, requesting compaction, or summarizing the conversation does not establish completion.
3. After the post-compaction hook, read the owning task's `STATUS.md` and entire current `PLAN.md` before continuing. Confirm the version, actual authorization, pending decisions, and delivery permissions against retained session context. A plan file's existence alone is not approval.
4. Record that compaction completed for this approval and resume the saved next action. Continue pending plan reviews before Iterate, then approved Ship and Moniterate. Do not repeat completed reviews or recompact on ordinary recovery of the same approval.
5. If the plan changes, preserve the prior authorized version and resolve changed decisions before dependent work. A newly accepted or approved version receives its own compaction boundary. Missing or conflicting records remain unresolved. Respect host Plan Mode and do not start implementation while it is active.
