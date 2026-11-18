# Data model

## Implemented through M3 (Flyway V1–V4)
- `users`: UUID, case-insensitive unique email, BCrypt hash, display name, account status, timestamps. A single user can learn and create a developer profile.
- `developer_profiles`: unique owner, headline, biography, experience (0–60), HTTPS links, teaching approach, availability, timestamps.
- `skills` and `developer_profile_skills`: seeded controlled catalog and normalized many-to-many profile skills.
- `SPRING_SESSION` and `SPRING_SESSION_ATTRIBUTES`: JDBC-backed Spring Security sessions.
- `learning_requests`: learner-owned request details, status, VND budget and lifecycle timestamps. Database checks constrain status and budget values.
- `learning_request_skills`: normalized controlled-skill associations for request discovery.
- `saved_requests`: unique learner/request association; deleting a save does not delete the request.
- `developer_cvs`: private CV metadata, profile owner and opaque storage key, sanitized filename and content size. CV bytes are not in PostgreSQL.
- `teaching_proposals`: request and developer profile, proposal text, explicit VND rate unit, schedule/duration, optional CV reference, status and timestamps.

## Planned entities
- `matches`: accepted proposal/request/developer/learner relationship.
- `reports` and `audit_events`: moderation inputs and append-oriented security/business audit records.

## Invariants to enforce in database and transactions
- Unique active `(request_id, developer_profile_id)` proposal enforced by a PostgreSQL partial unique index where status is `SUBMITTED`; withdrawn history remains.
- A request has at most one accepted proposal/match. Enforce through transaction plus row lock or conditional update and a unique constraint.
- Request owner and applying developer references are non-null and immutable where required.
- Proposal insertion and request state checks occur in one transaction; ownership checks remain service-level.
- Composite foreign key ensures an attached CV belongs to the proposal's developer profile. CV deletion is rejected while referenced by a submitted proposal; withdrawing releases the reference for deletion.
- The API never returns storage keys. CV bytes live outside static directories and are streamed only after owner or associated-request-owner authorization.

## Request mutability
Owner may edit draft/open request details before any proposal exists. After the first proposal, preserve the learning goal, level, skills, format, budget, and CV-required policy; allow only safe scheduling clarification until matched. Status transitions must be explicit and audited.

The V1 migration establishes baseline, V2 identity/profile, V3 learning requests, and V4 proposal/private-CV schema.
