# UI-1.3 — Final Request Detail Visual Review

Review date: 2026-11-26. Synthetic-only fixture: 15 Learning Requests from the isolated `codematch-m5-e2e-local` test environment. Reference: selected job detail on [Bordful](https://bordful.com/jobs), checked against its MIT-licensed source repository [`craftled/bordful`](https://github.com/craftled/bordful).

## Reference implementation inspected

The selected-job route and its `job-detail`, `job-facts`, `job-breadcrumb`, and `sticky-apply` components were inspected directly. Bordful switches to a plain detail surface on small screens, uses a separate facts panel, and provides a fixed bottom action row. Its measured selected-detail typography is Geist: desktop title 40px/46px, weight 500, letter spacing -1px; mobile title 30px/36px, weight 500, letter spacing -0.9px. Body copy is 17px/28px desktop and 16px/20px mobile; breadcrumb is 13px. Full measurements are recorded in [computed styles JSON](ui-1-3-computed-styles.json).

## Implementation corrections

- Removed the large enclosing detail card at mobile widths; retained the approved desktop marketplace composition.
- Rebuilt title hierarchy, breadcrumb, request facts, section spacing and body text around the reference measurements.
- Breadcrumb links to the real CodeMatch discovery route (`/`); no routing changes were made.
- Split level, learning format, budget and CV requirement into the facts panel.
- Added a mobile sticky action bar for Save and proposal action. Bottom navigation is hidden on the detail view at mobile widths so neither navigation nor action bar covers the other.
- Kept desktop search where the existing marketplace layout uses it; hid it for mobile detail where the reference detail view does not show it.
- Kept authorization outcomes tied to existing API-backed account/profile/request ownership state. Anonymous users receive sign-in links; owners receive proposal management; developers with profiles can propose; authenticated learners without a developer profile are directed to the real profile setup route. No API, schema or backend behavior changed.

## Screenshots

All pairs are same-viewport captures; Bordful is on the left and CodeMatch on the right. Screens show the same current live Bordful selected job and a synthetic CodeMatch request.

| Viewport | Comparison | CodeMatch | Bordful |
|---|---|---|---|
| Desktop 1440×900 | [Side by side](ui-1-3-comparison-detail-desktop-1440x900.png) | [Screenshot](ui-1-3-codematch-detail-desktop-1440x900.png) | [Screenshot](ui-1-3-reference-detail-desktop-1440x900.png) |
| Laptop 1280×800 | [Side by side](ui-1-3-comparison-detail-laptop-1280x800.png) | [Screenshot](ui-1-3-codematch-detail-laptop-1280x800.png) | [Screenshot](ui-1-3-reference-detail-laptop-1280x800.png) |
| Tablet 768×1024 | [Side by side](ui-1-3-comparison-detail-tablet-768x1024.png) | [Screenshot](ui-1-3-codematch-detail-tablet-768x1024.png) | [Screenshot](ui-1-3-reference-detail-tablet-768x1024.png) |
| Mobile 390×844 | [Side by side](ui-1-3-comparison-detail-mobile-390x844.png) | [Screenshot](ui-1-3-codematch-detail-mobile-390x844.png) | [Screenshot](ui-1-3-reference-detail-mobile-390x844.png) |

## Remaining differences

- Bordful is a job board and its selected-detail desktop page has employer/company content and an adjacent information rail. CodeMatch is still the approved marketplace with a selected request panel at desktop, and uses learning-specific metadata. Reproducing employer branding, hiring copy, or irrelevant fields would misrepresent CodeMatch; the approved desktop marketplace was therefore retained.
- The CodeMatch facts panel has four domain-relevant facts while the reference job listing contains more employment attributes; this changes natural card height.
- The CodeMatch mobile action labels and routes map to Save and Submit Proposal, not Apply. The visual sticky action pattern is reused while preserving existing authorization and product semantics.

## Verification summary

See [UI-1.3 test results](ui-1-3-test-results.md) for commands and exact counts. The capture script is [capture-ui-1-3-detail.mjs](capture-ui-1-3-detail.mjs); it uses the real API to select the synthetic request and records viewport overflow, visible controls and computed styles.
