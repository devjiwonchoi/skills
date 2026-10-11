---
name: align
description: Use when agreeing on a development task's intent and scope.
---

## Rules

- Distinguish facts, user decisions, and assumptions. Preserve the user's reasons, conditions, exceptions, and fixed choices; leave implementation open unless it affects the agreement.

## Steps

1. **Ground.** Read the request and existing agreement. Verify consequential facts against code, tests, documents, or authoritative sources.
   - Reuse an unchanged, unconflicted approved agreement; return its version and approval record and finish.
2. **Clarify.** Resolve consequential uncertainty through focused questions, scenarios, counterexamples, and tradeoffs. Research factual gaps and settle prerequisite decisions first.
3. **Agree.** Write a versioned agreement using the template and present it in full for explicit approval.
   - Preserve approved intent. Changes need a diff, reason, impact, and explicit approval before dependent work.
   - Record the user's response and approved version; revisit affected work after approved changes.

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
