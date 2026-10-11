# Otto adapter for Remember

Use this adapter only after Otto has verified `READY`. Compose the independent
[Remember core](../SKILL.md) with the completed task artifacts and conversation.
Follow Otto's shared [artifact contract](https://github.com/devjiwonchoi/otto/blob/bd0ea60f65b5dba53ca8e0909576624148df729f/skills/workflow-artifacts.md).

1. Ask Remember to invoke Distill for durable candidates from the completed run
   and discover the active harness's supported destinations.
2. Preserve Remember's human batch-approval gate. Otto automation does not
   authorize memory or instruction writes.
3. After approved writes are read back successfully, record and return
   `REMEMBERED` with their destinations in `RUN.md`. When no candidate survives,
   record and return `NOTHING_TO_REMEMBER`. When the user completes the batch
   decision without approving a write, record and return `REMEMBER_SKIPPED`.
4. Return `NEEDS_HUMAN` with the smallest action when approval, a safe
   destination, or write verification is missing.
