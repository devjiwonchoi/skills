# Plan recording

Follow shared [task recording](../../utils/references/recording.md). Plan owns `PLAN.md`, including standalone use.

1. Record the request, goal, constraints, success criteria, questions and actual answers. Preserve the distinction between user decisions and proposed implementation.
2. Maintain the current plan version with its preview, approach, work units, adaptation boundaries, verification methods, expected results, and baseline evidence or limitations. Preserve the delivery structure shown for approval: ordered commit messages, purposes, scopes and dependencies, plus each PR's commit mapping, grouping reason, repository, head/base branches, publishing order, title, description, draft status, opening checks, and Moniterate readiness conditions. Honor explicit delivery limits.
3. Record actual acceptance from existing instructions with its source and reason, or the user's actual approval of this version. Do not invent answers or treat reviewer agreement as user approval.
4. Preserve authorized versions and their approval evidence before revising the candidate. Identify changed decisions and increment the plan version when its content changes. Do not carry acceptance or review verdicts to changed content without checking their scope.
5. Record effort and each reviewer's latest verdict against the current version. Approval alone does not clear required reviews. Pending questions, missing reviews, and unresolved objections remain visible on recovery.
6. Before compaction, save the authorized version and actual response, delivery permissions, pending reviews, and exact next action. Follow [compact and continue](continuation.md). After the post-compaction hook restores these documents, record that compaction completed for this approval. Do not compact again merely because the same plan is read or execution resumes.
7. Pass the task directory and authorized version to Iterate only when the current intention is settled, authorization covers the plan, compaction has completed for this approval, and required reviews clear. Continue through Ship and Moniterate within the approved delivery scope. Respect host mode.
