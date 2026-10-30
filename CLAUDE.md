# CLAUDE.md: louisli/louvi

Louvi, a starting point for working with AI: a skeleton of patterns, repo
layout, ticket-first work and guards, shipped as a Claude Code plugin.

## General rules
1. Read the rules file below before you start work; a route may send you to
   just one part of it.
2. Name the repo, branch and file path in everything you report.
3. No secrets in files, commits, PRs or posts.
4. Nothing here is specific to one person, team or setup: no names, private
   repos, bots or private rules. Those belong in the repos that use Louvi.
5. Lasting instructions live in the repo, not only in a chat.
6. If no route below matches your task, ask the maintainer. Don't guess.

## Rules file
Read `docs/CLAUDE_louvi.md` first.

## Routes: read only the file that matches your task
| If your task is… | Read |
| --- | --- |
| changing a skill | `src/louvi/skills/<name>/SKILL.md`, then `src/louvi/README.md` |
| changing a guard | `src/louvi/hooks/guard.mjs` and `src/tests/guard.test.mjs` |
| the plugin or marketplace manifests | `src/louvi/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` |
| a new idea for Louvi | `local/ideas/README.md` |
| a file that fits nowhere yet | `local/unsorted/README.md` |
| anything else | ask the maintainer |
