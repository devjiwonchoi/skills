---
name: review
description: Use when reviewing development changes.
---

## Steps

1. Provide the repository, target revision, diff base or scope, session deeplink, and resolved absolute `session_log` path. Let the reviewer read these sources directly.
   - Review stacks together with each PR's base/head and findings attributed to its PR.
   - Run checks as the caller and provide their revision and output paths. Request additional checks only for missing evidence.
2. Launch a fresh reviewer who did not implement the changes. Request correctness, regression, security, and maintainability findings as JSON with priorities, locations, evidence, failure scenarios, and coverage gaps. No edits or delegation.
   - Run from the repository root with references on stdin and artifacts in an absolute `review_dir` outside the changeset.
   - Set `review_effort`: `medium` for routine changes, `high` for complex contracts or validators.
   - Check diff and transcript access first. Stop on missing access and report the review incomplete. Do not retry denied operations.
   - In Codex, run Claude Code:
     ```sh
     claude -p --model claude-opus-5-5 --effort "$review_effort" --safe-mode \
       --permission-mode auto --permission-prompts none \
       --tools "Read,Glob,Grep,Bash" \
       --allowedTools "Read(/$PWD/**)" "Read(/$session_log)" "Read(/$review_dir/**)" \
         "Glob" "Grep" "Bash(git diff *)" "Bash(git show *)" \
         "Bash(git log *)" "Bash(git status *)" \
       --no-session-persistence --output-format stream-json --verbose \
       < "$review_input" > "$review_output"
     ```
     Verify assistant `message.model: claude-opus-5-5`. Inspect `permission_denied` events and final `permission_denials` for coverage gaps.
   - In Claude Code, run Codex:
     ```sh
     codex --no-daemon --ask-for-approval never exec --ignore-user-config --ignore-rules \
       --model gpt-6.1-sol --sandbox read-only --ephemeral --color never - \
       < "$review_input" > "$review_output" 2> "$review_metadata"
     ```
     Verify `model: gpt-6.1-sol`, `provider: openai`, `approval: never`, and `sandbox: read-only` in `review_metadata`.
   - Use findings only after successful completion and metadata verification. Otherwise report an incomplete review. Do not substitute models or self-review.
   - In other harnesses, disclose unavailable independent review before self-review.
3. Validate findings and fix only when authorized. Repeat affected checks and fresh review of changed and affected behavior until required criteria pass with no validated P0–P2 findings unresolved. Otherwise report actionable fixes. Changes beyond approved intent or limits require user approval of the cumulative diff, reason, and impact before affected work.
4. Report the reviewed revision, validated findings, and coverage gaps. Keep incomplete review unresolved.
