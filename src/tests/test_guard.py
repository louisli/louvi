"""Tests for src/louvi/hooks/guard.py: run it the way Claude Code does, JSON on stdin."""
import json
import os
import subprocess
import sys
import tempfile
import unittest

GUARD = os.path.join(os.path.dirname(__file__), "..", "louvi", "hooks", "guard.py")


def git(repo, *args):
    subprocess.run(["git", "-C", repo, *args], check=True, capture_output=True)


def make_repo(branch):
    repo = tempfile.mkdtemp()
    git(repo, "init", "-q", "-b", branch)
    return repo


def run_guard(kind, event, project_dir, config=None):
    if config is not None:
        os.makedirs(os.path.join(project_dir, "local"), exist_ok=True)
        with open(os.path.join(project_dir, "local", "louvi.json"), "w", encoding="utf-8") as f:
            json.dump(config, f)
    env = {**os.environ, "CLAUDE_PROJECT_DIR": project_dir}
    out = subprocess.run([sys.executable, GUARD, kind], input=json.dumps(event), capture_output=True, text=True, env=env)
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)["hookSpecificOutput"]["permissionDecisionReason"] if out.stdout.strip() else None


def edit(repo, name="a.md"):
    return {"tool_name": "Edit", "cwd": repo, "tool_input": {"file_path": os.path.join(repo, name)}}


def bash(repo, command):
    return {"tool_name": "Bash", "cwd": repo, "tool_input": {"command": command}}


class ProtectBranch(unittest.TestCase):
    def test_blocks_an_edit_on_main_by_default(self):
        repo = make_repo("main")
        self.assertIn("protect-branch", run_guard("edit", edit(repo), repo))

    def test_allows_an_edit_on_a_feature_branch(self):
        repo = make_repo("feature/x")
        self.assertIsNone(run_guard("edit", edit(repo), repo))

    def test_follows_the_repo_config(self):
        repo = make_repo("main")
        self.assertIsNone(run_guard("edit", edit(repo), repo, {"guards": {"protect-branch": {"on": False}}}))
        trunk = make_repo("trunk")
        self.assertIsNone(run_guard("edit", edit(trunk), trunk))
        self.assertIsNotNone(run_guard("edit", edit(trunk), trunk, {"guards": {"protect-branch": {"branches": ["trunk"]}}}))

    def test_allows_a_file_outside_any_repo(self):
        folder = tempfile.mkdtemp()
        self.assertIsNone(run_guard("edit", edit(folder), folder))

    def test_checks_a_new_file_in_a_folder_that_does_not_exist_yet(self):
        repo = make_repo("main")
        self.assertIsNotNone(run_guard("edit", edit(repo, "new/deep/file.md"), repo))


class OneGitCommand(unittest.TestCase):
    ON = {"guards": {"one-git-command": {"on": True}}}

    def test_is_off_by_default(self):
        repo = make_repo("feature")
        self.assertIsNone(run_guard("bash", bash(repo, "git add . && git commit -m x"), repo))

    def test_blocks_chains_and_a_leading_cd(self):
        repo = make_repo("feature")
        for command in ["git add . && git commit -m x", "git status; git log", "cd src && git status", "git log | head"]:
            self.assertIsNotNone(run_guard("bash", bash(repo, command), repo, self.ON), command)

    def test_allows_one_git_command_even_with_operators_inside_quotes(self):
        repo = make_repo("feature")
        for command in ["git -C src status", 'git commit -m "fix a; b && c"', "npm test && npm run lint"]:
            self.assertIsNone(run_guard("bash", bash(repo, command), repo, self.ON), command)


class CommitMessage(unittest.TestCase):
    ON = {"guards": {"commit-message": {"on": True, "forbid": ["model-[0-9]+", "secret"]}}}

    def test_blocks_a_forbidden_pattern_in_any_message_form(self):
        repo = make_repo("feature")
        for command in ['git commit -m "use model-42"', 'git commit --message "a SECRET"', 'git commit --message="model-7 here"']:
            self.assertIsNotNone(run_guard("bash", bash(repo, command), repo, self.ON), command)

    def test_allows_other_messages_and_other_commands(self):
        repo = make_repo("feature")
        for command in ['git commit -m "fix the guard"', "git log --grep secret", "echo model-42"]:
            self.assertIsNone(run_guard("bash", bash(repo, command), repo, self.ON), command)


class Robustness(unittest.TestCase):
    def test_a_broken_config_lets_the_call_through(self):
        repo = make_repo("main")
        os.makedirs(os.path.join(repo, "local"))
        with open(os.path.join(repo, "local", "louvi.json"), "w", encoding="utf-8") as f:
            f.write("{not json")
        self.assertIsNone(run_guard("edit", edit(repo), repo))


if __name__ == "__main__":
    unittest.main()
