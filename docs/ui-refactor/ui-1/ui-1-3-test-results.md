# UI-1.3 Verification Results

Date: 2026-11-26. All Learning Request fixtures used for capture are synthetic and exist only in the isolated local test stack; they are not development or production records.

## Quality gates

| Gate | Command | Result |
|---|---|---|
| Frontend production build | `npm run build` | PASS |
| Frontend lint | `npm run lint` | PASS |
| Frontend unit tests | `npm test` | PASS: 6 files, 29 passed, 0 failed, 0 skipped |
| Browser E2E | `npm run test:e2e` with `CODEMATCH_REAL_E2E=1`, frontend `http://127.0.0.1:5175`, API `http://127.0.0.1:18080`, isolated Compose project `codematch-m5-e2e-local` | PASS: 5 passed, 0 failed, 0 skipped (4 matching/authorization checks plus 1 real full-stack browser flow) |
| Backend Maven verify | From `backend`, set process-local `JAVA_HOME` to `C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2024.2.4\jbr`, prepend its `bin` to `PATH`, then run `java -version` and `.\mvnw.cmd -B verify` | PASS: OpenJDK 21.0.4, Maven Wrapper 3.10.1, 43 passed, 0 failures, 0 errors, 0 skipped |
| Selected detail visual capture | `node docs/ui-refactor/ui-1/capture-ui-1-3-detail.mjs` | PASS at 1440×900, 1280×800, 768×1024, 390×844; reference and CodeMatch screenshots plus computed styles saved. No page errors or horizontal overflow reported. |

The real browser E2E run exercised PostgreSQL-backed registration/login/logout, profile, request, proposal, private CV upload/access after API restart, owner proposal handling/matching and denied access. The dedicated E2E database was reset and reseeded with exactly 15 synthetic Learning Requests after the mutating E2E run. It remained isolated from Windows PostgreSQL and the development database.

## Authorization state coverage

Unit coverage exercises anonymous, authenticated developer with profile, request owner, and authenticated learner without developer profile. Anonymous actions route through existing login paths; the owner sees proposal management, a developer with a profile gets the proposal action, and a learner without a profile gets profile setup. No role or backend behavior was changed.

## Notes

Testcontainers/PostgreSQL integration tests ran as part of Maven verification; zero tests were skipped. Maven emitted a non-blocking optional Flyway metadata lookup 401 warning. During teardown of Testcontainers, the Spring Session cleanup scheduler logged connection errors after its ephemeral PostgreSQL containers had stopped; the related integration suites completed successfully, and the full build exited 0. See [visual review](ui-1-3-visual-review.md) and [computed styles](ui-1-3-computed-styles.json).
