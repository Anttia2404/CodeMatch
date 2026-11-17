# Skills audit

Checked 2026-11-17. Skills below are available locally in the Codex environment and are applied to this build. No external skills were installed or scripts executed.

| Skill | Source repository | Purpose | Installed status | Security considerations | Application |
|---|---|---|---|---|---|
| frontend-design | `anthropics/skills` (`skills/frontend-design/SKILL.md`, per `skills-lock.json`) | Distinctive, usable visual direction | Installed in `.agents/skills/frontend-design` | Read local instructions; no third-party scripts run | Palette, hierarchy, responsive landing/discovery skeleton |
| vercel-react-best-practices | `vercel-labs/agent-skills` (`skills/react-best-practices/SKILL.md`) | React implementation/performance guidance | Installed in `.agents/skills/vercel-react-best-practices` | Reviewed local source before applying | Component state and Vite React structure |
| web-design-guidelines | `vercel-labs/agent-skills` | UI and accessibility review | Installed in `.agents/skills/web-design-guidelines` | Reviewed local source before applying | Focus states, semantic controls, responsive review |
| playwright-best-practices | `currents-dev/playwright-best-practices-skill` | Browser test quality | Installed in `.agents/skills/playwright-best-practices` | Reviewed local source before applying; no browser scripts added | Reserved for later E2E milestone; M0 uses component tests |
| git-workflow | Local Codex skill `C:/Users/Hi/.codex/skills/git-workflow` | Branch/worktree and change hygiene | Installed in user skill root | Inspected repository state; repo is not initialized as Git | No commit/remote/branch action; preserve current files |

Environment audit: Node.js 22.19.0 and npm 10.9.0 available; Docker 28.5.1 available; Java is 8, not the required Java 21; Maven, PostgreSQL CLI, and a Maven wrapper are unavailable. Codex desktop version was not exposed as a local command. The skill catalog and local skill lockfile were inspected instead.
