# src

| Path | Holds |
| --- | --- |
| [`louvi/`](louvi/README.md) | the Claude Code plugin: `.claude-plugin/plugin.json`, `skills/`, `hooks/` |
| `tests/` | the guard tests (`python3 -m unittest discover -s src/tests`) |

## Entry points
- **`louvi/hooks/hooks.json`:** Claude Code reads it and runs `louvi/hooks/guard.py`
  before each Edit, Write, MultiEdit, NotebookEdit and Bash call.
- **`louvi/hooks/guard.py`:** `main()` reads the hook's JSON, loads the repo's
  `local/louvi.json` over the defaults, and runs `check_edit` or `check_bash`.
- **`louvi/skills/<name>/SKILL.md`:** Claude Code loads each skill when its
  description matches the task.
