# CodeMatch pilot operations runbook

**Approval gate:** these instructions describe a candidate deployment only. Do not provision paid/public resources, DNS, certificates, or deploy until the owner approves the provider, region, spend cap, domain, data location, backup destination, and deployment.

## Local Windows development

1. Install Docker Desktop and select the Linux container engine. Keep the existing Windows PostgreSQL service on port 5432 running; the local Compose database maps `127.0.0.1:5433` to container port 5432.
2. Copy `.env.example` to `.env` (ignored by Git). Values in the example are local-only. Do not place real service credentials in tracked files.
3. Select an installed Java 21 JDK/JBR for this PowerShell session; for the audited workstation:

   ```powershell
   $env:JAVA_HOME = 'C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr'
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   java -version
   ```

4. Start the local database and API with `docker compose up -d --build --wait postgres api`; check `docker compose ps` and `Invoke-RestMethod http://127.0.0.1:8080/actuator/health`.
5. In another terminal run `npm ci`, `npm run dev`. Open `http://localhost:5173`; Vite proxies `/api` and `/actuator` to `http://127.0.0.1:8080`, preserving same-origin session and CSRF behavior. If needed set `$env:CODEMATCH_API_PROXY_TARGET` for that Vite process.
6. Backend checks from repository root: `backend\mvnw.cmd -B compile`, `backend\mvnw.cmd -B test`, and `backend\mvnw.cmd -B verify`. Testcontainers requires Docker Desktop's Linux engine.
7. Frontend checks: `npm run build`, `npm run lint`, `npm test`. Real-browser and bounded workflow integration: `npx playwright install chromium`, start the isolated E2E stack with `docker compose --project-name codematch-m6-e2e -f docker-compose.e2e.yml up -d --build --wait`, then set `$env:CODEMATCH_REAL_E2E='1'`, `$env:CODEMATCH_E2E_COMPOSE_PROJECT='codematch-m6-e2e'`, `$env:VITE_API_BASE_URL='/api/v1'`, and `$env:CODEMATCH_API_PROXY_TARGET='http://127.0.0.1:18080'` before `npm run test:e2e`. The real test restarts only that isolated project's API container to verify CV volume persistence. For bounded concurrency scripts, start `npm run dev -- --host 127.0.0.1` with the same API proxy target in another terminal, then run `node scripts/bounded-health-smoke.mjs` and `node scripts/bounded-workflow-smoke.mjs`. Stop only the verified test project using `docker compose --project-name codematch-m6-e2e -f docker-compose.e2e.yml down --volumes --remove-orphans`.

## Candidate staging topology (not deployed)

The reviewed `docker-compose.staging.yml` has a Caddy public edge, an API on a private edge/data network, and PostgreSQL on an internal-only network with no published database/API ports. Caddy serves a built `dist/` frontend and proxies `/api/*` and health to the API on the same HTTPS origin. CVs and PostgreSQL use separate named volumes. It requires a real domain, public DNS, and operator-approved host firewall and secret management; the sample `.env.staging.example` uses deliberately invalid domain and secret placeholders.

After explicit deployment approval only: create a secret-managed untracked environment file with strong distinct credentials; install/secure the selected host; build the frontend with `VITE_API_BASE_URL=/api/v1`; validate configuration with `docker compose --env-file <approved-file> -f docker-compose.staging.yml config`; review the rendered configuration for secrets; then follow the approved rollout/change window. Do not use sample secrets or commit populated environment files. API and database ports must remain unpublished. Confirm Caddy certificate issuance, readiness and live same-origin auth/CSRF flows before inviting pilot users.

## Backup and restore

Never test recovery against a shared, staging, or production database. Use `scripts/backup-restore-smoke.ps1` to prove PostgreSQL logical backup/restore and private-file archive integrity using an ephemeral disposable PostgreSQL container and synthetic data. It removes only its uniquely named container and temporary smoke directory. This smoke is not an encrypted off-host backup, retention policy, or production recovery drill.

For a future approved pilot, keep encrypted database dumps and encrypted private-CV archives in a separately permissioned off-host destination, with independent credentials and defined retention. Record backup age, archive integrity, migration history and row/file checksums. Restore to isolated infrastructure, validate owner access and cross-user denial, and only then decide recovery. A named Docker volume or provider snapshot alone is not a verified backup.

## Incident, rollback and shutdown

- Stop onboarding and capture timestamps/request IDs; preserve relevant security logs without copying passwords, cookies, CV bytes or tokens into tickets.
- For a failed application rollout, return to the prior immutable application image only if the current schema remains backward compatible. Prefer a forward fix over destructive schema rollback.
- Restore only into an isolated recovery target until database and private-CV integrity plus authorization are checked.
- On shutdown, pause registrations, notify pilot participants through the approved contact channel, export required data under the retention policy, remove pilot data/backups on schedule, revoke credentials and verify DNS/resource deletion. Keep audit obligations and legal retention requirements in view.

## Pilot operations requiring owner assignment

Before onboarding, name an incident contact and moderation owner, agree support hours, privacy/consent and deletion text, data retention, CV file policy (malware scanning is not implemented), admin provisioning and audit retention, backup owner, expected pilot size/dates, and success criteria. The current rate limiter is process-local; run a single API instance only.

There is no application admin-grant endpoint or default admin account. Before a pilot, an authorized database operator must follow an owner-reviewed, identity-verified, transactional grant procedure and record a corresponding operator action in `audit_events`; test that the designated account can reach `/admin/pilot` and that an ordinary account receives 403. Revoke access and record the revocation when the operator role ends. Do not place a reusable admin password or direct SQL statement with a real account in this repository. If a responsible operator and auditable procedure are unavailable, do not start the pilot.

Route support requests through the owner-approved contact channel. A report in the moderation queue must be reviewed by the assigned moderator, with the decision and any follow-up recorded; do not promise a response SLA until a person is assigned to cover it. Escalate suspected account compromise, unauthorized CV access, or exposure of personal information to the incident contact immediately; pause onboarding and follow the incident procedure above.
