# UI-2.2 Landing Page Implementation Evidence

**Status:** Visual Approval Gate. The production `/` route and routing migration remain unchanged. The implementation is available at the development-only route `/__preview/landing`.

## Local preview

Requirements: Java 21, Node.js/npm, Docker Desktop using Linux containers.

From PowerShell at the repository root:

```powershell
$env:CODEMATCH_E2E_API_PORT = '18081'
$env:CODEMATCH_E2E_POSTGRES_PORT = '15434'
docker compose --project-name codematch-ui22-e2e -f docker-compose.e2e.yml up -d --build
```

Wait for `api` and `postgres` to report healthy. Then run the Vite preview with its API proxy pointed at the isolated application container:

```powershell
$env:CODEMATCH_API_PROXY_TARGET = 'http://127.0.0.1:18081'
$env:VITE_API_BASE_URL = '/api/v1'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/__preview/landing`. The preview route is guarded by Vite's `import.meta.env.DEV` and is not registered in production builds. The `/` Marketplace route and existing Request Detail routes are unchanged.

The screenshot capture utility is `scripts/capture-ui22.mjs`. It uses the isolated E2E API and, only if that database has no open request, creates one clearly labelled synthetic visual-test request through the application UI. It does not target the Windows PostgreSQL service or production. The synthetic record is shown in populated screenshots and stays in the named local Compose volume until that volume is intentionally removed.

## Screenshot evidence

Prototype screenshots are captured before implementation from the approved Concept A prototype. Integrated screenshots are from the React/Vite implementation with its real API request preview populated from the isolated PostgreSQL-backed application. `responsive-a11y-report.json` records measured document widths and axe results.

| Viewport | Concept A before | Concept A refined prototype | Integrated app first viewport | Integrated app full page |
|---|---|---|---|---|
| Desktop 1440 × 900 | [before/after](screenshots/concept-a-before-after-desktop-1440x900.png) | [fold](screenshots/concept-a-after-desktop-1440x900-fold.png) · [full](screenshots/concept-a-after-desktop-1440x900-full.png) | [fold](screenshots/integrated-desktop-1440x900-fold.png) | [full](screenshots/integrated-desktop-1440x900-full.png) |
| Laptop 1280 × 800 | — | [fold](screenshots/concept-a-after-laptop-1280x800-fold.png) · [full](screenshots/concept-a-after-laptop-1280x800-full.png) | [fold](screenshots/integrated-laptop-1280x800-fold.png) | [full](screenshots/integrated-laptop-1280x800-full.png) |
| Tablet 768 × 1024 | — | [fold](screenshots/concept-a-after-tablet-768x1024-fold.png) · [full](screenshots/concept-a-after-tablet-768x1024-full.png) | [fold](screenshots/integrated-tablet-768x1024-fold.png) | [full](screenshots/integrated-tablet-768x1024-full.png) |
| Mobile 390 × 844 | [before/after](screenshots/concept-a-before-after-mobile-390x844.png) | [fold](screenshots/concept-a-after-mobile-390x844-fold.png) · [full](screenshots/concept-a-after-mobile-390x844-full.png) | [fold](screenshots/integrated-mobile-390x844-fold.png) | [full](screenshots/integrated-mobile-390x844-full.png) |

Additional states: [mobile navigation](screenshots/integrated-mobile-navigation-390x844.png), [marketplace error](screenshots/integrated-marketplace-error-1440x900.png), [marketplace empty](screenshots/integrated-marketplace-empty-1440x900.png).

Prototype-to-integration comparisons: [desktop](screenshots/side-by-side-desktop-1440x900.png) · [mobile](screenshots/side-by-side-mobile-390x844.png).

## Behavior and data

- Hero content and role-specific CTAs follow the approved Concept A copy and existing CodeMatch routes.
- The hero product illustration is explicitly labelled as an illustration. It is not represented as actual user activity or a real request/proposal.
- Marketplace preview requests open Learning Requests from the existing backend API. The populated state uses a synthetic record created only in the isolated Compose database.
- Empty and server-error states show explicit status and retry behavior. No sample listings are substituted for failed or empty API results.
- Account-aware navigation uses the current authentication query. Existing role and authorization enforcement stays in backend services and existing application routes.
- `src/App.tsx` adds only a development preview route; no production route or API contract changes were made.

## Verification record

Run from the repository root unless a backend working directory is stated.

| Check | Command / evidence | Result |
|---|---|---|
| Frontend production build | `npm run build` | PASS |
| Frontend lint | `npm run lint` | PASS |
| Frontend unit tests | `npm test` | PASS — 7 files, 32 tests |
| Browser E2E against isolated PostgreSQL | `CODEMATCH_REAL_E2E=1`, `npm run test:e2e -- --workers=1` | 9 passed, 0 failed, 0 skipped |
| Real API and account flow | `tests/e2e/real-backend.spec.ts` | PASS — real Spring Boot API + PostgreSQL, including Landing Page request visibility, CV persistence through API restart, role actions, denial checks, CSRF and actuator health |
| Accessibility | axe WCAG 2.1 A/AA scan in Playwright and screenshot audit JSON | PASS — 0 violations |
| Responsive overflow | `responsive-a11y-report.json` | PASS — no horizontal overflow at 1440, 1280, 768 or 390 px |
| Backend Maven compilation | `backend`: Java 21 process-local `JAVA_HOME`, `mvnw.cmd -B compile` | PASS |
| Backend Maven tests | `backend`: Java 21 process-local `JAVA_HOME`, `mvnw.cmd -B test` | PASS — 43 tests, 0 failures/errors/skips |
| Backend Maven verification | `backend`: Java 21 process-local `JAVA_HOME`, `mvnw.cmd -B verify` | PASS — `BUILD SUCCESS`, 43 tests, 0 failures/errors/skips |
| Database migrations and runtime health | Isolated Compose project `codematch-ui22-e2e` | PASS — PostgreSQL 17.11 healthy, six Flyway migrations validated/current, 15 application tables, Spring Boot `/actuator/health` UP |

## Visual differences from the prototype

- The integrated page uses the existing Geist typography and neutral/blue CodeMatch tokens instead of prototype-only style tokens.
- The workflow visualization uses CodeMatch terminology and a labelled illustrative example; it is not a live proposal record.
- Marketplace preview is rendered from backend data, so its content and row count depend on the isolated database. The screenshots identify the synthetic row.
- The navigation destinations point to existing CodeMatch routes. Landing page root routing remains a later, separately approved decision.
