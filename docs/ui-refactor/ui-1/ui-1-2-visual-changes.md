# UI-1.2 Visual Corrections

Date: 2026-11-26. Reference: [Bordful Jobs](https://bordful.com/jobs), captured in Chromium alongside CodeMatch at 1440×900, 1280×800, 768×1024, and 390×844. Data in CodeMatch screenshots is synthetic and belongs only to the isolated visual-test PostgreSQL database.

## Source and measurements

The Bordful repository is MIT-licensed (copyright Tomas Laurinavicius). Relevant source inspected: `src/components/board/job-row.tsx`, `src/components/board/board-filters.tsx`, `src/components/board/board-toolbar.tsx`, `src/components/board/board-list.tsx`, and `src/components/board/job-preview.tsx`. Computed values were measured in the browser rather than inferred from class names. Detailed values, colors, borders, shadows, and element bounds are in [computed-styles-comparison.md](computed-styles-comparison.md) and [ui-1-2-computed-styles.json](ui-1-2-computed-styles.json).

## Changes from UI-1.1

| Component | Before | After |
|---|---|---|
| Request title | Desktop 13px/500; mobile 12px | Desktop 14px/400 with 20px line height; mobile 15px/400 with 20px line height; selected title uses weight 500. |
| Metadata | Desktop 11px/13px; mobile 10px | Desktop 12px/16px; mobile 13px/18px, using Bordful's Geist hierarchy. |
| Budget and time | Small 10–11px amounts and long absolute date | 13px/18px budget; time is derived from the API timestamp and displayed as minutes, hours, or days (falling back to a localized date for older requests). |
| Desktop rows | 56px minimum with a separator; 16px horizontal padding | 60px rows, 8px outer inset, 2px row gap, 12px internal horizontal padding; no divider. |
| Mobile rows | 88px minimum, 40px skill mark, separator | 86px minimum, 36px mark, title/time at the first line, metadata next, budget last; no divider. |
| Mobile filters | Box-shaped native selects with visible select labels/values | 32px, fully rounded Geist pills (14px/18px, 12px horizontal padding), active value and accessible clear control. The existing native select continues to drive the same CodeMatch API filter. |
| Detail placeholder | 16px radius, older body spacing and no reference shadow | 14px radius, 20px padding, measured 210px minimum card height, subtle border and reference shadow; copy explains which real request fields appear. No shortcut claims or invented statistics. |
| Mobile navigation | Text-only links | 58px bottom bar with icon-over-label items mapped to Explore, Saved Requests, and Account/Login. Protected routes remain protected. |

The rows remain populated by the existing discovery API. Relative times are formatting of each request's real `publishedAt`; no fixture date or display-only statistics are substituted. The 15 visual fixtures were created only on the isolated E2E PostgreSQL service, not a development or production database.

## Remaining differences

- Bordful's mobile chips open a grouped filter sheet and remove an active filter through an `X` link. CodeMatch uses the same rounded pill presentation but keeps native select controls for the existing level/format/budget/CV filters; each selected filter has an explicit clear button. This preserves the current filter parameters and screen-reader select semantics without copying Bordful's job-taxonomy sheet.
- The translated chip labels and localized budget units have different intrinsic widths from Bordful's English job filters.
- Bordful job rows use company marks, employment metadata, salary, and varied post ages. CodeMatch shows skill initials, learning format/location, VND budget, and actual localized relative time. Synthetic fixtures were published in a short seed run, so their timestamps are close together and several rows show the same age.
- The detail placeholder uses honest instructions only. Bordful shows role shortcuts and an aggregate salary/remote summary; CodeMatch has no corresponding keyboard shortcut selection or honest same-scope market aggregates to show there.
- The mobile bottom navigation keeps CodeMatch's existing Explore/Saved/Account or Login routes and permissions instead of Bordful's Jobs/Saved/Companies destinations.
- At 768px the implementation switches to the existing CodeMatch full-width detail route; at mobile, the detail remains a full request page. Bordful has job-preview-specific navigation. These differences preserve existing CodeMatch route and authorization behavior.

## Visual evidence

`comparison-marketplace-*.png` and `comparison-selected-detail-*.png` show Bordful on the left and CodeMatch on the right at matching viewports. `populated-marketplace-*`, `populated-selected-detail-*`, `populated-active-filter-*`, `populated-search-results-*`, and `populated-empty-results-*` show CodeMatch states. `populated-mobile-filters-mobile-390x844.png` shows the real API filter result, and `populated-mobile-navigation-mobile-390x844.png` shows the open mobile menu plus the bottom route bar.
