#!/usr/bin/env python3
"""Louvi's guards: Claude Code PreToolUse hooks, set per repo in local/louvi.json.

Called as `guard.py edit` (Edit, Write, MultiEdit, NotebookEdit) or `guard.py bash`
(Bash), with the hook's JSON on stdin. A guard that objects prints a "deny" decision;
otherwise the script prints nothing and the tool call goes ahead. If the guard itself
fails (bad config, no git), it lets the call through: a guard should never be the
reason work stops.
"""
import json
import os
import re
import shlex
import subprocess
import sys

DEFAULTS = {
    "protect-branch": {"on": True, "branches": ["main", "master"]},
    "one-git-command": {"on": False},
    "commit-message": {"on": False, "forbid": []},
}


def load_config(project_dir):
    """The defaults, with each guard's keys overridden by local/louvi.json if the repo has one."""
    guards = {name: dict(values) for name, values in DEFAULTS.items()}
    path = os.path.join(project_dir, "local", "louvi.json")
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            for name, values in json.load(f).get("guards", {}).items():
                if name in guards and isinstance(values, dict):
                    guards[name].update(values)
    return guards


def deny(reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": f"louvi: {reason}",
        }
    }))


def branch_of(path):
    """The current branch of the git repo holding `path`, or None outside a repo."""
    folder = path if os.path.isdir(path) else os.path.dirname(path) or "."
    while not os.path.isdir(folder):
        parent = os.path.dirname(folder)
        if parent == folder:
            return None
        folder = parent
    # symbolic-ref also names the branch of a repo with no commits yet; it fails on a detached HEAD.
    result = subprocess.run(
        ["git", "-C", folder, "symbolic-ref", "--short", "-q", "HEAD"],
        capture_output=True, text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else None


def check_edit(event, guards):
    g = guards["protect-branch"]
    if not g.get("on"):
        return None
    tool_input = event.get("tool_input", {})
    path = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not path:
        return None
    if not os.path.isabs(path):
        path = os.path.join(event.get("cwd", "."), path)
    branch = branch_of(path)
    if branch in g.get("branches", []):
        return f"protect-branch: you're on {branch}. Create a branch first (git switch -c <name>), then edit."
    return None


def tokens(command):
    """Shell words and operators, with quoted text kept whole, so `-m "a; b"` isn't read as two commands."""
    lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    return list(lexer)


OPERATORS = {"&&", "||", ";", "|", "&"}


def check_bash(event, guards):
    command = event.get("tool_input", {}).get("command", "")
    words = tokens(command)
    if "git" not in words:
        return None
    g = guards["one-git-command"]
    if g.get("on"):
        if words[0] == "cd":
            return "one-git-command: don't start with cd. Use git -C <dir> ... instead."
        if "\n" in command.strip() or any(w in OPERATORS for w in words):
            return "one-git-command: run one git command per call, with no &&, ||, ;, | or & chaining."
    g = guards["commit-message"]
    if g.get("on") and g.get("forbid") and "commit" in words[words.index("git"):]:
        messages = [words[i + 1] for i, w in enumerate(words[:-1]) if w in ("-m", "--message")]
        messages += [w.split("=", 1)[1] for w in words if w.startswith("--message=")]
        for pattern in g["forbid"]:
            for message in messages:
                if re.search(pattern, message, re.IGNORECASE):
                    return f"commit-message: the message matches a forbidden pattern ({pattern})."
    return None


def main():
    kind = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        event = json.load(sys.stdin)
        guards = load_config(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or ".")
        reason = check_edit(event, guards) if kind == "edit" else check_bash(event, guards) if kind == "bash" else None
    except Exception as e:  # a broken guard lets the call through
        print(f"louvi guard skipped: {e}", file=sys.stderr)
        return 0
    if reason:
        deny(reason)
    return 0


if __name__ == "__main__":
    sys.exit(main())
