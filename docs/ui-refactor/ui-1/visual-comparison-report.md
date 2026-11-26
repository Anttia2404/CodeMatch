# UI-1.1 Visual Comparison Report

## Capture setup

- Reference: [Bordful Jobs](https://bordful.com/jobs), captured live on 2026-11-26 with Playwright.
- CodeMatch: local React/Vite frontend connected to Spring Boot and the isolated PostgreSQL database through the real API.
- Dataset: 15 synthetic learning requests created through authenticated API calls in the `codematch-m5-e2e-local` Compose stack. This data is for visual testing only. The development PostgreSQL service and Windows PostgreSQL service were not used.
- Viewports: 1440 × 900, 1280 × 800, 768 × 1024, and 390 × 844; device scale factor 1.
- The capture audit records response statuses, visible item counts, selected panel geometry, browser errors, and horizontal overflow in [ui-1-1-capture-audit.json](ui-1-1-capture-audit.json).

## Side-by-side screenshots

Each image places Bordful on the left and CodeMatch on the right.

| Viewport | Marketplace | Selected detail |
|---|---|---|
| Desktop 1440 × 900 | [comparison-marketplace-desktop-1440x900.png](comparison-marketplace-desktop-1440x900.png) | [comparison-selected-detail-desktop-1440x900.png](comparison-selected-detail-desktop-1440x900.png) |
| Laptop 1280 × 800 | [comparison-marketplace-laptop-1280x800.png](comparison-marketplace-laptop-1280x800.png) | [comparison-selected-detail-laptop-1280x800.png](comparison-selected-detail-laptop-1280x800.png) |
| Tablet 768 × 1024 | [comparison-marketplace-tablet-768x1024.png](comparison-marketplace-tablet-768x1024.png) | [comparison-selected-detail-tablet-768x1024.png](comparison-selected-detail-tablet-768x1024.png) |
| Mobile 390 × 844 | [comparison-marketplace-mobile-390x844.png](comparison-marketplace-mobile-390x844.png) | [comparison-selected-detail-mobile-390x844.png](comparison-selected-detail-mobile-390x844.png) |

## CodeMatch states captured

For each viewport, the populated marketplace, selected request detail, search result, active filter, and empty result have separate screenshots. Mobile navigation and mobile filters were also captured.

| State | 1440 × 900 | 1280 × 800 | 768 × 1024 | 390 × 844 |
|---|---|---|---|---|
| Populated marketplace | [desktop](populated-marketplace-desktop-1440x900.png) | [laptop](populated-marketplace-laptop-1280x800.png) | [tablet](populated-marketplace-tablet-768x1024.png) | [mobile](populated-marketplace-mobile-390x844.png) |
| Selected request detail | [desktop](populated-selected-detail-desktop-1440x900.png) | [laptop](populated-selected-detail-laptop-1280x800.png) | [tablet](populated-selected-detail-tablet-768x1024.png) | [mobile](populated-selected-detail-mobile-390x844.png) |
| Search results (`Spring Boot`) | [desktop](populated-search-results-desktop-1440x900.png) | [laptop](populated-search-results-laptop-1280x800.png) | [tablet](populated-search-results-tablet-768x1024.png) | [mobile](populated-search-results-mobile-390x844.png) |
| Active level filter | [desktop](populated-active-filter-desktop-1440x900.png) | [laptop](populated-active-filter-laptop-1280x800.png) | [tablet](populated-active-filter-tablet-768x1024.png) | [mobile](populated-active-filter-mobile-390x844.png) |
| Empty search results | [desktop](populated-empty-results-desktop-1440x900.png) | [laptop](populated-empty-results-laptop-1280x800.png) | [tablet](populated-empty-results-tablet-768x1024.png) | [mobile](populated-empty-results-mobile-390x844.png) |

Mobile-only interaction captures: [navigation menu open](populated-mobile-navigation-mobile-390x844.png) and [filters applied](populated-mobile-filters-mobile-390x844.png).

## Findings by visual category

| Category | Findings and changes |
|---|---|
| Layout | The unselected desktop board uses the same 216px navigation rail and 400px right panel pattern as Bordful. When a request is selected at desktop widths, the list and detail columns now use the upstream `216px / 520px / remaining width` layout. The measured results are 216 / 520 / 704px at 1440px and 216 / 520 / 544px at 1280px. On tablet and mobile, CodeMatch keeps its single-pane selected-detail route. |
| Typography | Geist is available in the browser and the board uses it with the same sans-serif fallback stack as the source. The desktop request-detail title, section headings, and body copy were enlarged to align more closely with Bordful's hierarchy. |
| Spacing and dimensions | Request rows now use 56px desktop rows with a single bottom divider, matching the reference's dense list rhythm. Mobile rows reserve a second line for the learning budget and use a 40px mark, following the reference's larger mobile row proportions. Filter and results bars retain the source's 48px desktop and 43px mobile heights. |
| Colors | The marketplace retains Bordful's neutral gray canvas, white surfaces, subdued divider colors, and restrained green result indicator. CodeMatch's primary blue remains on actions that require product branding or affordance. |
| Borders and shadows | The previous individually bordered, rounded request cards were removed from the marketplace rows. The list now uses flat rows with thin dividers. The unselected detail placeholder remains a bordered white panel, matching Bordful's empty preview treatment. |
| Icons and marks | The skill initials remain as CodeMatch request marks; no company logos were fabricated. The mobile mark dimension was increased to the reference's 40px tile size. Existing Lucide controls remain for search, save, menu, and filters. |
| Visual hierarchy | Selected rows receive the reference's quiet highlight and non-selected rows are visually de-emphasized while the detail preview is open. Vietnamese request title and budget remain the main row information. |
| Responsive behavior | The four viewports have no horizontal document overflow. Mobile navigation expands from the menu button, filters remain horizontally scrollable, and selected detail occupies the mobile content pane. |

## Interactive-state results

- Marketplace: 15 API-backed requests loaded from the isolated database; one page displays all 15 using a page size of 20, matching Bordful's 20-item page density.
- Selected detail: `GET /api/v1/learning-requests/{id}` returned 200; desktop preview geometry matches the Bordful 216px rail and 520px list.
- Search: `Spring Boot` returned one request at each viewport.
- Active filter: `BEGINNER` returned five requests at each viewport; the mobile filter capture uses `INTERMEDIATE` and returned five.
- Empty search: zero requests and the empty state appeared at each viewport.
- Mobile navigation: menu button expanded and exposed its navigation links.
- Browser audit: zero page errors; all discovery, skills, and detail API calls returned 200. Anonymous `/auth/me` returned 401 as expected for the signed-out visual-test browser context.

## Confidence and limits

The screenshots provide evidence of a close structural match for the board, list density, selected preview, and responsive behavior. They do not establish pixel identity: Bordful contains employment-specific content and logos, while CodeMatch must retain Vietnamese learning-request content, budget/CV fields, and its own identity. Remaining differences are listed in [remaining-differences.md](remaining-differences.md).
