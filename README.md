# CodeMatch

CodeMatch is a Vietnamese peer-to-peer marketplace for one-on-one coding instruction. The application supports accounts, developer profiles, learning requests, teaching proposals, private CV management, and learner-confirmed matching.

## Requirements

- Node.js 22 and npm
- Java 21. The Windows instructions below use the JBR bundled with IntelliJ IDEA 2024.2.4 when present; any JDK 21 works.
- Docker Desktop with the Linux engine running for PostgreSQL and backend integration tests

Maven is not required globally. Use the checked-in Maven Wrapper from `backend`.

## Windows quick start

In PowerShell from the repository root:

```powershell
$env:JAVA_HOME = 'C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version

if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --build
docker compose ps
docker compose exec postgres pg_isready -U codematch -d codematch
Test-NetConnection localhost -Port 5433
npm ci
npm run dev
Invoke-RestMethod http://localhost:8080/actuator/health | ConvertTo-Json
```

Open `http://localhost:5173`. Discovery, learner request management, proposal application/review, and CV management call the real API. The health badge is reachability only. Account sessions use an HttpOnly `CMSESSION` cookie and a CSRF token cookie/header; do not store credentials or session IDs in browser storage.

The Vite development server proxies `/api` and `/actuator` to `CODEMATCH_API_PROXY_TARGET` (default `http://127.0.0.1:8080`), so browser calls use the same origin. `.env.example` sets `VITE_API_BASE_URL=/api/v1`. Local demo/sample presentation data, where present, is distinct from API-backed account and request data; the pilot overview reads aggregate values from the live API and displays an honest empty state when no records exist.

In a second PowerShell window, set Java 21 for that shell only, then run backend checks from the repository root:

```powershell
Push-Location backend
$env:JAVA_HOME = 'C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd -version
.\mvnw.cmd -B compile
.\mvnw.cmd -B test
.\mvnw.cmd -B verify
Pop-Location
```

To confirm Flyway created the schema history table:

```powershell
docker compose exec postgres psql -U codematch -d codematch -c "select version, success from flyway_schema_history order by installed_rank;"
```

The Compose database is available on `127.0.0.1:5433` (container port 5432), avoiding the existing Windows PostgreSQL service on port 5432. The API connects over Compose networking at `postgres:5432`. The integration suite uses Testcontainers and the PostgreSQL 17 Alpine image. A skipped Testcontainers test is not a successful database verification. Copy the placeholder values in `.env.example` to the ignored `.env`, set a local password there, and keep secrets out of Git; local service ports bind to loopback.

## Database and verification

