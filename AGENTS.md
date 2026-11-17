# CodeMatch engineering instructions

- Product language is Vietnamese. Keep UI copy plain, specific, and accessible.
- Preserve the modular monolith: React/Vite frontend and Java 21/Spring Boot API backed by PostgreSQL.
- Keep authorization at the service boundary and validate all incoming data. Never expose private CV storage URLs.
- Do not add demo people, activity counts, testimonials, ratings, or verification claims without clearly marking local-only data.
- Use focused changes, document material architectural choices in `docs/DECISION_LOG.md`, and keep product docs aligned with behavior.
- Run relevant frontend checks with `npm run build`, `npm run lint`, and `npm test`; run backend checks with the Maven wrapper when available.
- Do not commit, push, deploy, or introduce secrets without explicit authorization.
