# Plan recording

Follow shared [task recording](../../utils/references/recording.md). Plan owns `PLAN.md`, including standalone use.

1. Record the request, development targets, affected surfaces, task kinds, goal, constraints, and success criteria. Follow [decision collection](decisions.md) and maintain this ledger in `PLAN.md` for all 14 common areas and their concrete decision items.

   | Item | Status | Decision or proposal | Evidence or user answer |
   | --- | --- | --- | --- |
   | <area / concrete decision> | open | <unresolved question or proposal> | <available evidence or missing answer> |

   Use `open`, `user-confirmed`, `contract-determined`, or `not applicable`. Preserve actual questions and answers, directly determining contract sources and their reasoning, and user-approved exclusion reasons. For grouped approvals, identify the covered items. Keep proposals distinct from user decisions and leave blank or ambiguous answers open.
2. Maintain the current plan version with its preview, approach, work units, adaptation boundaries, verification methods, expected results, and baseline evidence or limitations. Preserve the delivery structure shown for approval: ordered commit messages, purposes, scopes and dependencies, plus each PR's commit mapping, grouping reason, repository, head/base branches, publishing order, title, description, draft status, opening checks, and Moniterate readiness conditions. Honor explicit delivery limits.
3. Record actual acceptance from existing instructions with its source and reason, or the user's actual approval of this version. Do not invent answers or treat reviewer agreement as user approval.
4. Preserve authorized versions, decision evidence, and their approval evidence before revising the candidate. Reopen affected ledger items and increment the plan version when its content changes. Retain previous answers and approvals with the version they covered. Do not carry acceptance or review verdicts to changed content without checking their scope.
5. Record effort and each reviewer's latest verdict against the current version. Approval alone does not clear required reviews. Pending questions, missing reviews, and unresolved objections remain visible on recovery.
6. Before compaction, save the authorized version, complete ledger and evidence, actual response, delivery permissions, pending reviews, and exact next action. Follow [compact and continue](continuation.md). After the post-compaction hook restores these documents, restore open items and prior decision evidence before continuing. Record that compaction completed for this approval. Do not compact again merely because the same plan is read or execution resumes.
7. Pass the task directory, authorized version, and decision evidence to Iterate only when no ledger item remains open, authorization covers the plan, compaction has completed for this approval, and required reviews clear. Continue through Ship and Moniterate within the approved delivery scope. Respect host mode.
