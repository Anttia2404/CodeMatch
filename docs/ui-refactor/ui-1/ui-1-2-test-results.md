# UI-1.2 Verification Results

Run on 2026-11-26 on `feature/ui-1-bordful-refactor`. Screenshots use 15 synthetic Learning Requests on the isolated Compose project `codematch-m5-e2e-local`; the development PostgreSQL service and Windows PostgreSQL were not used for seeding.

## Quality gates

| Check | Command | Result |
|---|---|---|
| Frontend production build | `npm run build` | PASS; TypeScript and Vite production bundle completed. |
| Frontend lint | `npm run lint` | PASS; no ESLint findings. |
| Frontend unit tests | `npm test` | PASS; 6 files, 26 passed, 0 failed, 0 skipped. |
| Real-browser E2E | Set `CODEMATCH_REAL_E2E=1`, `CODEMATCH_E2E_BASE_URL=http://127.0.0.1:5175`, `CODEMATCH_E2E_API_URL=http://127.0.0.1:18080`, `CODEMATCH_E2E_COMPOSE_PROJECT=codematch-m5-e2e-local`, `CODEMATCH_E2E_CORS_ORIGIN=http://127.0.0.1:5175`, `VITE_API_BASE_URL=/api/v1`, `CODEMATCH_API_PROXY_TARGET=http://127.0.0.1:18080`; then `npm run test:e2e` | PASS; 5 passed, 0 failed, 0 skipped. Includes the PostgreSQL-backed real browser flow and 4 matching authorization/interaction tests. |
| Backend compilation, unit/integration tests and verify | Java 21 command below, then `.\mvnw.cmd -B verify` from `backend` | PASS; Maven 3.10.1, 43 passed, 0 failures, 0 errors, 0 skipped. PostgreSQL Testcontainers integration classes ran. |

Java invocation in PowerShell (process-local Java configuration only):

```powershell
$jdk21='C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr'
$env:JAVA_HOME=$jdk21
$env:Path="$jdk21\bin;$env:Path"
java -version
.\mvnw.cmd -version
.\mvnw.cmd -B verify
```

Runtime versions: OpenJDK 21.0.4 (JetBrains JBR), Maven Wrapper 3.10.1, Node 22.19.0, npm from the installed Node distribution.

## Database, migrations, and API

- Compose services: PostgreSQL 17 Alpine at host `127.0.0.1:15433`, Spring Boot at `127.0.0.1:18080`; both healthy.
- `GET http://127.0.0.1:18080/actuator/health`: `200`, status `UP`.
- The isolated `flyway_schema_history` query returned versions 1–6, each `success = true`.
- `learning_requests` count after cleanup/reseed: 15. The seeding utility explicitly refuses to write unless the isolated request table is empty and is locked to the local UI frontend/API ports.
- The UI's Vite same-origin API proxy at `http://127.0.0.1:5175` returned HTTP 200 for discovery, skill, detail, search, and filtered-discovery requests. Anonymous `/auth/me` returned 401 as expected.

## Playwright visual/API capture

Command: `$env:CODEMATCH_BASE_URL='http://127.0.0.1:5175'; node docs/ui-refactor/ui-1/capture-ui-1-1.mjs`.

- Bordful and CodeMatch were captured at 1440×900, 1280×800, 768×1024, and 390×844.
- Each CodeMatch viewport showed all 15 synthetic fixtures; selected request detail was visible.
- Search returned 1 API result; the Beginner filter returned 5; a non-matching query showed the empty state.
- Mobile menu opened (`aria-expanded=true`); intermediate filter returned 5; active filter clear restored all 15.
- Horizontal overflow: 0 of 4 viewports, both marketplace and selected detail. Browser page errors: 0. Non-401 API failures: 0.
- Reference and implementation computed styles for desktop/mobile row, mark, title, metadata, budget/time, filter pill, placeholder, and bottom navigation are in [computed-styles-comparison.md](computed-styles-comparison.md). Full computed colors, borders, shadows, and bounds are in [ui-1-2-computed-styles.json](ui-1-2-computed-styles.json).

Full viewport and response evidence is in [ui-1-1-capture-audit.json](ui-1-1-capture-audit.json). Despite the inherited filename, this audit was regenerated for UI-1.2.

## Reproduction

Start the isolated PostgreSQL/API project and frontend in separate PowerShell sessions:

```powershell
$env:CODEMATCH_E2E_CORS_ORIGIN='http://127.0.0.1:5175'
docker compose --project-name codematch-m5-e2e-local -f docker-compose.e2e.yml up -d --build
$env:CODEMATCH_API_PROXY_TARGET='http://127.0.0.1:18080'
npm run dev -- --host 127.0.0.1 --port 5175
```

Seed only the isolated, empty test database and capture:

```powershell
$env:CODEMATCH_BASE_URL='http://127.0.0.1:5175'
$env:CODEMATCH_VISUAL_API_ORIGIN='http://127.0.0.1:18080'
node docs/ui-refactor/ui-1/seed-visual-data.mjs
node docs/ui-refactor/ui-1/capture-ui-1-1.mjs
node docs/ui-refactor/ui-1/capture-computed-styles-ui-1-2.mjs
```

The E2E run briefly populated its dedicated volume with other synthetic workflow records. Afterward that Compose project's volumes alone were removed and recreated, then the 15 visual requests were seeded again. No other PostgreSQL service or volume was changed.

## Notes

Maven emitted a non-blocking HTTP 401 while checking optional Flyway community-prefix metadata from GitHub Packages. Required dependencies were available; the complete Maven verify lifecycle succeeded with no skipped tests. The first fixture seed attempt raced API startup after container recreation and failed before inserting rows; after API health reached `UP`, seeding succeeded once with 15 records.
