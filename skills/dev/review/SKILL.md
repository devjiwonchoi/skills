---
name: review
description: Use when reviewing development changes.
---

## Steps

1. Read the request, agreed intent, constraints, actual changes, and available evidence.
2. Give that context to a fresh reviewer who did not implement the changes. Request correctness, regression, security, and maintainability findings with locations, evidence, and failure scenarios. If unavailable, disclose that limitation before reviewing yourself.
3. Validate findings. Apply focused fixes only when authorized, run affected checks, and obtain fresh review of the changed revision; otherwise report actionable fixes. Changes to approved intent or beyond agreed limits need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
4. Report the reviewed revision, supported findings, evidence gaps, and limitations. Keep incomplete review unresolved.
