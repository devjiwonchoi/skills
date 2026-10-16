# Auto state

Follow shared [task recording](../../utils/references/recording.md). Auto owns overall progress in `.jwn/<task>/STATUS.md` and adopts same-task standalone records with their actual decisions, approvals, and evidence.

1. Record the goal, owning chat, Auto caller, project root, actual branch when available, current stage, state, and next action. Reuse only records belonging to this task.
2. Track stages as Plan, Iterate, Ship, and Done. State whether work is running, awaiting a decision, blocked, or complete. Retain meaningful implementation, verification, review, delivery, and recovery outcomes in the work history.
3. Link the current `PLAN.md` version and its actual authorization. Preserve authorized versions and pending decisions. Before execution, require the current intention and candidate to be authorized and the effort's plan reviews to clear: low needs none, medium one, high three distinct reviewers. A pending or negative verdict remains unresolved.
4. Reference detailed verification in `VERIFY.md` and findings and coverage in `REVIEW.md` rather than duplicating them. Changed requirements or files reopen affected checks and review without erasing earlier evidence.
5. Before yielding or handing off, record unfinished work and the concrete next action. For an external wait, name the trigger and actual authorized resumption mechanism. Without one, explain how to resume instead of claiming automatic continuation.
6. Advance to Ship when Iterate completes. Mark Auto complete only after Ship establishes verified readiness for human review within the authorized delivery scope. Record remaining permissions or delivery gaps.

A stage label, reviewer consensus, or local check never supplies user authorization or hosted readiness. Report record-write failures before dependent work and follow [recovery](recovery.md) after interruptions or conflicts.
