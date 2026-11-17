---
name: ship
description: Use when delivering development changes.
---

## Steps

1. Check the requested delivery, agreed intent, final diff, and available evidence. Checks and review must be current before dependent delivery. Reuse Iterate's verification and review evidence when it remains valid for the current revision, scope, and dependency context. Follow the `verify` and `review` skills only for missing or invalidated evidence.
   - Hand supported correction work back to the calling `iterate` skill within existing authorization. When invoked standalone, follow Iterate as its delivery owner.
2. Follow the `commit` and `pr` skills to reconcile the commit and PR structure in the approved `ALIGN.md` delivery todos with the final diff, or establish it when no structure was approved. Refine reviewer-facing messages, titles, and descriptions from the final behavior. For a change to that structure, follow the stop rule in the `iterate` skill.
3. Before delivery, use the `explain` skill to show final behavior and diff, evidence for each end state item, commit boundaries and messages, their PR grouping and dependencies, titles and descriptions, and remaining risks or gaps. Link the diff and evidence. When `ALIGN.md` authorizes the delivery, show this and continue without asking.
   - Compare the result with the approved contract, or with the agreed request when there is none. The contract is `ALIGN.approved.md`, or the default branch copy when that file is missing or the checked change edits it. Never read it from the working change. Lead with a one-line verdict, then show each end state item with its evidence, failures first. Name where the actual flow and files differ from the contract, and whether any Don't was broken.
   - Do not redraw the E2E workflow diagram. Cite node ids from the contract.
   - Treat a departure from the end state that Iterate did not re-align as a failure, including a Verify flag that the end state, the E2E workflow diagram, or the criteria differ from the contract, and a `changed proof` flag without the user's explicit OK. Report it and hand it back to Iterate instead of delivering it.
4. Honor existing permissions for commit, push, PR creation, merge, and deploy separately. Reuse the approved `ALIGN.md` authorization for the commits, branch pushes, PRs, and Moniterate its delivery todos state without asking again. For anything beyond that authorization, follow the stop rule in the `iterate` skill.
5. After preparing delivery, reconcile the final revision with the checked evidence. Recheck and review only changed or affected behavior. Repeat the explanation if the presented result changes.
6. After publishing a PR, follow the `moniterate` skill within the existing scope and authorization. Obtain its readiness report before reporting the final result.
7. Once the change is on the default branch, re-run each journey from the contract once and append that run's paths to `VERIFY.md`. Do not merge to produce that run. Until then, report the re-run as not done.
   - End with a final report. List each end state item and each E2E workflow node id as pass, fail, or unresolved, with the artifact paths `VERIFY.md` records: the failing run, the passing run, the before and after screenshots, and the Playwright trace. Name a drift flag when the end state, the E2E workflow diagram, or the criteria differ from the contract. Name each `changed proof` flag and whether the user explicitly OK'd it. Include two-way door decisions recorded in `STATUS.md`.
   - For published PRs, request the reviewers `ALIGN.md` names without asking. Otherwise recommend reviewers from repository guidance, ownership, and review history. Explain why and finish by asking whether to request review. Send only after user approval. If none are supported, explain the gap and ask the user to name one.
   - When Iterate invoked Ship, return this question to Iterate instead of asking it, so Remember runs first.
