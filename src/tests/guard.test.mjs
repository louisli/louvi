// @ts-check
// Tests for src/louvi/hooks/guard.mjs: run it the way Claude Code does, JSON on stdin.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { tokens } from "../louvi/hooks/guard.mjs";

const GUARD = join(dirname(fileURLToPath(import.meta.url)), "..", "louvi", "hooks", "guard.mjs");

/** @param {string} branch */
function makeRepo(branch) {
  const repo = mkdtempSync(join(tmpdir(), "louvi-"));
  spawnSync("git", ["init", "-q", "-b", branch, repo]);
  return repo;
}

/**
 * The guard's deny reason, or undefined when it lets the call through.
 * @param {string} kind
 * @param {object} event
 * @param {string} projectDir
 * @param {object | string} [config] written to local/louvi.json (a string is written as is)
 */
function runGuard(kind, event, projectDir, config) {
  if (config !== undefined) {
    mkdirSync(join(projectDir, "local"), { recursive: true });
    writeFileSync(join(projectDir, "local", "louvi.json"), typeof config === "string" ? config : JSON.stringify(config));
  }
  const r = spawnSync(process.execPath, [GUARD, kind], {
    input: JSON.stringify(event),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason : undefined;
}

/** @param {string} repo */
const edit = (repo, name = "a.md") => ({ tool_name: "Edit", cwd: repo, tool_input: { file_path: join(repo, name) } });
/** @param {string} repo @param {string} command */
const bash = (repo, command) => ({ tool_name: "Bash", cwd: repo, tool_input: { command } });

describe("protect-branch", () => {
  it("blocks an edit on main by default", () => {
    const repo = makeRepo("main");
    assert.match(runGuard("edit", edit(repo), repo) ?? "", /protect-branch/);
  });

  it("allows an edit on a feature branch", () => {
    const repo = makeRepo("feature/x");
    assert.equal(runGuard("edit", edit(repo), repo), undefined);
  });

  it("follows the repo's config", () => {
    const repo = makeRepo("main");
    assert.equal(runGuard("edit", edit(repo), repo, { guards: { "protect-branch": { on: false } } }), undefined);
    const trunk = makeRepo("trunk");
    assert.equal(runGuard("edit", edit(trunk), trunk), undefined);
    assert.ok(runGuard("edit", edit(trunk), trunk, { guards: { "protect-branch": { branches: ["trunk"] } } }));
  });

  it("allows a file outside any repo", () => {
    const folder = mkdtempSync(join(tmpdir(), "louvi-"));
    assert.equal(runGuard("edit", edit(folder), folder), undefined);
  });

  it("checks a new file in a folder that doesn't exist yet", () => {
    const repo = makeRepo("main");
    assert.ok(runGuard("edit", edit(repo, "new/deep/file.md"), repo));
  });
});

describe("one-git-command", () => {
  const on = { guards: { "one-git-command": { on: true } } };

  it("is off by default", () => {
    const repo = makeRepo("feature");
    assert.equal(runGuard("bash", bash(repo, "git add . && git commit -m x"), repo), undefined);
  });

  it("blocks chains, a new line and a leading cd", () => {
    const repo = makeRepo("feature");
    for (const command of ["git add . && git commit -m x", "git status; git log", "cd src && git status", "git log | head", "git status\ngit log"]) {
      assert.ok(runGuard("bash", bash(repo, command), repo, on), command);
    }
  });

  it("allows one git command, even with operators inside quotes", () => {
    const repo = makeRepo("feature");
    for (const command of ["git -C src status", 'git commit -m "fix a; b && c"', "git commit -m 'x | y'", "npm test && npm run lint"]) {
      assert.equal(runGuard("bash", bash(repo, command), repo, on), undefined, command);
    }
  });
});

describe("commit-message", () => {
  const on = { guards: { "commit-message": { on: true, forbid: ["model-[0-9]+", "secret"] } } };

  it("blocks a forbidden pattern in any message form", () => {
    const repo = makeRepo("feature");
    for (const command of ['git commit -m "use model-42"', 'git commit --message "a SECRET"', 'git commit --message="model-7 here"']) {
      assert.ok(runGuard("bash", bash(repo, command), repo, on), command);
    }
  });

  it("allows other messages and other commands", () => {
    const repo = makeRepo("feature");
    for (const command of ['git commit -m "fix the guard"', "git log --grep secret", "echo model-42"]) {
      assert.equal(runGuard("bash", bash(repo, command), repo, on), undefined, command);
    }
  });
});

describe("robustness", () => {
  it("lets the call through when the config is broken", () => {
    const repo = makeRepo("main");
    assert.equal(runGuard("edit", edit(repo), repo, "{not json"), undefined);
  });
});

describe("tokens", () => {
  it("keeps quoted text whole and splits operators", () => {
    assert.deepEqual(tokens(`git commit -m "a; b" && echo 'c | d'`), ["git", "commit", "-m", "a; b", "&&", "echo", "c | d"]);
    assert.deepEqual(tokens("a||b;c"), ["a", "||", "b", ";", "c"]);
    assert.deepEqual(tokens('say "x\\"y" z\\ w'), ["say", 'x"y', "z w"]);
  });
});
