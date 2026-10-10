---
name: sync-skills
description: Use when syncing personal skills.
---

## Steps

1. Resolve this skill's `SKILL.md` path through symlinks to find its Git checkout, and verify its remote is `devjiwonchoi/skills`, regardless of the current working directory.
   - If the resolved skill is outside that checkout, ask which checkout to use or where to clone it before continuing.
2. Reconcile intended local edits from existing installations into the checkout, including scripts and supporting files; preserve both versions and ask when differences are ambiguous.
3. Run `git -C <checkout> pull --ff-only` only when the checkout is clean and on its default branch; otherwise preserve pending work and skip the pull.
4. Discover `skills/**/SKILL.md` and link each folder directly from the checkout by its unique frontmatter `name` into `~/.agents/skills`, `~/.codex/skills`, and `~/.claude/skills`.
   - Preserve displaced copies outside skill discovery paths, leave unrelated skills untouched, and remove only obsolete symlinks belonging to this repository.
5. Route intended local changes into a PR when requested or already authorized, using `$commit` and `$pr` in a separate worktree.
   - After a PR merges, confirm its edits are present upstream before clearing only those edits and resuming the pull.
   - Verify the links resolve correctly and report updates, preserved edits, conflicts, and pending PRs.
