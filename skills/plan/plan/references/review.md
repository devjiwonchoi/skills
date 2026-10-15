# Plan review

- Low: no independent reviewer.
- Medium: one independent reviewer.
- High: follow the [Advocate/Critic/Skeptic debate](debate.md).

Before final acceptance or user approval, give reviewers the current candidate, preview, verification methods, baseline evidence, adaptation boundaries and delivery permissions. Trace concrete inputs through normal, failure, and retry cases. Check that the proposed checks can establish the success criteria and that an observed baseline failure has the expected cause. Each finding names the input, failing code or rule, and consequence.

Check that the traced entrypoints and callers match the affected execution paths. A passing check on one path does not establish another path's behavior.

Group supported corrections into a revised candidate and re-review affected behavior before presenting it for final authorization. Bring consequential unresolved decisions to the user. Reuse settled choices within existing authorization. Return changes to approved decisions to the user before execution.

Review the proposed code shape against repository conventions. Allow implementation refinements within the plan's adaptation boundaries. Return changes to specifically approved structure, conventions, or behavior to the user.

For implementation review, group supported findings into one correction pass, then review fixes and affected behavior. Separate blockers and bugs from optional nits. Optional nits do not restart the completion loop. Code-flow previews reduce design rework; they do not prove implementation correctness.
