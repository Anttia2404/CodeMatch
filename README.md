# CodeMatch

CodeMatch is a Vietnamese peer-to-peer marketplace for one-on-one coding instruction. M2 includes account registration/login, developer profiles, learner request creation and lifecycle management, public request discovery, and saved requests. Proposals and CV handling remain future work.

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

Open `http://localhost:5173`. Request discovery, request details, learner request management, and saved requests call the real API; the health badge is reachability only. Registration, login, account, skill catalog, and developer profile screens also call the real API. Account sessions use an HttpOnly `CMSESSION` cookie and a CSRF token cookie/header; do not store credentials or session IDs in browser storage. Proposals are not implemented yet.

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

The Compose database is available on `127.0.0.1:5433` (container port 5432), avoiding the existing Windows PostgreSQL service on port 5432. The API connects over Compose networking at `postgres:5432`. The integration suite uses Testcontainers and the PostgreSQL 17 Alpine image. A skipped Testcontainers test is not a successful database verification. Compose defaults and the sample password are for local development only, and service ports bind to loopback. Set credentials in the ignored `.env` file for local overrides; never commit it.

## Database and verification

Compose keeps the host PostgreSQL 18 service on port 5432 untouched. Its PostgreSQL 17 development service is available at `127.0.0.1:5433` and the API container reaches it at `postgres:5432`. When running the backend outside Compose, its default datasource points to host port 5433. Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` in the process environment to override it.

The V3 Flyway migration adds learning requests, normalized request skills, and saved requests. V1–V2 create the baseline, users, developer profiles, controlled skills, and JDBC session tables. Run `docker compose up -d --build`, then verify readiness with `docker compose ps` and `docker compose exec postgres pg_isready -U codematch -d codematch`. Use the Java 21 Maven Wrapper commands above; `test` and `verify` run PostgreSQL Testcontainers integration tests and require Docker Desktop's Linux engine. A Docker-less skip is not a passing integration verification.

For local sample credentials, `.env.example` is copied to ignored `.env`; defaults are local-only. Set `CODEMATCH_COOKIE_SECURE=true` behind HTTPS. Keep `.env`, credentials, and tokens out of source control.

## M2 request behavior

Learners can save drafts, publish, edit, close, and browse their requests. Discovery returns OPEN requests with search, controlled-skill, level, format, VND range/unit, CV requirement, sort, and pagination filters. Budget range filters require a unit so per-hour/per-session/total amounts are not compared as interchangeable. Saved requests are private to the signed-in learner and may still be opened when subsequently closed. Proposals, CV upload, matching, and messaging are not implemented.

## Project documentation

See [architecture](docs/ARCHITECTURE.md), [API specification](docs/API_SPEC.md), [data model](docs/DATA_MODEL.md), [security model](docs/SECURITY_MODEL.md), and [test strategy](docs/TEST_STRATEGY.md).
