# Install

This repository is the `jwn` plugin and marketplace for Codex and Claude Code. It bundles the skills and a `UserPromptSubmit` hook that asks the agent to follow the remember skill after user corrections. The hook adds instructions; it does not write memories itself.

## Beta testing

The current version is `0.0.0`. Test this checkout locally before publishing it to a private Git repository for invited testers. Repository access and Git authentication are required for private installs.

Before a stable release, verify these flows in Codex and Claude Code:

- Install the plugin and confirm all 19 skills and the remember hook are available.
- Submit an ordinary prompt, then correct a previous answer. Confirm the hook supplies the reminder and the agent follows the bundled remember skill when appropriate.
- In Codex, confirm an untrusted hook is skipped and runs after trust approval. A changed hook must require review again.
- Disable and re-enable the plugin, then update and uninstall it. Confirm unrelated skills and hooks remain intact.

Run the same checks on macOS, Linux, and Windows before claiming support for those platforms. The reminder must not itself create or modify memory files.

## Claude Code

After these files are published to GitHub:

```sh
claude plugin marketplace add devjiwonchoi/skills
claude plugin install jwn@jwn
```

Start a new session and invoke a skill with its plugin namespace, for example `/jwn:remember`.

To test this checkout before publishing:

```sh
claude plugin validate .
claude --plugin-dir .
```

## Codex

After these files are published to GitHub:

```sh
codex plugin marketplace add devjiwonchoi/skills
codex plugin add jwn@jwn
```

On clients without `codex plugin add`, install jwn from the desktop app's Plugins Directory after adding the marketplace. Restart or open a new chat to load the plugin, and review and trust its remember hook before expecting it to run.

To test this checkout before publishing, use its absolute path instead of `devjiwonchoi/skills` when adding the marketplace.

## Existing installations

If the same skills are already installed through skills.sh or manual links, remove those copies through their original installation method to avoid duplicate skills. If the remember reminder is already registered in user hooks, remove that reminder after verifying the plugin hook works. Keep unrelated hooks and skills.

## Updates

```sh
claude plugin marketplace update jwn
claude plugin update jwn@jwn
codex plugin marketplace upgrade jwn
```

Increase the version in both plugin manifests when publishing a release. No npm package or separate hook runtime is required by this plugin. The hook uses the host shell's `echo` command; individual skills may require their own tools.

See the [Claude plugin documentation](https://code.claude.com/docs/en/plugins) and [Codex plugin documentation](https://developers.openai.com/plugins/build/plugins) for client support and hook trust behavior.
