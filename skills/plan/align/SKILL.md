---
name: align
description: Always use when clarifying ambiguous requests or brainstorming.
---

## Rules

- Distinguish facts, user decisions, and assumptions. Preserve the user's reasons, conditions, exceptions, and fixed choices; leave implementation open unless it affects the agreement.

## Steps

1. **Ground.** Read the request and existing agreement. Verify consequential facts against code, tests, documents, or authoritative sources.
   - Reuse an unchanged, unconflicted approved agreement; return its file link, version, and approval record and finish.
2. **Clarify.** Resolve consequential uncertainty through focused questions, scenarios, counterexamples, and tradeoffs. Research factual gaps and settle prerequisite decisions first.
3. **Agree.** Save a versioned agreement to a task-local file such as `ALIGN.md` using the template.
   - When Auto supplies a task directory, use its agreement path and [state contract](../../auto/references/state.md) for document versions and approval events.
   - Briefly restate in your own words the problem the user wants to solve, their goals, and consequential scope or constraints. Link the agreement and request explicit approval of that version.
   - Preserve approved intent. Changes need a diff, reason, impact, and explicit approval before dependent work.
   - Record the user's response and approved version; revisit affected work after approved changes.

## Template

Write in the user's language.

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
