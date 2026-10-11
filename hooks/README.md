# Hooks

`hooks.json` configures a hook for every user prompt in Codex and Claude Code.
It asks the agent to identify feedback on its previous work from the conversation
and follow Remember when the user corrects, rejects, or expresses frustration with it.
Remember applies the correction and judges whether the feedback reveals a concrete
lesson useful in future tasks. It owns approval and storage.

The plugin discovers [hooks.json](hooks.json) at its default location.
For manual registration, merge its handler
into `hooks.UserPromptSubmit` in `~/.codex/hooks.json` and `~/.claude/settings.json`,
preserving existing hooks and other settings. Keep only one copy across plugin
and manual registration.

The command uses only the shell's built-in `echo` and outputs plain context.
It needs no Python, Node.js, JSON parser, script file, or checkout-specific path.
The same command works in Bash, sh, PowerShell, and cmd. cmd may retain the outer
quotes, which are harmless in plain context. The static text contains no shell
expansions and never interpolates the user prompt.

Restart the harness to load the configuration. Review and trust the new hook in
Codex through `/hooks`. Remember must be available as an installed skill or in the
personal skills checkout.
It does not call another model or save prompts. Its output prompts the agent to
perform semantic classification and invoke Remember. Hook execution alone does not
prove that the agent followed it.

Protocol references: [Codex hooks](https://learn.chatgpt.com/docs/hooks#userpromptsubmit)
and [Claude Code hooks](https://code.claude.com/docs/en/hooks#userpromptsubmit).
