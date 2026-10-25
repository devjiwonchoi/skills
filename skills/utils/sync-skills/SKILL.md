---
name: sync-skills
description: Use when syncing personal skills.
---

## Steps

1. Resolve this skill's `SKILL.md` path through symlinks to find its Git checkout, and verify its remote is `devjiwonchoi/skills`, regardless of the current working directory.
   - When invoked from the plugin cache, locate an existing checkout or registered marketplace source with that remote.
   - If no matching checkout exists, ask which checkout to use or where to clone it before continuing.
2. Reconcile intended local edits from existing installations into the checkout, including scripts and supporting files; preserve both versions and ask when differences are ambiguous.
3. Run `git -C <checkout> pull --ff-only` only when the checkout is clean and on its default branch; otherwise preserve pending work and skip the pull.
4. Refresh the registered `jwn` marketplace in Claude and Codex and update `jwn@jwn` through each host's plugin commands.
   - Preserve pending checkout edits and confirm the refreshed source contains intended changes before replacing the installed plugin.
   - The plugin version stays fixed, so confirm each installed copy matches the refreshed source. Reinstall when a host keeps the old copy.
   - Inspect `~/.codex/hooks.json` and `~/.claude/settings.json` for legacy `jwn` handlers. Back up each file before removing only those handlers.
   - Preserve unrelated hooks, custom behavior not covered by the plugin, and other settings.
   - Remove standalone skill links belonging to this repository from `~/.agents/skills`, `~/.codex/skills`, and `~/.claude/skills` without recreating them.
   - Preserve displaced copies outside skill discovery paths and leave unrelated skills untouched.
5. Route intended local changes into a PR when requested or already authorized, using `$commit` and `$pr` in a separate worktree.
   - After a PR merges, confirm its edits are present upstream before clearing only those edits and resuming the pull.
   - Verify the plugin is enabled in each host and its installed skills and hooks match the checkout. Report updates, preserved edits, conflicts, and pending PRs.
