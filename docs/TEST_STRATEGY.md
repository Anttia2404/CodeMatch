# Test strategy

## Pyramid
- Backend unit tests for lifecycle rules and validation.
- PostgreSQL integration/repository tests via Testcontainers for constraints, ownership, migrations, and transactions.
- Frontend component tests for forms, accessible interaction, and async/loading/empty/error states.
- Playwright E2E across learner request → developer proposal → learner acceptance, CV policy, and denial paths.

## Required security/concurrency coverage
IDOR, proposal ownership, duplicate active proposal, own-request proposal, non-open request submission, forbidden CV download, malformed/oversized/non-PDF upload, request owner/moderator CV access, concurrent acceptance, invalid transition, and sensitive response/log leakage.

## M0/M0.5 checks
The Vite build, ESLint, and Vitest cover Vietnamese request discovery, search, save/empty state, and the API health client. Backend tests cover deny-by-default API security, configured CORS preflight, and a Testcontainers PostgreSQL integration path that verifies Flyway schema history, SQL access, and the actuator health endpoint. Docker-less runs explicitly skip Testcontainers and do not count as database verification. Playwright E2E remains a later milestone.

For Windows verification, run `npm ci`, `npm run build`, `npm run lint`, and `npm test` at the root. Set Java 21 in the current PowerShell session and run `backend\mvnw.cmd -B -DskipTests compile`, `backend\mvnw.cmd -B test`, and `backend\mvnw.cmd -B verify` from the root (or use `Push-Location backend` and `./mvnw.cmd`). Ensure Docker Desktop's Linux engine is running before interpreting integration results; Maven reports explicitly skipped Testcontainers tests when no engine is available.

## M0.5 workstation result (2026-11-17)
- `npm ci`, `npm run build`, `npm run lint`, `npm test`: passed; four frontend tests passed; `npm audit`: zero vulnerabilities.
- Java 21.0.4 (IntelliJ JBR) with Maven Wrapper 3.3.4 / Maven 3.10.1: compile passed; `test` and full `verify` each ran 4 tests with 0 failures and 0 skips (2 security/CORS tests, 2 PostgreSQL integration tests).
- Docker Desktop Engine 28.5.1 reports Linux. Compose PostgreSQL 17 container is healthy at host `127.0.0.1:5433` → container `5432`; the pre-existing Windows PostgreSQL 18 listener on host port 5432 was left untouched.
- Flyway applied migration `V1__baseline` successfully. The integration test verified one successful Flyway history row and SQL query access. The Compose API container is healthy, and the live actuator endpoint returned `UP`.
- Real local HTTP verification fetched the Vite frontend at `http://localhost:5173/`, then queried the API health URL with frontend Origin `http://localhost:5173`; response was HTTP 200 with matching `Access-Control-Allow-Origin` and health `UP`.
