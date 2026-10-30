---
name: patterns
description: The four patterns every piece of work follows (config-driven, repo structure, instructions, queue + scheduled). Use when designing anything new, such as a config, a role, a queue or a repo, or when deciding where something belongs.
---

# The four patterns

Build anything new from these. When a need doesn't fit any of them, raise it with
the repo's maintainer before building something else.

## 1. Config-driven
Anything that could differ between repos, roles or machines is a config value,
not code and not prose.
- **A shared default**, in one file.
- **A per-repo override**, only where repos really differ.
- **A check** that fails when the config is wrong. It never silently falls back:
  an unknown key is an error.

**To add something:**
1. Write the schema.
2. Put the default in a file.
3. Add the override only if needed.
4. Add the check and its tests.
5. Document every key.

## 2. Repo structure
Every repo has the same shape, so any reader can find their way round any repo
with the same steps. See the `repo-layout` skill.

## 3. Instructions
An agent reads a chain, each step naming the next, and stops at the step its
task needs:
1. `CLAUDE.md` at the root: the router, which gives the general rules, the rules
   file and the routes;
2. the rules file, in `docs/`: this repo's rules;
3. a runbook per role: what the role does, step by step, with its limits;
4. skills: rules that have held steady for a few reviews become skills, so
   they're the default everywhere.

When writing instructions:
- mention files, never import them;
- use one condition and one file per route;
- keep lasting instructions in the repo, never only in a chat.

## 4. Queue + scheduled
Whoever finds something doesn't act on it alone, and doesn't interrupt anyone.
- **Producers only append.** Each entry says who, when, what, where, and how urgent.
- **One scheduled consumer per queue** reads everything since its last run as a
  batch. It drops duplicates, decides each item, and records what it did.
- **People get a digest, not a stream.**

The batch is where caps live, where findings from different roles meet, and
where patterns show that no single run sees. Before a role posts, comments or
acts on a finding, ask whether it should append to a queue instead.
