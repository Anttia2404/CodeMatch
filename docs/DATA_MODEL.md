# Data model

## V6 moderation and audit additions
- `users.is_admin` defaults to false; existing accounts do not become admins through migration.
- `learning_requests.hidden_at` marks a request hidden from public discovery.
- `moderation_reports` stores reporter, target type/id, reason, optional description, status, creation/review times and reviewer. A unique key limits each reporter to one report per target; target visibility is checked in the service.
- `audit_events` stores actor, event type, target, outcome, timestamp and structured details. It excludes credentials, sessions and CV content. Retention is currently manual.

## Implemented through M4 (Flyway V1–V5)
- `users`: UUID, case-insensitive unique email, BCrypt hash, display name, account status, timestamps. A single user can learn and create a developer profile.
- `developer_profiles`: unique owner, headline, biography, experience (0–60), HTTPS links, teaching approach, availability, timestamps.
- `skills` and `developer_profile_skills`: seeded controlled catalog and normalized many-to-many profile skills.
- `SPRING_SESSION` and `SPRING_SESSION_ATTRIBUTES`: JDBC-backed Spring Security sessions.
- `learning_requests`: learner-owned request details, status, VND budget and lifecycle timestamps. Database checks constrain status and budget values.
- `learning_request_skills`: normalized controlled-skill associations for request discovery.
- `saved_requests`: unique learner/request association; deleting a save does not delete the request.
- `developer_cvs`: private CV metadata, profile owner and opaque storage key, sanitized filename and content size. CV bytes are not in PostgreSQL.
- `teaching_proposals`: request and developer profile, proposal text, explicit VND rate unit, schedule/duration, optional CV reference, status and timestamps.
- `matches`: one confirmed proposal per request, with request, proposal, learner, developer profile, status and timestamps.

## Planned entities
- `reports` and `audit_events`: moderation inputs and append-oriented security/business audit records.

## Invariants to enforce in database and transactions
- Unique active `(request_id, developer_profile_id)` proposal enforced by a PostgreSQL partial unique index where status is `SUBMITTED`; withdrawn history remains.
- A request has at most one confirmed match. Selection locks the request and selected proposal in one transaction; V5 unique constraints and composite foreign keys enforce one match per request and matching request/learner/proposal/developer references.
- Request owner and applying developer references are non-null and immutable where required.
- Proposal insertion and request state checks occur in one transaction; ownership checks remain service-level.
- Composite foreign key ensures an attached CV belongs to the proposal's developer profile. CV deletion is rejected while referenced by a submitted proposal; withdrawing releases the reference for deletion.
- The API never returns storage keys. CV bytes live outside static directories and are streamed only after owner or associated-request-owner authorization.

## Request mutability
Owner may edit draft/open request details before any proposal exists. After the first proposal, preserve the learning goal, level, skills, format, budget, and CV-required policy; allow only safe scheduling clarification until matched. Status transitions must be explicit and audited.

The V1 migration establishes baseline, V2 identity/profile, V3 learning requests, V4 proposal/private-CV schema, and V5 confirmed matches. A matched request uses status `MATCHED`; existing proposals keep their `SUBMITTED`/`WITHDRAWN` lifecycle and expose selection outcome separately.
