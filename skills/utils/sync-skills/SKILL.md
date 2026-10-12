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
4. Refresh Codex's registered `jwn` marketplace and reinstall `jwn@jwn` through the plugin commands.
   - Preserve pending checkout edits and confirm the refreshed source contains intended changes before replacing the installed plugin.
   - Remove standalone skill links belonging to this repository from `~/.agents/skills` and `~/.codex/skills` without recreating them.
   - Continue linking `skills/**/SKILL.md` folders by their unique frontmatter `name` into `~/.claude/skills` directly from the checkout.
   - Preserve displaced copies outside skill discovery paths and leave unrelated skills untouched.
5. Route intended local changes into a PR when requested or already authorized, using `$commit` and `$pr` in a separate worktree.
   - After a PR merges, confirm its edits are present upstream before clearing only those edits and resuming the pull.
   - Verify the plugin is enabled, its declared skills are installed, and the Claude links resolve correctly. Report updates, preserved edits, conflicts, and pending PRs.
