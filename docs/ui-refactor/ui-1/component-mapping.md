# UI-1 Bordful Component Mapping

Reference source: [craftled/bordful](https://github.com/craftled/bordful), checked under its MIT license. The original source's `src/components/board/board-listing.tsx` defines the listing grid (`216px` rail; selected preview `216px 520px minmax(0,1fr)`) and `board-workspace.tsx` handles row selection. CodeMatch ports the relevant sizing and visual behavior into its existing React/Vite components; it does not port Bordful's Next.js/Payload runtime or job-domain logic.

| Bordful element | CodeMatch component | Ported behavior |
|---|---|---|
| Board header, search, views, account actions | `App.tsx` `.topbar`, `.header-search`, `.main-nav`, `.account-actions` | Compact 52px desktop header, search field, active navigation state, and mobile menu. Brand and links stay CodeMatch-specific. |
| Board filters and counts | `LearningRequests.tsx` `RequestDiscovery` `.board-filterbar`, `.board-resultsbar` | Compact horizontal controls, live result count, sort control, and clear-filters action. Filters call existing discovery API query parameters. |
| Board rail | `RequestDiscovery` `.board-rail`, `.rail-skill`, `.rail-budget` | Bordful's left rail dimensions and row rhythm, mapped to real skill and budget filters. |
| Job list row | `RequestCard` `.request-card.bordful-request-row` | Flat row with bottom divider, mark, title, metadata, and right-aligned price/date. Mobile wraps price onto its own line. |
| Selected row state | `RequestCard` `.is-selected` | Quiet selected background; other rows are de-emphasized while the preview is shown. |
| Empty detail preview | `RequestDiscovery` `.detail-placeholder` | Bordered white panel with CodeMatch's plain prompt. |
| Selected detail preview | `RequestDetailPage` `.bordful-detail-content` | Existing request detail and authorization-aware actions in a panel that expands to the upstream 520px list plus remaining detail width at desktop sizes. Tablet/mobile retain a full-width detail pane. |
| Mobile toolbar and navigation | `App.tsx` `.mobile-menu`, `.mobile-bottom-nav` and `RequestDiscovery` filter bar | Responsive header/menu and bottom navigation, with horizontally scrollable filters and no horizontal page overflow. |

CSS port details are in [bordful-board.css](../../../src/bordful-board.css). The source attribution and license text are in [license-and-attribution.md](license-and-attribution.md). The full visual delta is in [visual-comparison-report.md](visual-comparison-report.md) and [remaining-differences.md](remaining-differences.md).
