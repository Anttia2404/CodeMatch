# CodeMatch engineering instructions

- Product language is Vietnamese. Keep UI copy plain, specific, and accessible.
- Preserve the modular monolith: React/Vite frontend and Java 21/Spring Boot API backed by PostgreSQL.
- Keep authorization at the service boundary and validate all incoming data. Never expose private CV storage URLs.
- Do not add demo people, activity counts, testimonials, ratings, or verification claims without clearly marking local-only data.
- Use focused changes, document material architectural choices in `docs/DECISION_LOG.md`, and keep product docs aligned with behavior.
- Run relevant frontend checks with `npm run build`, `npm run lint`, and `npm test`; run backend checks with the Maven wrapper when available.
- Follow the repository's **Automatic GitHub Synchronization** policy below for verified changes. Never commit or push secrets. Do not deploy without explicit authorization.

## Automatic GitHub Synchronization

For every meaningful, verified change:

1. Inspect `git status` and confirm the current branch.
2. Review the complete diff, including untracked files.
3. Check for secrets and unintended/generated files.
4. Run the relevant required tests; do not commit when required checks are known to fail.
5. Stage only intended files and review the staged diff.
6. Create a Conventional Commit with a concise scope.
7. Push the commit to the current feature branch on `origin` and verify the remote branch contains it.
8. Report the commit hash and push result.

Do not wait until a milestone is complete to push. Prefer one coherent commit per completed feature, fix, or documentation update. Do not commit every keystroke or incomplete intermediate work.

Never commit `.env` files, credentials, API keys, tokens, private CV files, local databases, build outputs, or `node_modules`. The `.gitignore` is a defense in depth; review staged filenames and content as well.

Never force-push, delete remote branches, automatically merge pull requests, push directly to `main`, rewrite published history without approval, or bypass Git hooks/required checks. If a push fails, report the exact error and stop Git synchronization until the problem is resolved. Do not silently switch remotes or authentication methods.

Use the configured Git credential helper (Git Credential Manager on this workstation) for GitHub fetch/push authentication. GitHub CLI (`gh`) is optional and is not required to commit or push. Let Git Credential Manager launch its normal interactive browser flow if authentication is needed; never request, print, or store access tokens in project files. If Git reports an authentication/permission error, report the exact command and error, then stop synchronization until the user resolves it.

### Branching

- `develop` is the integration baseline; do not assume it exists remotely.
- Use `feature/m1-auth-profiles`, `feature/m2-learning-requests`, `feature/m3-proposals-cv`, `feature/m4-matching`, `feature/m5-security-e2e`, and `feature/m6-pilot-launch` for the corresponding milestones.
- Create feature branches from the appropriate verified `develop` commit. Push each verified feature branch with upstream tracking.
- When a milestone is ready for review, create or update a pull request targeting `develop`. Never merge it without explicit approval.
- `gh` may be used for pull request operations when installed and authenticated. Otherwise use an available GitHub integration or the GitHub web UI; require `gh` installation only if a needed PR operation has no suitable alternative.
- If the remote has commits not in local history, fetch and inspect them. Preserve both histories; stop for approval before any merge, rebase, or history rewrite.

### Deployment approval

- Local configuration, build, validation, and synthetic-data tests are authorized within the approved milestone.
- Do not create paid/public cloud resources, enable billing, buy/register domains, publish DNS, or deploy externally without explicit user approval of the provider, region, cost cap, domain, data location, backup destination, and rollout.
- Do not invite pilot participants or accept real CV/user data until the owner approves pilot dates/scope, privacy and consent text, support/moderation ownership, retention/deletion, and recovery evidence.

See `.codex/skills/codematch-github-workflow/SKILL.md` for the repeatable workflow.
