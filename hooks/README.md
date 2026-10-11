# User steering and Auto recovery

`hooks.json` configures a hook for every user prompt in Codex and Claude Code.
It asks the agent to identify feedback on its previous work from the conversation
and follow Remember when the user corrects, rejects, or expresses frustration with it.
Remember applies the correction and judges whether the feedback reveals a concrete
lesson useful in future tasks. It owns approval and storage.

After compaction, `SessionStart` with matcher `^compact$` supplies instructions to
check the current project/worktree root for `.jwn/` and read the installed Auto
skill's [recovery reference](../skills/auto/references/recovery.md) if it exists.
Non-Git recovery checks ancestors for the nearest `.jwn/`. The agent validates
ownership and restores the approved documents, state, and progress before
continuing authorized work. Without `.jwn/`, it does not initialize Auto state.

The plugin discovers [hooks.json](hooks.json) at its default location. For manual registration, merge its
handlers into `hooks.UserPromptSubmit` and `hooks.SessionStart` in
`~/.codex/hooks.json` and `~/.claude/settings.json`, preserving existing hooks and
other settings. Keep only one copy of each handler across registration methods.

The commands use only the shell's built-in `echo` and output plain context.
It needs no Python, Node.js, JSON parser, script file, or checkout-specific path.
The same command works in Bash, sh, PowerShell, and cmd. cmd may retain the outer
quotes, which are harmless in plain context. The static text contains no shell
expansions and never interpolates the user prompt.

Restart the harness to load the configuration. Review and trust the hooks in
Codex through `/hooks`. Remember and Auto must be available as installed skills or
in the personal skills checkout. These hooks do not call another model, read task
files, or save prompts. Their output instructs the agent to follow Remember or
recover Auto. Hook execution alone does not prove that the agent followed it.

Use `SessionStart` with source `compact` for recovery context. `PostCompact` stdout
does not inject that context into the model.

Protocol references: [Codex hooks](https://learn.chatgpt.com/docs/hooks#sessionstart)
and [Claude Code hooks](https://code.claude.com/docs/en/hooks#sessionstart).
