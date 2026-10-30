# src

| Path | Holds |
| --- | --- |
| [`louvi/`](louvi/README.md) | the Claude Code plugin: `.claude-plugin/plugin.json`, `skills/`, `hooks/` |
| `tests/` | the guard tests (`npm test`) |

## Entry points
- **`louvi/hooks/hooks.json`:** Claude Code reads it and runs `louvi/hooks/guard.mjs`
  before each Edit, Write, MultiEdit, NotebookEdit and Bash call.
- **`louvi/hooks/guard.mjs`:** `main()` reads the hook's JSON, loads the repo's
  `local/louvi.json` over the defaults, and runs `checkEdit` or `checkBash`.
- **`louvi/skills/<name>/SKILL.md`:** Claude Code loads each skill when its
  description matches the task.
