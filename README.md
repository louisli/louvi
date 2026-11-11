# Louvi

**A starting point for working with AI.**

Louvi is a skeleton: the frame you build on when an AI does real work in your
repos. It holds:
- four patterns for designing anything;
- a repo layout any reader can find their way round;
- the habit of starting every change from a ticket;
- guards that keep the AI inside the limits you set.

The parts that fill the frame (skills for your stack, your roles, your checks)
come from contributors. Louvi doesn't try to own them.

Status: **v0**, early and changing. Site: [louvi.dev](https://louvi.dev).

## Install (Claude Code)

```
/plugin marketplace add louisli/louvi
/plugin install louvi@louvi
```

Then add `local/louvi.json` to a repo to set its guards. What's in the plugin,
and every guard's settings: [`src/louvi/README.md`](src/louvi/README.md).

## What's where

| Path | Holds |
| --- | --- |
| [`src/`](src/README.md) | the plugin (`src/louvi/`) and its tests (`src/tests/`) |
| [`docs/`](docs/README.md) | the docs, including the rules for working on this repo |
| [`local/`](local/README.md) | this repo's own config: its guards, ideas, and an unsorted folder |
| `.claude-plugin/` | the marketplace file, so `/plugin marketplace add louisli/louvi` works |
| `.github/` | CI |

**For AI agents:** start at [`CLAUDE.md`](CLAUDE.md); the rules are in
[`docs/CLAUDE_louvi.md`](docs/CLAUDE_louvi.md).

## Contributing

Every change starts as an issue, then lands as a pull request that links it.
Read [`docs/CLAUDE_louvi.md`](docs/CLAUDE_louvi.md) first; it applies to people
too.

## License

[MIT](LICENSE)
