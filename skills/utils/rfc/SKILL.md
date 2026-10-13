---
name: rfc
description: Use when drafting or revising technical RFCs and proposals.
---

Explain a proposed change so reviewers can assess its motivation, behavior, costs, and unresolved choices.
Preserve the user's proposal, facts, and level of certainty.

## Build the argument

Choose the moves supported by the material and order them around the specific argument.
Leave a move out when it requires unsupported premises.

1. Open with the concrete current behavior or proposed capability.
   - For a new API, show a small usage example early.
2. Explain the current behavior through a real use case.
   - Show where the existing approach works before identifying the case it cannot express.
   - Trace the failure through the actual mechanism instead of calling the design confusing or inefficient.
3. Introduce the change as a consequence of that limitation.
   - Relate unfamiliar concepts to a familiar API or mental model.
   - Separate concepts that have different responsibilities or lifetimes even when their surface behavior looks similar.
   - State the invariant that constrains the design and explain why it matters.
4. Develop examples from the ordinary case to the case that motivates the extra capability.
   - Keep examples focused on the behavior under discussion.
   - Explain when work happens, what the user sees, and how state or data changes.
   - Distinguish a semantic guarantee from an optimization and explain the fallback when the optimization is unavailable.
5. Address the strongest plausible alternative.
   - Explain its appeal, then identify the specific behavior, constraint, or cost that makes it insufficient.
   - Admit weaknesses in the proposed design with the same precision.
6. Distinguish the initial proposal from extensions and unresolved choices.
   - Describe migration or adoption when it affects the reader's decision.
   - Give an open question enough context to support an answer.

## Write the prose

- Use direct language appropriate to the audience.
- Connect premises, causes, and consequences explicitly.
- Use short declarative sentences for key conclusions and longer sentences when the reasoning needs them.
- Explain one distinction at a time with concrete nouns, API names, and observable behavior.
- Put a caveat next to the claim it qualifies.
- Qualify the specific assumption or design choice that remains uncertain.
- Prefer precise constraints and concrete tradeoffs to enthusiastic adjectives.
- Use descriptive headings that follow the argument.
- Use code for semantics, bullets for parallel cases, and emphasis for a decisive constraint.

## Match the document

- For a formal RFC, keep the required repository sections.
- For an informal proposal, use only the sections needed to explain and assess the change.
- For a brief proposal or RFC announcement, compress the argument to the claim, a motivating example, the reason, and the unresolved point.
- For an RFC discussion, address the exact objection and clarify the condition that changes the conclusion.
  - When a correction changes the premise, acknowledge it and update the resulting recommendation.

## Revision

Replace broad claims with their concrete mechanism.
Remove repeated explanations, ceremonial introductions, and sections that add no decision-relevant information.
Keep missing evidence and undecided semantics visible rather than inventing benchmarks, behavior, consensus, or rollout commitments.
