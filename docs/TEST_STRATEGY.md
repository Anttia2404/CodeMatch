# Test strategy

## Pyramid
- Backend unit tests for lifecycle rules and validation.
- PostgreSQL integration/repository tests via Testcontainers for constraints, ownership, migrations, and transactions.
- Frontend component tests for forms, accessible interaction, and async/loading/empty/error states.
- Playwright E2E for the learner selection flow, server conflict handling, and participant match views.

## Required security/concurrency coverage
IDOR, proposal ownership, duplicate active proposal, own-request proposal, non-open request submission, forbidden CV download, malformed/oversized/non-PDF upload, request owner/moderator CV access, concurrent selection, invalid transition, and sensitive response/log leakage.

## M1–M4 checks
The PostgreSQL Testcontainers integration suite verifies migrations/session tables/seed skills, health, identity/profile authorization, request privacy/lifecycle/discovery, saved requests, proposal lifecycle and concurrent duplicate prevention, CV ownership and scoped downloads, PDF content/size validation, required CV behavior, closure semantics, CSRF, match selection, row-lock concurrency, composite foreign keys, idempotency, participant visibility, and error privacy. Security slice tests cover deny-by-default and CORS. Frontend Vitest covers request workflows and API-backed states; the API client uses credentials and CSRF handling. Playwright runs the critical browser interaction against a real browser, while live HTTP verification against Compose separately validates PostgreSQL and the API end to end.

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

## M4 verification (2026-11-18)
- PostgreSQL Testcontainers tests apply V1–V5 and cover successful selection, invalid/cross-request/withdrawn/closed proposals, request ownership, same-selection idempotency, competing concurrent selections, match visibility, CSRF, post-match immutability, database composite foreign keys, and retained unselected proposals.
- `mvnw -B compile`, `mvnw -B test`, and `mvnw -B verify` passed on Java 21.0.4 with Maven Wrapper 3.3.4 / Maven 3.10.1. Surefire: 34 tests, 0 failures, 0 errors, 0 skipped; Testcontainers used Docker Desktop's Linux engine and PostgreSQL 17.11.
- `npm ci --prefer-offline --no-audit --no-fund`, `npm run build`, `npm run lint`, and `npm test -- --reporter=dot` passed. Vitest: 22 tests in 5 files, 0 failures. `npm run test:e2e`: 4 Playwright tests passed in Chromium. These browser tests mock API responses; they verify browser behavior, not the live API.
- Compose PostgreSQL stayed healthy at `127.0.0.1:5433` → container port 5432; the Windows PostgreSQL 18 service on 5432 was left untouched. Rebuilding the API applied Flyway V5 successfully. `docker compose ps` showed both services healthy and `/actuator/health` returned `UP`.
- Live HTTP verification against the rebuilt Compose API registered temporary accounts, created and published a request, submitted two proposals, selected one, verified MATCHED and CONFIRMED states, confirmed repeat selection is idempotent, confirmed selecting the alternative returns 409, and confirmed the selected developer can read the match while the unselected and unrelated accounts receive 404. Temporary accounts were deleted. This is a live backend API smoke, separate from mocked browser tests.

## M5 required checks
- Unit tests cover rate-limit windows, concurrency, 429 responses and `Retry-After`.
- PostgreSQL Testcontainers must apply V6 and verify moderation persistence, default non-admin behavior, server-side admin authorization, and audit events.
- Mocked Playwright tests are not real integration evidence. M5 requires browser tests against the React app, Spring API, Flyway and PostgreSQL with deterministic isolated test data.
- Report exact test totals and skip counts; Docker/Testcontainers failures must remain visible.
- Real browser run on Windows: `docker compose -p codematch-m5-e2e-local -f docker-compose.e2e.yml up -d --build --wait`, then set `$env:CODEMATCH_REAL_E2E='1'` and `$env:VITE_API_BASE_URL='http://127.0.0.1:18080/api/v1'`, run `npm run test:e2e`, and clean only that isolated stack with `docker compose -p codematch-m5-e2e-local -f docker-compose.e2e.yml down --volumes --remove-orphans`. The separate Compose project owns separate ports and volumes; do not substitute the normal development Compose project.

## M5 verification results (2026-11-18)
- Environment: Eclipse Temurin JDK 21.0.4; Maven Wrapper 3.3.4 using Maven 3.10.1; Docker Desktop 4.49.0 / Linux Engine 28.5.1; isolated PostgreSQL 17.11.
- Backend: `./mvnw -B compile`, `./mvnw -B test`, and `./mvnw -B verify` passed. The final verify run compiled the application and ran 41 tests: 0 failures, 0 errors, 0 skipped. Testcontainers PostgreSQL integration tests passed; the isolated Compose database applied Flyway V1–V6 successfully.
- Frontend: `npm run build`, `npm run lint`, and `npm test` passed. Vitest reported 22 tests in 5 files, 0 failures. With `CODEMATCH_REAL_E2E=1`, the isolated Compose stack, and one worker, `npx playwright test --workers=1 --reporter=line` passed 5 browser tests (4 matching flows and 1 real React/API/PostgreSQL flow), 0 failures, 0 skipped.
- The real browser flow created separate learner, developer, and unrelated accounts; published/discovered a request, uploaded a synthetic PDF, submitted a proposal, downloaded the authorized CV, confirmed the match, verified unrelated proposal access returned 404, and verified the live actuator health endpoint returned `UP`. No application API mocks were used in this flow.
- `npm audit --omit=dev` reported 0 production dependency vulnerabilities. Full `npm audit` reports 11 high development-tool dependency findings through `picomatch@4.0.7`; see `SECURITY_MODEL.md` and `DECISION_LOG.md` for the advisory and safe-upgrade limitation.
