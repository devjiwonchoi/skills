# CLI structure

- Put each command in its own folder. Keep only the CLI entrypoint, build script, configuration, and generated bundle at the root.
- Use `index.ts` as the command's entrypoint. Put event shapes, parsing, and inferred types in `schema.ts`; put history validation and allowed transitions in `validate.ts`. Split state calculations into `state.ts` only when they need a separate file.
- Keep feature-specific integrations with their feature, such as `ship/github.ts`. Keep approval, verification, review, and delivery policies with their owning feature. The `impl` command also owns verification records.
- Put existing reusable recording and file-fingerprint operations in `shared/`. Shared modules must not import feature modules or decide stage readiness. Do not introduce a generic schema or workflow framework to enforce this layout.
- Colocate tests with the code they cover. Preserve command interfaces and journal formats during structural changes.
