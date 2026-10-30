# docs/CLAUDE_louvi.md

Rules for working on Louvi, for people and AI agents alike. The root
`CLAUDE.md` routes here.

## What Louvi is, and isn't
- **It is the frame:** the patterns, the repo layout, ticket-first work, and
  guards that are off or loose by default and set per repo in config.
- **It isn't anyone's workflow.** Nothing specific to one person, team or setup
  goes in: no names, private repos, bots, private rules or secrets. A rule that's
  only right for one setup becomes a guard that setup turns on, not a default.
- **It holds few parts.** Skills for a stack, a role or a domain come from
  contributors. Louvi keeps them small and replaceable.

## How work is done here
- **Ticket first** (the `ticket-first` skill):
  - an issue with acceptance criteria;
  - a branch;
  - a draft pull request with `Closes #<n>` and evidence;
  - a maintainer merges.
- **Config-driven** (the `patterns` skill): a new behaviour is a setting with a
  safe default, documented in `src/louvi/README.md`.
- **Layout** (the `repo-layout` skill): the plugin lives in `src/louvi/`, tests
  in `src/tests/`, this repo's own config in `local/`. Update the folder
  `README.md` in the same change that adds or moves a file.

## Checks before any push
- `npm ci`, then `npm run typecheck` (the `.mjs` files are type-checked with
  `// @ts-check`, with no build step) and `npm test` (Node's test runner)
- `npm run validate`: `claude plugin validate --strict` on the marketplace
  and the plugin

CI runs all three on every pull request and push to `main`.

## Tech
Node.js (22 or later) and TypeScript, with no Python. The plugin's guards use
Node's standard library only, so installing the plugin needs nothing beyond
Node, which Claude Code already has. `package.json` holds only dev tooling.

## Guards on this repo
This repo uses its own plugin. `local/louvi.json` turns on `protect-branch` for
`main`.
