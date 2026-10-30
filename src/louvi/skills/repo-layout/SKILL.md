---
name: repo-layout
description: The standard repo layout (src/, output/, docs/, local/), the folder indexes, and the unsorted folder. Use when creating, moving or placing files, starting a new repo, or finding your way round one.
---

# Repo layout

## The root
Only these, plus the files a tool insists on at the root (`package.json`,
`pyproject.toml`, `LICENSE`, dotfiles, `.github/`, `.claude-plugin/`):

| Path | Holds |
| --- | --- |
| `README.md` | what the repo is, a "what's where" table, and one line pointing AI agents at `CLAUDE.md` |
| `CLAUDE.md` | the router: general rules, the rules file, the routes |
| `src/` | the code and the data it needs; `src/README.md` names the entry points |
| `output/` | everything a run writes; git-ignored except its `README.md` |
| `docs/` | the docs, the repo's rules file, and `docs/archive/` for history |
| `local/` | config for this repo's machines and agents: `ideas/`, `unsorted/`, `louvi.json`, an env template |

A repo has only the folders it needs.

## Indexes
Each top folder has a `README.md` listing what's in it. A reader can go from
`CLAUDE.md` to the rules file, then to each folder's index, then to the code's
entry points. Update the index in the same change that adds or moves a file.

## The unsorted folder
`local/unsorted/` holds anything that fits nowhere yet: a file, or a folder of
files. Putting something there is never a failure.
- **Its one rule:** `local/unsorted/README.md` has one line per entry, giving what
  it is, who added it and when, and where it probably belongs.
- **Entries don't stay long.** Each one moves to its home, or the layout gains a
  new place for that kind of file.

## Moving a path
In the same change, move it and update everything that names it: docs,
`CLAUDE.md` routes, workflows, config.
