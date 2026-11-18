---
name: codematch-github-workflow
description: Commit and synchronize verified CodeMatch changes with GitHub; use for branch setup, staging, commits, pushes, and milestone pull requests.
metadata:
  short-description: Safe CodeMatch GitHub workflow
---

# CodeMatch GitHub workflow

Use this skill when completing a meaningful CodeMatch change or configuring its GitHub branches. Read the repository `AGENTS.md`; it is the source of project policy. User instructions for the current task take precedence when they are more specific.

## Before committing

1. Inspect `git status --short --branch`, the current branch, remotes, and recent history. Confirm Git and the configured credential helper are available. `gh` is optional for Git fetch/push. Let Git Credential Manager use its normal interactive browser authentication if Git requests it. Never request, print, or store tokens.
2. Inspect the full unstaged and staged diffs, including new files. Check that only task-related files are included and that `.gitignore` covers secrets, local databases, dependencies, and generated outputs.
3. Search staged paths and contents for credentials, API keys, tokens, `.env`, private CVs, local databases, `node_modules`, build outputs, and other unintended material. A scanner is useful if already available, but does not replace reviewing the staged diff.
4. Run the checks relevant to the change. Do not create a commit or push known-failing required work.
5. Stage explicit intended paths, then inspect `git diff --cached --check`, `git diff --cached --stat`, and the staged diff.
6. Create one coherent Conventional Commit, for example `feat: add learning request creation` or `docs: clarify local Windows setup`.

## Branches and synchronization

- Keep work on the appropriate feature branch: `feature/m1-auth-profiles`, `feature/m2-learning-requests`, `feature/m3-proposals-cv`, `feature/m4-matching`, `feature/m5-security-e2e`, or `feature/m6-pilot-launch`.
- Use `develop` as the integration baseline only after inspecting whether it exists and verifying its history. Never push directly to `main`.
- After a verified commit, push the current feature branch with upstream tracking when needed (`git push --set-upstream origin HEAD`). Verify the remote branch head matches the local commit, then report the commit hash and push result.
- If remote history exists, fetch and inspect before publishing. If histories diverge or a merge/rebase is required, stop and ask for approval. Never force-push, delete branches, bypass hooks/checks, or rewrite published history.
- If a push fails, report the exact command and error and stop Git synchronization until the cause is resolved. Do not change the configured remote or authentication mechanism to work around a failure.

## GitHub access and pull requests

- Git fetch/push uses the configured Git credential helper; no `gh` CLI check is required. Let Git Credential Manager handle interactive authentication if prompted. If authentication or permissions fail, report the exact error and stop synchronization. For PR operations, use `gh` if available or an available GitHub integration/web UI; install `gh` only when a required PR action has no suitable alternative.
- Push verified feature work as it is completed; do not wait until the milestone is finished.
- `gh` is optional. For pull requests, use `gh` if installed, otherwise use an available GitHub integration or GitHub web UI. Ask for CLI installation only if a required PR action has no suitable alternative.
- When a milestone is ready for review, inspect existing pull requests for the branch. Create a pull request targeting `develop` if none exists, or update the existing open pull request so its title and body match the full branch scope. Report its URL.
- Never merge a pull request without explicit approval.

## Initial synchronization

Inspect the remote before publishing. If the repository is empty, push local `develop` from baseline `677921a7aceb092962ac4ef612738410a57c726a` with upstream tracking, then publish the current feature branch. If remote commits exist, preserve them and stop for approval if reconciliation requires a merge, rebase, or history rewrite. `git ls-remote origin` can inspect read access/history; use Git Credential Manager for any interactive write authentication required by `git push`.

## Completion report

Report the branch, commit hash, push result, remote verification, pull request URL when applicable, and any blocker. Do not claim a push succeeded unless the remote branch was checked.
