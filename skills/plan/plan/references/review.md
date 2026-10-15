# Plan review

- Low: no independent reviewer.
- Medium: one independent reviewer.
- High: follow the [Advocate/Critic/Skeptic debate](debate.md).

After acceptance from existing instructions or user approval, give reviewers the current candidate and preview. Trace concrete inputs through normal, failure, and retry cases. Each finding names the input, failing code or rule, and consequence.

Group supported corrections into a revised plan and return to Plan to record its acceptance or obtain required approval before re-reviewing affected behavior. Bring blockers or unresolved design choices to the user immediately, without waiting for the whole review to finish. Reuse settled choices within existing authorization. Return changes to approved decisions to the user before execution.

Review the proposed code shape against repository conventions. Allow implementation refinements within the plan's adaptation boundaries. Return changes to specifically approved structure, conventions, or behavior to the user.

For implementation review, group supported findings into one correction pass, then review fixes and affected behavior. Separate blockers and bugs from optional nits. Optional nits do not restart the completion loop. Code-flow previews reduce design rework; they do not prove implementation correctness.
