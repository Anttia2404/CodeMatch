# Test strategy

## Pyramid
- Backend unit tests for lifecycle rules and validation.
- PostgreSQL integration/repository tests via Testcontainers for constraints, ownership, migrations, and transactions.
- Frontend component tests for forms, accessible interaction, and async/loading/empty/error states.
- Playwright E2E across learner request → developer proposal → learner acceptance, CV policy, and denial paths.

## Required security/concurrency coverage
IDOR, proposal ownership, duplicate active proposal, own-request proposal, non-open request submission, forbidden CV download, malformed/oversized/non-PDF upload, request owner/moderator CV access, concurrent acceptance, invalid transition, and sensitive response/log leakage.

## M1–M3 checks
The PostgreSQL Testcontainers integration suite verifies migrations/session tables/seed skills, health, identity/profile authorization, request privacy/lifecycle/discovery, saved requests, proposal lifecycle and concurrent duplicate prevention, CV ownership and scoped downloads, PDF content/size validation, required CV behavior, closure semantics, CSRF, and error privacy. Security slice tests cover deny-by-default and CORS. Frontend Vitest covers request workflows and API-backed states; the API client uses credentials and CSRF handling. Live HTTP flow verification is separate from mocked React tests.

For Windows verification, run `npm ci`, `npm run build`, `npm run lint`, and `npm test` at the root. Set Java 21 in the current PowerShell session and run `backend\mvnw.cmd -B compile`, `backend\mvnw.cmd -B test`, and `backend\mvnw.cmd -B verify` from the root (or use `Push-Location backend` and `./mvnw.cmd`). Ensure Docker Desktop's Linux engine is running before interpreting integration results; Maven reports explicitly skipped Testcontainers tests when no engine is available. If the machine default Java is not 21, explicitly set `$env:JAVA_HOME` and prepend its `bin` to `$env:Path` before each Maven command.

## M1 local verification (2026-11-17)
- Java 21.0.4 (IntelliJ JBR) and Maven Wrapper 3.3.4 using Maven 3.10.1: `mvnw compile`, `mvnw test`, and `mvnw verify` passed.
- Maven totals: 9 tests, 0 failures, 0 errors, 0 skipped (2 security/CORS slice tests and 7 PostgreSQL Testcontainers integration tests).
- Frontend: `npm run build`, `npm run lint`, and `npm test` passed; Vitest totals 7 tests across 3 files, 0 failures. `npm install` reported zero vulnerabilities.
- Docker Desktop 28.5.1 uses the Linux engine. Compose PostgreSQL 17 is healthy at `127.0.0.1:5433` → container `5432`; Windows PostgreSQL 18 continues on port 5432. The Compose API health endpoint returned `UP`.
- Compose database Flyway history contains successful V1 and V2 entries; V2 created the account/profile/skills/session schema and 11 skills.
- Browser verification at `http://localhost:5173` used the actual frontend to register and log in, then create and publicly display a profile through the running API. Direct live HTTP verification also checked skills, `/auth/me`, profile update, logout/session invalidation, health, and credentialed CORS. Temporary smoke accounts were removed afterward. `127.0.0.1:5173` is not the configured allowed CORS origin; use the documented `localhost:5173` URL.

## M2 local verification (2026-11-17)
- Java 21.0.4 and Maven Wrapper: `mvnw -B compile`, `mvnw -B test`, and `mvnw -B verify` passed. Test totals: 19 run, 0 failures, 0 errors, 0 skipped (10 M2 learning-request integration, 7 M1 PostgreSQL integration, 2 security/CORS slice tests). Testcontainers started PostgreSQL 17 on Docker Desktop's Linux engine; all three Flyway migrations validated and applied.
- Frontend `npm run build`, `npm run lint`, and `npm test -- --reporter=dot` passed. Vitest: 13 tests in 4 files, 0 failures. One initial run timed out in the long form-interaction test; its timeout was raised to 15 seconds and the rerun passed.
- Compose PostgreSQL remained healthy at `127.0.0.1:5433` and Windows PostgreSQL 18 remained on 5432. After `docker compose up -d --build postgres api`, both Compose services were healthy; live `/actuator/health` returned `UP`, public request discovery returned a paged JSON response, and Flyway history showed V1–V3 successful with all request tables present.
- Live authenticated API flow passed: register/login, create DRAFT, publish OPEN, retrieve through public discovery, save, close, and confirm the closed request remains visible in saved requests. The temporary smoke users and their requests/session records were removed. The running React app at `http://localhost:5173` loaded the real discovery route, skills catalog, API health state, and API-backed empty results.

## M3 local verification (2026-11-18)
- Java 21.0.4 and Maven Wrapper 3.3.4 / Maven 3.10.1 are required. Testcontainers uses Docker Desktop's Linux engine; required integration tests must report zero skips.
- M3 integration tests cover Flyway V4, proposal/CV workflows, authorization, actual PDF validation, proposal close semantics, CSRF, and concurrent duplicate submission.
- Frontend build/lint/Vitest tests cover M3 routes and API wiring. Component mocks do not establish live frontend/backend connectivity; perform and record a separate live flow against Compose.
- Final local checks: `mvnw -B compile`, `mvnw -B test`, and `mvnw -B verify` all passed on Java 21.0.4 / Maven 3.10.1. Surefire: 25 tests, 0 failures, 0 errors, 0 skipped; ProposalIntegrationTest 6, LearningRequestIntegrationTest 10, PostgresIntegrationTest 7, SecurityConfigurationTest 2. Testcontainers ran PostgreSQL 17.11 on Docker Desktop Linux and applied Flyway V1–V4.
- `npm ci --prefer-offline --no-audit --no-fund`, `npm run build`, `npm run lint`, and `npm test -- --reporter=dot` passed. Vitest: 16 tests in 5 files, 0 failures.
- Live Compose verification: PostgreSQL and API containers healthy; actuator returned `UP`; V4 tables and migration history were present. Live HTTP flow registered learner/developer/unrelated accounts, created and published a CV-required request, uploaded a real PDF, submitted/read/downloaded/edited/withdrew a proposal, confirmed unrelated CV download returns 404, confirmed closure blocks a new proposal (409), deleted the CV after withdrawal, and removed the temporary accounts. Browser attach was unavailable; the live smoke was executed against the real running HTTP API, while frontend components were verified with Vitest.
