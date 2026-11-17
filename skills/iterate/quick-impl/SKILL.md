---
name: quick-impl
description: Use when implementing development work.
---

## Rules

- Do not perform or delegate validation or verification. This includes type checks, lint, formatting checks, builds, tests, runtime checks, CI checks, and code reviews.
- Do not invoke validation, verification, or review skills from quick-impl.
- Follow the stop rule in the `iterate` skill.

## Steps

Follow the `execution-recording` skill for every invocation, including standalone use.

1. Read the todo spec you were given, the approved `ALIGN.md`, and any findings. Without a todo spec, proceed only when the user's request itself is the spec. An agent's outline is not approval. Otherwise follow the `align` skill.
   - Read `rules.md` and the `## Learned` rules in the preferences file per the `task-recording` skill. Follow them. A missing `rules.md` adds no rules.
2. Keep the approved end state fixed. Before and during implementation, compare cumulative changes with the approved `ALIGN.md`, or with the user's request when that request is the spec.
   - A different file or repository alone does not reopen settled decisions. Continue within existing authorization.
   - For a choice beyond the plan, follow the stop rule in the `iterate` skill and return the outcome to the caller.
3. Make the smallest coherent changes, reusing existing patterns and addressing supported findings within authorization.
4. Identify the resulting revision and reconcile review coverage. Return the implementation outcome, any stop-rule decisions, and unverified work to the caller. Stop here when invoked alone.
