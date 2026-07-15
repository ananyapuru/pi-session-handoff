# Pi Session Handoff

Global Pi extension that turns end-of-session context into deliberate, reviewable documentation work.

It does **not** modify docs, create branches, or open pull requests without user approval. When approved, it queues a Pi prompt that finds only durable, high-value, non-brittle learnings; presents candidates; then performs approved work and opens a PR.

## Install

```bash
mkdir -p ~/.pi/agent/extensions
curl -fsSL \
  https://raw.githubusercontent.com/ananyapuru/pi-session-handoff/main/session-handoff.ts \
  -o ~/.pi/agent/extensions/session-handoff.ts
```

Restart Pi or run `/reload`.

## Use

Manual, reliable path:

```text
/session-handoff
```

The extension asks before it queues a handoff. Pi then:

1. Finds only stable, non-obvious learnings likely to save a future engineer 30+ minutes.
2. Shows a table sorted by value, then brittleness. Every item includes target docs file and verified source evidence where available.
3. Waits for approval before editing docs or source comments.
4. Creates a branch and PR with thumbs-up/thumbs-down review instructions.
5. Uses review feedback to improve future suggestions.

## Lifecycle behavior

| Pi event | Behavior |
| --- | --- |
| `/new`, `/resume`, `/fork`, `/clone` | Asks to run a handoff. Choosing yes cancels the switch, queues the review, and lets user retry switch after it completes. |
| `/reload`, Ctrl-C, Ctrl-D, SIGHUP, SIGTERM | Asks whether to save a pending handoff. On next Pi startup in same project, asks whether to review it. |
| Crash or `kill -9` | Cannot run a hook or prompt. |

Pending handoffs are stored locally at `~/.pi/agent/session-handoffs/`. They contain project cwd and Pi session-file path, not a remote upload.

## Requirements

- Pi with extension lifecycle support (`session_before_switch`, `session_shutdown`, `session_start`)
- Git and GitHub CLI authentication only when approving an agent-created PR

## Security

Extensions execute with full local-user permissions. Review `session-handoff.ts` before installing. The extension only stores pending handoff metadata locally; it never installs shell aliases or background wrappers.

## Development

Test extension load:

```bash
pi -e ./session-handoff.ts --list-models
```

Then run Pi and use `/session-handoff` in a small test project.
