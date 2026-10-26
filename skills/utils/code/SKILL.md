---
name: code
description: Always use when writing or modifying code.
---

## Rules

- Reuse existing code, types, and sources of truth.
- Add abstractions, types, or state only when required behavior, meaningful reuse, or clarity justifies them.
- Keep simple logic inline instead of extracting trivial helper functions.
- Prefer type inference over redundant annotations or assertions.
- In JavaScript and TypeScript, prefer a single destructured object parameter over multiple positional parameters, such as `({ a, b, c })` instead of `(a, b, c)`.
- Prefer `type` over `interface` unless the codebase convention favors `interface`.
- Prefer adding new props and type entries near the end of existing lists unless local context requires a different order.
- Name values and conditions after their purpose.
- Use block bodies for control flow, even for a single statement.
- Prefer explicit `if` checks with `throw` over `assert` for runtime validation.
- Avoid default values in function parameters.
- Place comments above cohesive code groups to explain what they do and why.
- Separate independent checks and logical phases with blank lines. Keep a declaration with its immediate validation, and separate the final return from preceding work.
- Preserve existing comments unless there is a concrete reason to change or remove them.
- Follow the repository's formatting and organization without unrelated style rewrites.
- Prefer colocating unit tests with the tested source, such as `x.test.ts` next to `x.ts`, following repository conventions.
- Prefer inline snapshots, fixtures, and similar test data over new files unless separate files improve behavior, readability, or reuse.
- Avoid Jest `.not` assertions. Prefer equivalent positive matchers, such as asserting that a regex match is null.
- In TypeScript, prefer explicit `T | undefined` over optional `?:`.
- Prefer `null` when explicitly assigning an absent value.
- Preserve existing contracts and meaningful differences between absent values when applying style preferences.
- Propagate failures or handle them explicitly without hiding them.
- Catch errors for recovery, added context, or cleanup. Propagate failures the handler cannot recover from.
- Keep resource cleanup with its owner and cover both success and failure.
