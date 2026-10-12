---
name: align
description: Always use when clarifying ambiguous requests or brainstorming.
---

## Rules

- Distinguish facts, user decisions, and assumptions. Preserve the user's reasons, conditions, exceptions, and fixed choices; leave implementation open unless it affects the agreement.

## Steps

1. **Ground.** Read the request and existing agreement. Before questioning, [research](../../utils/research/SKILL.md) likely answers in the codebase for brownfield work or current authoritative sources otherwise.
   - Check that each question's premise, options, and recommendation fit the actual versions, constraints, and applicable best practices.
   - Reuse an unchanged, unconflicted approved agreement; return its file link, version, and approval record, then continue to step 4.
2. **Clarify.** Ask 3–10 non-redundant questions about consequential decisions left to the user after research. Choose the count by decision impact and task complexity. Settle prerequisite decisions first.
   - Explain each option's meaning, candidacy, benefits, and tradeoffs without assuming prior knowledge. Ground the recommendation's rationale in research findings.
   - For question tools, explain in chat first. Keep cards to short questions and option labels.
3. **Agree.** Save a versioned agreement to a task-local file such as `ALIGN.md` using the template.
   - When Auto supplies a task directory, use its agreement path and [state contract](../../auto/references/state.md) for document versions and approval events.
   - Before requesting approval, use [explain](../../utils/explain/SKILL.md) to summarize in chat the problem and why it matters, desired outcome, included and excluded scope, consequential constraints, success criteria, and decisions reserved for the user. Make the explanation sufficient to decide without reading the agreement. Then link the agreement and request explicit approval of that version.
   - Preserve approved intent. Changes need a diff, reason, impact, and explicit approval before dependent work.
   - Record the user's response and approved version; revisit affected work after approved changes.
4. **Continue.** For standalone work, offer [Auto](../../auto/SKILL.md) after approval. If requested at any stage, hand off task documents and approval records.

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
