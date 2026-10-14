---
name: review
description: Use when reviewing development changes.
---

## Steps

1. Provide the current session deeplink, repository path, target revision, and diff base or file scope. Let the reviewer read the conversation and changes directly instead of preparing a separate context document.
2. Give these references to a fresh reviewer who did not implement the changes. Request correctness, regression, security, and maintainability findings with priorities, locations, evidence, and failure scenarios. Request review only, without edits or further reviewer delegation.
   - Use a new process from the repository root for each pass, with step 1's references on stdin. Retain artifacts under an absolute `review_dir` outside the changeset.
   - In Codex, run Claude Code:
     ```sh
     claude -p --model claude-opus-5-5 --safe-mode --add-dir "$review_dir" \
       --permission-mode dontAsk --permission-prompts none \
       --no-session-persistence --output-format stream-json --verbose \
       < "$review_input" > "$review_output"
     ```
     Check that `message.model` equals `claude-opus-5-5` in the assistant events.
   - In Claude Code, run Codex:
     ```sh
     codex --no-daemon --ask-for-approval never exec --ignore-user-config --ignore-rules \
       --model gpt-6.1-sol --sandbox read-only --ephemeral --color never - \
       < "$review_input" > "$review_output" 2> "$review_metadata"
     ```
     Check `model: gpt-6.1-sol`, `provider: openai`, `approval: never`, and `sandbox: read-only` in the CLI startup metadata (`review_metadata`).
   - If the reviewer cannot read the deeplink, report the limitation instead of assuming the context was received.
   - Before using findings, require successful completion and the route's model check. Otherwise report the limitation and keep the review incomplete. Do not substitute another model or self-review.
   - In other harnesses, disclose an unavailable independent reviewer before reviewing yourself.
3. Validate findings. Apply focused fixes only when authorized. Repeat fixes, affected checks, and fresh review until required criteria pass and the final revision has no unresolved, validated P0–P2 findings. Otherwise report actionable fixes. Changes to approved intent or beyond agreed limits need the cumulative diff from the last approved state, reason, impact, and a user decision before affected work.
4. Report the reviewed revision, supported findings, evidence gaps, and limitations. Keep incomplete review unresolved.
