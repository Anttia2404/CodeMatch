# UI-1 visual comparison report

## Evidence

Reference and CodeMatch before screenshots are saved beside this report as `reference-*.png` and `before-*.png`. Final screenshots are `after-*.png`. The reference measurement capture is `before-capture-audit.json`; local computed layout, API response and overflow evidence is `after-capture-audit.json`. Recreate local captures with:

```powershell
$env:CODEMATCH_BASE_URL = 'http://127.0.0.1:5174'
node docs/ui-refactor/ui-1/capture-after.mjs
```

This uses installed Playwright/Chromium and a live Vite server. It does not mock API responses.

## Viewport checks

| Viewport | Bordful reference | CodeMatch after | Horizontal overflow | Layout observation |
| --- | --- | --- | --- | --- |
| 1440 × 900 | `reference-desktop-1440x900.png` | `after-desktop-1440x900.png` | No | Three columns; 52px header; filter bar and side panel align closely to the source proportions. |
| 1280 × 800 | `reference-laptop-1280x800.png` | `after-laptop-1280x800.png` | No | Desktop board retained; columns compress without horizontal scroll. |
| 768 × 1024 | `reference-tablet-768x1024.png` | `after-tablet-768x1024.png` | No | Rail/detail collapse and request list fills the content width. |
| 390 × 844 | `reference-mobile-390x844.png` | `after-mobile-390x844.png` | No | Search wraps below the brand; filters scroll horizontally; bottom navigation is fixed. |

## Comparison result

The desktop geometry, header/search placement, toolbar height, rail width, list/detail split, neutral background, compact typography and mobile navigation are close to the reference. At the 1440 viewport the implemented header is 52px tall, the left rail is 216px, and the detail panel occupies the rightmost 400px, matching the inspected source layout. Tablet and mobile use the observed single-column pattern. `after-mobile-detail-error-390x844.png` captures a real API 404 for an intentionally unknown UUID to verify the mobile error panel; it does not add test data.

Screenshot comparison is necessarily limited by the live data difference: the reference displays jobs, while the real CodeMatch API currently returns an empty `content` array and `totalElements: 0`. Therefore there is no honest way to compare populated rows or a real selected-request panel yet. The empty state is styled within the same list region; no fake records were used. See `remaining-differences.md`. This report does not claim pixel-perfect fidelity.

## Live frontend/backend evidence

Playwright received HTTP 200 from the real `/api/v1/skills` and `/api/v1/learning-requests` endpoints through the Vite proxy. Typing `React` in the header search issued `/api/v1/learning-requests?q=React&page=0&size=12&sort=NEWEST` and received HTTP 200 with the database's actual empty result. Anonymous `/api/v1/auth/me` returned HTTP 401 as expected; the UI stayed usable. No uncaught page errors were observed.

## Quality gate results

- `npm run build`: passed.
- `npm run lint`: passed.
- `npm test`: 26 tests passed across 6 files.
- Playwright E2E against the running CodeMatch frontend and isolated PostgreSQL stack: 5 passed, 0 skipped. This includes the real-browser flow that creates an account, learning request, developer proposal and synthetic CV, selects a match, checks denied access, restarts the API container and verifies health.
- Backend commands with Java 21.0.8: `mvnw.cmd -B -ntp compile`, `mvnw.cmd -B -ntp test`, `mvnw.cmd -B -ntp verify`; each passed. The test and verify runs each reported 43 tests, 0 failures, 0 errors, 0 skipped, including PostgreSQL/Testcontainers integration tests.

To reproduce the real backend E2E on Windows PowerShell without using the default Vite port 5173:

```powershell
# Terminal 1: isolated test database/API and frontend on a free port
$env:CODEMATCH_E2E_CORS_ORIGIN = 'http://127.0.0.1:5175'
docker compose -f docker-compose.e2e.yml up -d --build
$env:CODEMATCH_API_PROXY_TARGET = 'http://127.0.0.1:18080'
npm run dev -- --host 127.0.0.1 --port 5175

# Terminal 2: run the complete Playwright suite against that frontend/API
$env:CODEMATCH_E2E_BASE_URL = 'http://127.0.0.1:5175'
$env:CODEMATCH_E2E_API_URL = 'http://127.0.0.1:18080'
$env:CODEMATCH_E2E_COMPOSE_PROJECT = 'codematch-m5-e2e-local'
$env:CODEMATCH_REAL_E2E = '1'
npm run test:e2e
```

The Compose stack uses its own PostgreSQL port 15433 and stores only synthetic integration-test data. `playwright.config.ts` uses the external base URL when set and then does not start another web server.
