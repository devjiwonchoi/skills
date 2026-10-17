# Automatic continuation

This runtime restores authorized work in the owning session. It does not create approval or expand standalone scope.

1. Save actual authority, pending decisions/reviews and the next action in the task's Markdown records. In `STATUS.md` use:

   ```markdown
   ## Continuation
   - State: ready
   - Next action: <concrete authorized action>
   ```

   Use `waiting`, `blocked` or `complete` when no authorized action can run. Automated input is not a new human instruction.
2. In Codex Desktop, bind with `node "<plugin-root>/hooks/continuation.mjs" bind --task "<absolute .jwn/task>" --host desktop`. It uses `CODEX_THREAD_ID`; supply `--chat` only with this session's verified ID. Never select another session or a task by recency.
3. Save the accepted Plan, approval evidence, ready next action and pending compaction. Run `node "<plugin-root>/hooks/continuation.mjs" compact --task "<task>" --approval "<unique accepted version>"`. A detached worker waits for matching PostCompact, completed compact item/turn and idle, then sends one restoration prompt in this session. A new human prompt cancels pending compaction. Do not retry uncertain delivery with a different ID.
4. Read STATUS and the entire PLAN on recovery. Record actual completion and inspect `.jwn/.runtime/<chat>.json` and adjacent logs. Continue pending reviews before approved implementation and delivery. Keep the next action current before every turn ends: Stop resumes ready work and suppresses unchanged duplicate actions, pending compact, terminal or unbound tasks.

Codex requires Node 22+ on PATH, no npm install or build. Install/reload the plugin and trust its current hooks through the host. `.codex-plugin/plugin.json` selects `hooks/codex-hooks.json`; the default file is separate for Claude. Existing installed Python/Go workers must finish or be stopped before switching to Node: their locks do not interoperate. Do not install over a running worker.

Node stores atomic JSON under a serialized `.node-lock` directory. A crash can leave that directory behind. Inspect `owner.json`, ensure the recorded process and any worker are stopped, then remove only that binding's lock manually. Never delete a live or ambiguous lock. A retained lock reports an error rather than stealing ownership or duplicating compaction.

Desktop uses internal owner/follower IPC, version dependent: `$CODEX_HOME/ipc/ipc.sock` (default `~/.codex`) or Windows `\\.\pipe\codex-ipc`. Unit and CI tests do not establish actual Desktop integration on every OS. Installed hook trust and runtime evidence must be checked separately from source tests.

## Codex CLI

Bind with `node "<plugin-root>/hooks/continuation.mjs" bind --task "<absolute .jwn/task>" --host cli` in the current local CLI session. It requires `codex` on PATH and uses only `codex app-server proxy` to join the default local shared daemon. No endpoint or token configuration is needed. Rebind old remote tasks explicitly before using them locally.

The worker first queries `thread/loaded/list` on that daemon. Only an already-loaded current thread may be resumed to subscribe. It never loads an old transcript or searches other servers. Remote connections, custom sockets and embedded/`--no-daemon` sessions are unsupported; a missing current thread fails explicitly. Compact completion requires same-thread item/completed, matching completed turn and idle; an empty RPC response is not completion.

The Codex control protocol is version dependent. Local fixtures do not prove a real TUI stayed attached through compact; that remains a live acceptance check.
