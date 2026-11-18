# Data model

## Implemented through M2 (Flyway V1–V3)
- `users`: UUID, case-insensitive unique email, BCrypt hash, display name, account status, timestamps. A single user can learn and create a developer profile.
- `developer_profiles`: unique owner, headline, biography, experience (0–60), HTTPS links, teaching approach, availability, timestamps.
- `skills` and `developer_profile_skills`: seeded controlled catalog and normalized many-to-many profile skills.
- `SPRING_SESSION` and `SPRING_SESSION_ATTRIBUTES`: JDBC-backed Spring Security sessions.
- `learning_requests`: learner-owned request details, status, VND budget and lifecycle timestamps. Database checks constrain status and budget values.
- `learning_request_skills`: normalized controlled-skill associations for request discovery.
- `saved_requests`: unique learner/request association; deleting a save does not delete the request.

## Planned entities
- `teaching_proposals`: developer, request, proposal text, plan, price, duration, availability, status.
- `developer_cvs`: private object key, owner, metadata, lifecycle; no public URL.
- `matches`: accepted proposal/request/developer/learner relationship.
- `reports` and `audit_events`: moderation inputs and append-oriented security/business audit records.

## Invariants to enforce in database and transactions
- Unique active `(request_id, developer_id)` proposal; withdrawn/rejected history may remain.
- A request has at most one accepted proposal/match. Enforce through transaction plus row lock or conditional update and a unique constraint.
- Request owner and applying developer references are non-null and immutable where required.
- Proposal insertion and request state checks occur in one transaction; ownership checks remain service-level.
- CV associations preserve owner and request authorization context after replacement/deletion. Store object keys privately and model deletion/retention state explicitly.

## Request mutability
Owner may edit draft/open request details before any proposal exists. After the first proposal, preserve the learning goal, level, skills, format, budget, and CV-required policy; allow only safe scheduling clarification until matched. Status transitions must be explicit and audited.

The M0 migration creates only the migration baseline and database readiness; domain schema lands with M1–M3.
