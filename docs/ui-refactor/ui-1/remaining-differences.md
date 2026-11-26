# UI-1.1 Remaining Differences and Justification

The implementation is compared against Bordful's live Jobs board. The licensed upstream implementation is built around a job domain and a Next.js/Payload stack; CodeMatch keeps its React/Vite frontend and existing API. The following differences remain because replacing them would change product identity, data meaning, or application behavior.

| Area | Remaining difference | Reason |
|---|---|---|
| Brand and navigation | CodeMatch name, braces mark, Vietnamese navigation, sign-in/join links, and saved requests replace Bordful's Job Board name, job views, and marketing links. | Required CodeMatch identity and existing routes. |
| Left rail | Bordful's employment categories and counts are replaced with CodeMatch skills, budget range, and request links. | The API exposes skills and requests, not job categories or company facets. No synthetic counts are shown. |
| Row marks | Bordful displays company logos; CodeMatch displays short skill initials. | The learning-request response has no company or tutor identity and must not imply one. |
| Row content | Job title, company, work arrangement, employment type, salary, and age become learning title, skills/format, VND budget, and localized publication date. | These are the matching learning-request fields returned by the real API. |
| Filter controls | CodeMatch filters level, learning format, budget unit, CV requirement, and skill; Bordful filters job category, type, level, salary, language, and remote status. | Each control must describe its own data and use existing API query parameters. There is no honest one-to-one mapping for several job filters. |
| Detail preview | CodeMatch shows learning goal, description, needed skills, teaching expectations, schedule, duration, level, format, budget, CV requirement, and permission-aware proposal actions. Bordful shows company, salary, type, level, job description, similar roles, and employment actions. | Required business content and authorization behavior cannot be replaced with job fields. The panel geometry and typographic hierarchy follow the reference where they can. |
| Counts and badges | CodeMatch shows its real total and does not add "new", verified, or company badges. | No such claims or source data exist for these learning requests. |
| Mobile detail | Selecting a CodeMatch request uses its full-width detail pane; Bordful's job application can open a different full post route below its preview breakpoint. | Preserves the existing CodeMatch route and makes the selected learning request readable on small screens. |
| Icon set | CodeMatch keeps its existing Lucide icons for bookmark, menu, and search. | No Bordful icon assets were copied; the selected components are not meaningfully interchangeable without changing actions. |

The four viewport captures show no horizontal overflow. There are no known unintentional layout differences remaining in the marketplace row/card treatment, selected desktop column proportions, neutral surface palette, or responsive mobile row budget visibility. The side-by-side evidence is in [visual-comparison-report.md](visual-comparison-report.md).
