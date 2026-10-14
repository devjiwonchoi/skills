---
name: review
description: Use when reviewing development changes.
---

## Steps

1. Prepare the request, agreed intent, constraints, repository instructions, target revision, raw diff, and verification evidence.
2. Give this context to a fresh reviewer who did not implement the changes. Request correctness, regression, security, and maintainability findings with priorities, locations, evidence, and failure scenarios. Ask for review only, without file changes or further reviewer delegation.
   - Run each pass in a new process from the repository root. Pass step 1's context through stdin. Use absolute review artifact paths outside the changeset and retain them as evidence.
   - In Codex, run Claude Code:
     ```sh
     claude -p --model claude-opus-5-5 --safe-mode \
       --tools Read,Glob,Grep --permission-mode dontAsk --permission-prompts none \
       --no-session-persistence --output-format stream-json --verbose \
       < "$review_input" > "$review_output"
     ```
     Check that `message.model` equals `claude-opus-5-5` in the assistant events.
   - In Claude Code, run Codex:
     ```sh
     codex --no-daemon --ask-for-approval never exec --ignore-user-config \
       --model gpt-6.1-sol --sandbox read-only --ephemeral --color never - \
       < "$review_input" > "$review_output" 2> "$review_metadata"
     ```
     Check `model: gpt-6.1-sol`, `provider: openai`, `approval: never`, and `sandbox: read-only` in the CLI startup metadata (`review_metadata`).
   - Before using findings, require successful completion and the route's model check. Otherwise report the limitation and keep the review incomplete. Do not substitute another model or self-review.
   - In other harnesses, disclose an unavailable independent reviewer before reviewing yourself.
3. Validate findings. Apply focused fixes only when authorized. Repeat fixes, affected checks, and fresh review until required criteria pass and the final revision has no unresolved, validated P0–P2 findings. Otherwise report actionable fixes. Changes to approved intent or beyond agreed limits need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
4. Report the reviewed revision, supported findings, evidence gaps, and limitations. Keep incomplete review unresolved.