Compose keeps the host PostgreSQL 18 service on port 5432 untouched. Its PostgreSQL 17 development service is available at `127.0.0.1:5433` and the API container reaches it at `postgres:5432`. When running the backend outside Compose, its default datasource points to host port 5433. Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` in the process environment to override it.

The V3 migration adds learning requests, normalized request skills, and saved requests. V4 adds proposals and private CV metadata. Run `docker compose up -d --build`, then verify readiness with `docker compose ps` and `docker compose exec postgres pg_isready -U codematch -d codematch`. Use the Java 21 Maven Wrapper commands above; `test` and `verify` run PostgreSQL Testcontainers integration tests and require Docker Desktop's Linux engine. A Docker-less skip is not a passing integration verification.

For local sample credentials, `.env.example` is copied to ignored `.env`; defaults are local-only. Set `CODEMATCH_COOKIE_SECURE=true` behind HTTPS. Keep `.env`, credentials, and tokens out of source control.

## UI-2.2 Landing Page preview

The approved Concept A implementation is available at the development-only route `/__preview/landing`; the production root and Marketplace routes are unchanged pending visual review. To preview against an isolated PostgreSQL-backed application without colliding with the regular local stack, start the E2E Compose project on separate loopback ports, then run Vite:

```powershell
$env:CODEMATCH_E2E_API_PORT = '18081'
$env:CODEMATCH_E2E_POSTGRES_PORT = '15434'
docker compose --project-name codematch-ui22-e2e -f docker-compose.e2e.yml up -d --build
$env:CODEMATCH_API_PROXY_TARGET = 'http://127.0.0.1:18081'
$env:VITE_API_BASE_URL = '/api/v1'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/__preview/landing`. The API preview uses actual public Learning Request responses. Screenshot test data is synthetic and confined to the `codematch-ui22-e2e` PostgreSQL volume; the capture utility is `scripts/capture-ui22.mjs`. See [`docs/ui-refactor/ui-2/ui-2.2/IMPLEMENTATION_EVIDENCE.md`](docs/ui-refactor/ui-2/ui-2.2/IMPLEMENTATION_EVIDENCE.md) for screenshots and verification results.

## M2 request behavior

Learners can save drafts, publish, edit, close, and browse their requests. Discovery returns OPEN requests with search, controlled-skill, level, format, VND range/unit, CV requirement, sort, and pagination filters. Budget range filters require a unit so per-hour/per-session/total amounts are not compared as interchangeable. Saved requests are private to the signed-in learner and may still be opened when subsequently closed.

## M3 proposals and private CVs

Developers with a profile can submit one active proposal per OPEN request, edit or withdraw it before selection, and manage private PDF CVs (maximum 5 MB). CV bytes are stored in the Compose-only `private_cvs` volume at `/var/lib/codematch/private-cvs`, outside static resources; a local JVM uses `%USERPROFILE%\\.codematch\\private-cvs` by default. Only the CV owner and the learner who owns an associated proposal may download it through authenticated endpoints. A CV cannot be deleted while a submitted proposal references it. Closing a request prevents new proposals; existing proposals remain reviewable and downloadable by authorized participants.

Learners can select one submitted proposal for an OPEN request. Selection confirms a match, changes the request status to `MATCHED`, and prevents further proposals or changes to submitted proposals for that request. Other proposals remain stored with their original `SUBMITTED` status; selection status is reported separately as pending, selected, not selected, or withdrawn. Selecting the same proposal again is idempotent; selecting another proposal returns a conflict. Only the request owner and selected developer can view match details.

## Project documentation

### Security and moderation status

M5 adds configurable API rate limits, database-backed admin authorization, reports, request hiding, account suspension and security audit events through Flyway V6. Admin accounts require explicit database provisioning; no default credentials are created. GitHub Actions runs browser E2E against an isolated React, Spring Boot and PostgreSQL stack and collects service logs on failure. Rate limits are process-local and audit retention is manual, so production deployment needs shared rate limiting and a retention job.

See [architecture](docs/ARCHITECTURE.md), [API specification](docs/API_SPEC.md), [data model](docs/DATA_MODEL.md), [security model](docs/SECURITY_MODEL.md), and [test strategy](docs/TEST_STRATEGY.md).

### M6 pilot readiness (local preparation only)

M6 adds an admin-only aggregate pilot overview, request correlation and operational metrics, production/staging profile templates, and a candidate Caddy + Spring + PostgreSQL same-origin Compose topology. The topology has not been deployed. Creating paid/public infrastructure, a domain, DNS, certificates or a pilot is blocked on explicit owner approval. CV files and database persistence need independently encrypted off-host backups and a restore-tested recovery procedure before any participant data is accepted. See [pilot runbook](docs/PILOT_RUNBOOK.md), [validation plan](docs/PILOT_VALIDATION_PLAN.md), and [deployment options and cost estimate](docs/M6_DEPLOYMENT_PLAN.md).

For the real frontend-to-backend browser test, start the isolated `docker-compose.e2e.yml` services, then set `$env:CODEMATCH_REAL_E2E='1'`, `$env:CODEMATCH_E2E_COMPOSE_PROJECT='codematch-m6-e2e'`, `$env:VITE_API_BASE_URL='/api/v1'`, and `$env:CODEMATCH_API_PROXY_TARGET='http://127.0.0.1:18080'` before `npm run test:e2e`. This real test validates login/logout, CSRF-backed flows, private-CV download after API restart, and authorization against PostgreSQL. The two `scripts/bounded-*-smoke.mjs` scripts measure small read-only and concurrent marketplace workflows against that isolated stack. Run `scripts/backup-restore-smoke.ps1` only for its disposable synthetic-data restore check.
