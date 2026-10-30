#!/usr/bin/env node
// @ts-check
/**
 * Louvi's guards: Claude Code PreToolUse hooks, set per repo in local/louvi.json.
 *
 * Called as `guard.mjs edit` (Edit, Write, MultiEdit, NotebookEdit) or `guard.mjs bash`
 * (Bash), with the hook's JSON on stdin. A guard that objects prints a "deny" decision;
 * otherwise the script prints nothing and the tool call goes ahead. If the guard itself
 * fails (bad config, no git), it lets the call through: a guard should never be the
 * reason work stops. Node's standard library only, so there is nothing to install.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @typedef {{ on: boolean, branches?: string[], forbid?: string[] }} Guard
 * @typedef {Record<string, Guard>} Guards
 * @typedef {{ cwd?: string, tool_input?: { file_path?: string, notebook_path?: string, command?: string } }} HookEvent
 */

/** @type {Guards} */
export const DEFAULTS = {
  "protect-branch": { on: true, branches: ["main", "master"] },
  "one-git-command": { on: false },
  "commit-message": { on: false, forbid: [] },
};

/**
 * The defaults, with each guard's keys overridden by local/louvi.json if the repo has one.
 * @param {string} projectDir
 * @returns {Guards}
 */
export function loadConfig(projectDir) {
  /** @type {Guards} */
  const guards = Object.fromEntries(Object.entries(DEFAULTS).map(([name, g]) => [name, { ...g }]));
  const path = join(projectDir, "local", "louvi.json");
  if (existsSync(path)) {
    const own = JSON.parse(readFileSync(path, "utf8")).guards ?? {};
    for (const [name, values] of Object.entries(own)) {
      if (guards[name] && values && typeof values === "object") Object.assign(guards[name], values);
    }
  }
  return guards;
}

/**
 * The current branch of the git repo holding `path`, or undefined outside a repo or on a detached HEAD.
 * @param {string} path
 */
export function branchOf(path) {
  let folder = existsSync(path) && statSync(path).isDirectory() ? path : dirname(path);
  while (!existsSync(folder)) {
    const parent = dirname(folder);
    if (parent === folder) return undefined;
    folder = parent;
  }
  // symbolic-ref also names the branch of a repo with no commits yet.
  const r = spawnSync("git", ["-C", folder, "symbolic-ref", "--short", "-q", "HEAD"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : undefined;
}

/**
 * @param {HookEvent} event
 * @param {Guards} guards
 * @returns {string | undefined}
 */
export function checkEdit(event, guards) {
  const g = guards["protect-branch"];
  if (!g?.on) return undefined;
  let path = event.tool_input?.file_path ?? event.tool_input?.notebook_path;
  if (!path) return undefined;
  if (!isAbsolute(path)) path = join(event.cwd ?? ".", path);
  const branch = branchOf(path);
  if (branch && (g.branches ?? []).includes(branch)) {
    return `protect-branch: you're on ${branch}. Create a branch first (git switch -c <name>), then edit.`;
  }
  return undefined;
}

const OPERATORS = ["&&", "||", ";", "|", "&", "\n"];

/**
 * Shell words and operators, with quoted text kept whole, so `-m "a; b"` isn't read as two commands.
 * @param {string} command
 * @returns {string[]}
 */
export function tokens(command) {
  /** @type {string[]} */
  const out = [];
  let word = "";
  let inWord = false;
  const push = () => {
    if (inWord) out.push(word);
    word = "";
    inWord = false;
  };
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (c === "'") {
      const end = command.indexOf("'", i + 1);
      word += command.slice(i + 1, end === -1 ? command.length : end);
      inWord = true;
      i = end === -1 ? command.length : end;
    } else if (c === '"') {
      inWord = true;
      for (i++; i < command.length && command[i] !== '"'; i++) {
        if (command[i] === "\\" && i + 1 < command.length) i++;
        word += command[i];
      }
    } else if (c === "\\" && i + 1 < command.length) {
      word += command[++i];
      inWord = true;
    } else if (c === " " || c === "\t") {
      push();
    } else {
      const op = OPERATORS.find((o) => command.startsWith(o, i));
      if (op) {
        push();
        out.push(op);
        i += op.length - 1;
      } else {
        word += c;
        inWord = true;
      }
    }
  }
  push();
  return out;
}

/**
 * @param {HookEvent} event
 * @param {Guards} guards
 * @returns {string | undefined}
 */
export function checkBash(event, guards) {
  const words = tokens((event.tool_input?.command ?? "").trim());
  const git = words.indexOf("git");
  if (git === -1) return undefined;
  if (guards["one-git-command"]?.on) {
    if (words[0] === "cd") return "one-git-command: don't start with cd. Use git -C <dir> ... instead.";
    if (words.some((w) => OPERATORS.includes(w))) {
      return "one-git-command: run one git command per call, with no &&, ||, ;, | or & chaining.";
    }
  }
  const g = guards["commit-message"];
  if (g?.on && g.forbid?.length && words.slice(git).includes("commit")) {
    /** @type {string[]} */
    const messages = [];
    words.forEach((w, i) => {
      const next = words[i + 1];
      if ((w === "-m" || w === "--message") && next !== undefined) messages.push(next);
      else if (w.startsWith("--message=")) messages.push(w.slice(10));
    });
    for (const pattern of g.forbid) {
      if (messages.some((m) => new RegExp(pattern, "i").test(m))) {
        return `commit-message: the message matches a forbidden pattern (${pattern}).`;
      }
    }
  }
  return undefined;
}

/** @param {string} reason */
function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: `louvi: ${reason}` },
    }) + "\n",
  );
}

/** @param {string | undefined} kind */
export function main(kind) {
  try {
    /** @type {HookEvent} */
    const event = JSON.parse(readFileSync(0, "utf8"));
    const guards = loadConfig(process.env.CLAUDE_PROJECT_DIR || event.cwd || ".");
    const reason = kind === "edit" ? checkEdit(event, guards) : kind === "bash" ? checkBash(event, guards) : undefined;
    if (reason) deny(reason);
  } catch (e) {
    // A broken guard lets the call through.
    process.stderr.write(`louvi guard skipped: ${e instanceof Error ? e.message : String(e)}\n`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main(process.argv[2]);
