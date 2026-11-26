# UI Refactor Roadmap

Status reviewed: 2026-11-26. This document records the intended future information architecture only. It does not authorize implementation, route changes, deployment, or merge.

## Target public site structure

| Route | Intended purpose | Current status |
|---|---|---|
| `/` | CodeMatch landing page | Research only; not implemented |
| `/requests` | Learning Request marketplace using the approved Bordful-based UI-1 work | Current discovery route remains unchanged pending a separately approved routing change |
| Request detail | Detail for one Learning Request | Keep the existing route until routing is reviewed and approved; do not infer or introduce a replacement URL here |

## Milestones

1. **UI-1 — Request discovery/detail:** marketplace and request detail visual correction against Bordful. UI-1.3 is the last planned visual correction; review evidence is in [`docs/ui-refactor/ui-1/ui-1-3-visual-review.md`](ui-refactor/ui-1/ui-1-3-visual-review.md).
2. **UI-2 — Landing page:** research only until the owner selects a template and explicitly approves implementation. Candidate comparison and licensing evidence: [`docs/ui-refactor/ui-2/LANDING_PAGE_RESEARCH.md`](ui-refactor/ui-2/LANDING_PAGE_RESEARCH.md).
3. **Routing change:** separately scope the future `/` and `/requests` allocation and detail URL only after UI-1 review and Landing Page template approval. Preserve existing deep links and authorization semantics during that future work.

## Guardrails

- Keep React/Vite/TypeScript and the Spring Boot/PostgreSQL API architecture.
- Do not change backend contracts, authentication, authorization or request behavior as part of visual milestones.
- Do not replace real API data with testimonials, ratings, customer logos, member counts or other invented product claims. Clearly label synthetic data and keep it local-only.
- Obtain review of screenshots, selected template, source license/attribution obligations, and route mapping before UI-2 implementation.
- No merge, deployment, paid assets, or cloud resource creation without explicit approval.
