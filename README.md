# CodeMatch

CodeMatch is a Vietnamese peer-to-peer marketplace for one-on-one coding instruction. M0.5 stabilizes the local foundation; authentication and marketplace workflows are intentionally not implemented yet.

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

In a second PowerShell window, set Java 21 for that shell only, then run backend checks from the repository root:

```powershell
Push-Location backend
$env:JAVA_HOME = 'C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd -version
.\mvnw.cmd -B -DskipTests compile
.\mvnw.cmd -B test
.\mvnw.cmd -B verify
Pop-Location
```

To confirm Flyway created the schema history table:

```powershell
docker compose exec postgres psql -U codematch -d codematch -c "select version, success from flyway_schema_history order by installed_rank;"
```

The Compose database is available on `127.0.0.1:5433` (container port 5432), avoiding the existing Windows PostgreSQL service on port 5432. The API connects over Compose networking at `postgres:5432`. The integration suite uses Testcontainers and the PostgreSQL 17 Alpine image. A skipped Testcontainers test is not a successful database verification. Compose defaults and the sample password are for local development only, and service ports bind to loopback. Set credentials in the ignored `.env` file for local overrides; never commit it.

## Current UI data

The discovery cards are static illustrative local demo data. They do not come from the backend API. The UI checks `/actuator/health` and reports whether the API is reachable; health status does not imply that marketplace endpoints are implemented.

## Project documentation

See [architecture](docs/ARCHITECTURE.md), [security model](docs/SECURITY_MODEL.md), and [test strategy](docs/TEST_STRATEGY.md).
