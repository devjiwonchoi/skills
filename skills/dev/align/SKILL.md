---
name: align
description: Use when agreeing on a development task's intent and scope.
---

## Rules

- Keep verified facts, user decisions, and assumptions distinct.
- Preserve the user's reasoning, conditions, and exceptions when summarizing.
- Keep user-fixed choices as constraints. Leave implementation choices open unless they affect the agreement.
- Treat approved alignments as immutable.

## Steps

1. **Ground the request.** Read the supplied context and existing alignment.
   - Check unverified facts needed for agreement against local implementation, tests, documents, or authoritative sources applicable to the project. Ground questions in the findings.
   - If new facts require changing an approved alignment, explain their impact and pause dependent work for the user's decision.
   - If an approved version still covers the request without unresolved conflicts, provide its location, version, and approval record and finish without renewed approval.
2. **Clarify the intent.** Establish the underlying problem, why it matters, and the desired observable outcome.
   - Ask only questions that could materially change the agreement, settling prerequisite decisions first.
   - Probe assumptions and boundaries with concrete scenarios, counterexamples, and tradeoffs.
   - Repeat research when answers expose consequential factual gaps. Stop when no consequential decision remains unresolved.
3. **Write the agreement.** Save the complete alignment as a versioned draft using the template below.
4. **Confirm and hand off.** Present the full draft for the user's explicit approval.
   - For changes, preserve the approved version and show the diff, reason, and impact on existing work.
   - Record the user's actual response and approved version. Wait for approval before continuing dependent work.
   - Provide the approved document's location and version as the basis for subsequent work. Recheck affected work after approved changes.

## Template

```markdown
# Alignment

Version: <revision>
Status: <draft or approved>
Approval: <actual user confirmation and confirmed version, or pending>

## Problem and why
<Current problem, supporting evidence, and why it matters.>

## Desired outcome
<What should change for the user.>

## Scope
- In: <What this task covers.>
- Out: <What this task excludes.>

## Constraints
<What must hold, including choices the user already fixed.>

## Success criteria
<Observable conditions that establish completion.>

## Decision boundaries
- Agent may decide: <Choices delegated to the agent.>
- Ask the user: <Choices requiring a human decision.>

## Assumptions and open decisions
<Unverified assumptions and unresolved decisions, or none.>
```
