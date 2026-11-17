# Data model

## Planned entities
- `users`: credentials, status, timestamps; a user can hold learner and developer roles.
- `developer_profiles`: display name, headline, biography, experience, links, teaching approach, availability.
- `skills` and `developer_skills`: normalized skill catalog and developer proficiency associations.
- `learning_requests`: owner, learning goal, level, language, format, schedule, budget, session count, CV-required flag, status.
- `request_skills`: normalized request skill tags.
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
