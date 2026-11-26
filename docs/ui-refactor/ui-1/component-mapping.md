# UI-1 component mapping

Reference: [Bordful jobs board](https://bordful.com/jobs), inspected at 1440 × 900, 1280 × 800, 768 × 1024 and 390 × 844. The source repository is [craftled/bordful](https://github.com/craftled/bordful).

| Bordful element | CodeMatch implementation | Adaptation |
| --- | --- | --- |
| Site header and brand | `src/App.tsx` `HomePage`; `src/bordful-board.css` | Preserves CodeMatch branding and existing account routes; search is wired to backend discovery. |
| Search input | `HomePage` plus `RequestDiscovery` | Debounced search continues through the existing API contract. |
| Filter toolbar | `RequestDiscovery` in `src/LearningRequests.tsx` | Level, format, budget unit and CV filters call the existing discovery API. |
| Left board rail | `RequestDiscovery` | Saved and personal request links use existing routes. Skill options come only from `/api/v1/skills`; no fabricated counts are shown. |
| Job listing row | `RequestCard` | Recast as a compact request row. Uses actual request skill, format, budget and publish date; no invented learner names, logos, or activity. |
| Selected item detail | `RequestDetailPage` with `panel` mode | Keeps the existing request query, save/report/proposal actions and details; desktop panel; single-column selected view on narrower screens. |
| Loading, empty and error states | Existing React Query states in `RequestDiscovery` and `RequestDetailPage` | Empty state is backed by the real API response; retry remains available for failures. |
| Mobile navigation | `HomePage` and `.mobile-bottom-nav` | Reuses CodeMatch destinations and opens the existing navigation menu. |

No React/Next/Payload architecture was imported. The port is limited to the discovery/detail surface; form, dashboard, profile, proposal, matching and moderation routes retain their existing components.
