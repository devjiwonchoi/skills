# Recover task work

Read this after context loss. Resolve links from the installed skill's real directory.

1. Locate the retained task directory using shared [task recording](../../utils/references/recording.md). For non-Git projects, inspect the known project directory or its ancestors for the retained task. Without task records, continue from session context without creating records or starting Auto. Never choose a task by recency.
2. Read `STATUS.md` and confirm the recorded goal, owner, caller, and current request. Preserve unrelated files. If only unsupported legacy records exist, report unavailable recovery context and do not parse or convert them.
3. Read `PLAN.md` when present and restore its current version, actual decisions and authorization, pending questions, and reviewer verdicts. A standalone Review or Verify need not have a plan. If the recorded workflow requires a missing plan, report the gap before dependent work. Recover an approved plan still awaiting required reviews as pending review. Do not infer approval from a stage label or an older plan version.
4. For implementation, verification, or review, follow [execution recovery](../../iterate/iterate/references/recording.md#recovery-and-completion). Inspect current files, retained findings, coverage, and evidence before resuming or reusing completion.
5. Restore the owning workflow at its first unfinished stage. Recovery of standalone Review, Verify, or Quick-impl does not start Auto or Iterate. Plan may continue to Iterate only after its recorded authorization and required reviews clear. Preserve pending user decisions and delivery permissions.
6. Record recovered state, remaining work, and next action in `STATUS.md`, then resume authorized work. If records conflict with actual files or session context, explain the gap before dependent work. Without write permission, retain recovery updates in conversation until writes are allowed.
