---
name: align
description: Use when agreeing on a development task's intent and scope.
---

## Rules

- Use `.jiwon/tasks/<task-id>/` at the worktree root, or project root otherwise. Reuse the same task's ID and read any `status.md`.
- Update it at transitions, approvals, evidence changes, pauses, or completion with stage/state, current versions, applicable approved baselines and confirmations, working/verified revisions and evidence, pending decisions, and next action.
- Preserve approved versions and append consequential decisions; status is not approval. Create only needed documents, link existing artifacts, and keep records local unless sharing is authorized. Mark done only when requested work is complete.
- Distinguish verified facts, user decisions, and assumptions. Preserve the user's reasons, conditions, exceptions, and fixed choices; leave implementation open unless it affects the agreement.

## Steps

1. **Ground.** Read the request and existing agreement. Verify consequential facts against local code, tests, documents, or authoritative sources.
   - Reuse an unchanged approved agreement without unresolved conflicts; provide its location, version, and approval record and finish without renewed approval.
2. **Clarify.** Resolve consequential uncertainty through focused questions, concrete scenarios, counterexamples, and tradeoffs. Research new factual gaps and settle prerequisite decisions first.
3. **Agree.** Save a versioned draft using the template and present it in full for explicit approval.
   - Preserve approved agreements. For changes, show the diff, reason, and impact and wait for approval before dependent work.
   - Record the actual response and approved version, provide its location, and recheck affected work after approved changes.

## Template

```markdown
# Alignment

Version: <version>
Status: <draft or approved>
Approval: <actual confirmation and approved version, or pending>

## Problem and why
<Problem, evidence, and why it matters.>

## Desired outcome
<Observable outcome.>

## Scope
- In: <Included work.>
- Out: <Excluded work.>

## Constraints
<Requirements and user-fixed choices.>

## Success criteria
<Observable completion conditions.>

## Decision boundaries
- Agent may decide: <Delegated choices.>
- Ask the user: <Reserved decisions.>

## Assumptions and open decisions
<Unverified assumptions and unresolved decisions, or none.>
```
