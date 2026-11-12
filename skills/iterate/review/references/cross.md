# Cross-model review

Use only when Review receives `--cross`.

1. Prepare `review_input` with only the context Review gives a reviewer. Copy user preferences, the factual summary, and check evidence stored elsewhere into it or `review_dir`, since the reviewer can read only the repository and `review_dir`. Point to the other sources and let the reviewer read them directly.
2. Request one read-only pass with findings and coverage as JSON, including priorities, locations, evidence, failure scenarios, and coverage gaps. Require diff access before review. Tell the reviewer not to edit, delegate, invoke `--cross`, or retry denied operations.
3. Run from the repository root with references on stdin and artifacts in an absolute `review_dir` outside the changeset. Set `review_input`, `review_output`, and `review_metadata` to absolute artifact paths. Set `review_effort` to `medium` for routine changes or `high` for complex contracts or validators.
   - In Codex, run Claude Code:
     ```sh
     claude -p --model claude-opus-5-5 --effort "$review_effort" --safe-mode \
       --permission-mode auto --permission-prompts none \
       --tools "Read,Glob,Grep,Bash" \
       --allowedTools "Read(/$PWD/**)" "Read(/$review_dir/**)" \
         "Glob" "Grep" "Bash(git diff *)" "Bash(git show *)" \
         "Bash(git log *)" "Bash(git status *)" \
       --no-session-persistence --output-format stream-json --verbose \
       < "$review_input" > "$review_output" 2> "$review_metadata"
     ```
     Verify assistant `message.model: claude-opus-5-5`. Inspect `permission_denied` events and final `permission_denials` for coverage gaps.
   - In Claude Code, run Codex:
     ```sh
     codex --no-daemon --ask-for-approval never exec --ignore-user-config --ignore-rules \
       --model gpt-6.1-sol --sandbox read-only --ephemeral --color never - \
       < "$review_input" > "$review_output" 2> "$review_metadata"
     ```
     Verify `model: gpt-6.1-sol`, `provider: openai`, `approval: never`, and `sandbox: read-only` in `review_metadata`.
4. Use the result only after successful completion, metadata verification, and confirmed access to the requested scope. If the other reviewer is unavailable, access is denied, or review is incomplete, return an incomplete review with gaps. Do not silently substitute models or another review mode.
5. Return the result and artifact paths to Review for reconciliation into `REVIEW.md`. Preserve raw provider output as evidence and reuse existing finding IDs. The caller owns Markdown recording and any corrections.
