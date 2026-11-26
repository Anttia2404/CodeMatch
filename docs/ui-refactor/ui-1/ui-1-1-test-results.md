# UI-1.1 Verification Results

Run on 2026-11-26 on `feature/ui-1-bordful-refactor`.

## Isolated data and API

- Docker Engine: Linux containers available.
- Compose project: `codematch-m5-e2e-local`.
- PostgreSQL: isolated `postgres:17-alpine`, host bound to `127.0.0.1:15433`; Compose healthcheck reports healthy.
- API: isolated Spring Boot container at `127.0.0.1:18080`; `/actuator/health` returned `UP`.
- Synthetic fixture: 15 published Learning Requests created through the real API after registering/logging in a random synthetic learner. Fixtures vary skills, level, budget, description/title length, format, and CV requirement. The account password is generated in memory and is not written to a file.
- The E2E suite creates additional synthetic users, a request, proposal, and PDF. After verification, only the isolated UI E2E database and private-CV volumes were deleted and recreated; the final isolated database was reseeded with exactly 15 visual fixtures. Development PostgreSQL and Windows PostgreSQL were not used or altered.

## Frontend checks

| Command | Result |
|---|---|
| `npm run build` | PASS; TypeScript and Vite production build completed. |
| `npm run lint` | PASS; no ESLint findings. |
| `npm test` | PASS; 6 files, 26 tests passed. |
| `CODEMATCH_REAL_E2E=1` with isolated frontend/API URLs; `npm run test:e2e` | PASS; 5 tests passed, 0 failed, 0 skipped. Includes the real-browser PostgreSQL workflow and four existing matching-flow tests. |

One initial concurrent Vitest run timed out one test while build, lint, Maven, browser captures, and Vitest were competing for resources; the standalone rerun and the final frontend test run passed all 26 tests.

## Backend checks

- Runtime: OpenJDK 21.0.4 from IntelliJ IDEA's bundled JBR at `C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr`.
- The shell's default Java is Java 8. The verified Maven invocation set `JAVA_HOME` and `PATH` for that command only; no system-wide Java settings were changed.
- Command: `$jdk21='C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr'; $env:JAVA_HOME=$jdk21; $env:PATH="$jdk21\bin;$env:PATH"; .\mvnw.cmd -B verify`
- Result: PASS; 43 backend tests, 0 failures, 0 errors, 0 skipped. This includes PostgreSQL/Testcontainers integration tests.
- An initial `verify` invocation under the default Java 8 failed before running tests due to an unsupported class-file version. Re-running the same wrapper command with the discovered JBR Java 21 completed successfully.

## Playwright visual/API audit

Command: `$env:CODEMATCH_BASE_URL='http://127.0.0.1:5175'; node docs/ui-refactor/ui-1/capture-ui-1-1.mjs`.

- Marketplace returned all 15 fixtures in one 20-item page at all four viewports.
- Search `Spring Boot`: 1 real API result at all four viewports.
- Beginner filter: 5 real API results at all four viewports. The mobile navigation/filter capture also confirmed an expanded menu and 5 intermediate-level results.
- Non-matching search: empty state visible at all four viewports.
- Selected request detail: API returned 200; selected detail visible at all four viewports.
- Horizontal overflow: none in marketplace or selected detail at any viewport.
- Browser page errors: zero at every viewport.
- Discovery, skill, and detail API responses returned 200. Anonymous `/api/v1/auth/me` returned 401, expected for the signed-out screenshot context.
- Full response/geometry evidence: [ui-1-1-capture-audit.json](ui-1-1-capture-audit.json).

## Reproduction on Windows PowerShell

Start the isolated services and frontend in terminal 1:

```powershell
$env:CODEMATCH_E2E_CORS_ORIGIN = 'http://127.0.0.1:5175'
docker compose -f docker-compose.e2e.yml up -d --build
$env:CODEMATCH_API_PROXY_TARGET = 'http://127.0.0.1:18080'
npm run dev -- --host 127.0.0.1 --port 5175
```

In terminal 2, the seed script requires the Compose `api` and `postgres` services to be running and the isolated request table to be empty. It refuses other frontend/API origins and refuses to append to an existing fixture database.

```powershell
$env:CODEMATCH_BASE_URL = 'http://127.0.0.1:5175'
$env:CODEMATCH_VISUAL_API_ORIGIN = 'http://127.0.0.1:18080'
node docs/ui-refactor/ui-1/seed-visual-data.mjs
node docs/ui-refactor/ui-1/capture-ui-1-1.mjs
```

To seed a new set after tests have added rows or CV files, reset only this isolated Compose project with `docker compose -f docker-compose.e2e.yml down -v`, start it again, and then seed. This removes only its `postgres_data` and `private_cvs` volumes; it does not touch the development database.

## Final local state

The isolated Compose stack remains up with exactly the 15 visual fixtures and the generated screenshots are in this directory. No code was deployed and no remote branch was merged.
