# Plan review

- Low: no independent reviewer.
- Medium: one independent reviewer.
- High: follow the [Advocate/Critic/Skeptic debate](debate.md).

After user approval, give reviewers the approved candidate and preview. Trace concrete inputs through normal, failure, and retry cases. Each finding names the input, failing code or rule, and consequence.

Group supported corrections into a revised plan. Use Explain to obtain user approval before re-reviewing affected behavior. Bring blockers or unresolved design choices to the user immediately, without waiting for the whole review to finish. If resolution changes the plan, use Explain to show the change and obtain approval of the new version before execution.

Review the proposed code shape against repository conventions. Allow implementation refinements within the plan's adaptation boundaries. Return changes to specifically approved structure, conventions, or behavior to the user.

For implementation review, group supported findings into one correction pass, then review fixes and affected behavior. Separate blockers and bugs from optional nits. Optional nits do not restart the completion loop. Code-flow previews reduce design rework; they do not prove implementation correctness.
