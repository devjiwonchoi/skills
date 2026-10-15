---
name: quick-impl
description: Use when implementing development work.
---

## Rules

- Do not perform or delegate validation or verification. This includes type checks, lint, formatting checks, builds, tests, runtime checks, CI checks, and code reviews.
- Do not invoke validation, verification, or review skills from quick-impl.

## Steps

Follow [execution recording](../execute/references/recording.md) for every invocation, including standalone use.

1. Read the authorized request, constraints, and available plans or findings. Without a plan, outline the approach; an agent's outline is not approval. Pause work awaiting required approval.
2. Keep approved intent fixed. Before and during implementation, compare cumulative changes with the last user-approved plan, or the original request and decisions.
   - A different file or repository alone does not reopen settled decisions. Continue investigation and bounded implementation within existing authorization.
   - Beyond agreed limits, investigate the affected path and present the cumulative diff or concrete proposal, reason, impact, and recommendation. Wait for a decision before dependent changes. Include material changes to approach or contracts, new external dependencies, or materially increased cost, effort, or risk.
3. Make the smallest coherent changes, reusing existing patterns and addressing supported findings within authorization.
4. Identify the resulting revision and reconcile review coverage. Return the implementation outcome and unverified work to the caller. Stop here when invoked alone.
