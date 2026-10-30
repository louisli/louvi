# The Louvi plugin

A Claude Code plugin with Louvi's skeleton: three skills and a set of guards.

## Install

```
/plugin marketplace add louisli/louvi
/plugin install louvi@louvi
```

For a single session without installing: `claude --plugin-dir <path to src/louvi>`.

## Skills

| Skill | Use it when |
| --- | --- |
| `patterns` | designing anything new: a config, a role, a queue, a repo |
| `repo-layout` | creating, moving or placing files; starting a repo |
| `ticket-first` | starting any change |

## Guards

They're `PreToolUse` hooks (`hooks/hooks.json`, `hooks/guard.mjs`, which needs
Node 22 or later and nothing else). Each repo sets them in `local/louvi.json`:

```json
{
  "guards": {
    "protect-branch": { "on": true, "branches": ["main", "master"] },
    "one-git-command": { "on": false },
    "commit-message": { "on": false, "forbid": [] }
  }
}
```

| Guard | Blocks | Default |
| --- | --- | --- |
| `protect-branch` | Edit, Write, MultiEdit and NotebookEdit on a protected branch | on, for `main` and `master` |
| `one-git-command` | a Bash call that chains a git command (`&&`, `\|\|`, `;`, `\|`, `&`, a new line) or starts with `cd` | off |
| `commit-message` | `git commit` whose message matches a `forbid` pattern (a regular expression, matched without regard to case) | off |

A blocked call gets a reason starting `louvi:`. If a guard can't run (a broken
config, no git), it lets the call through: a guard should never be what stops
work.
