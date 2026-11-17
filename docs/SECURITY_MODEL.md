# Security model

## Trust boundaries
The browser is untrusted. Spring Security authenticates requests; services authorize every referenced object and execute lifecycle changes transactionally. PostgreSQL and private file storage are trusted infrastructure boundaries, not direct clients.

## Controls required before pilot
- Password hashing using a strong adaptive password encoder; secure session/cookie or short-lived token design documented before M1.
- Role and object-level checks on every operation; reject IDOR attempts without disclosing existence.
- Bean validation and strict request DTOs; safe error mapping; parameterized persistence.
- Rate limits for login, registration, proposal submission, and report creation at the edge/API.
- CSRF protection when cookie authentication is used; secure, HttpOnly, SameSite cookies; restrictive CORS and CSP.
- CV upload allowlist PDF, 5 MB maximum, server-side signature/content validation, randomized private object keys, malware scanning integration decision before launch, authenticated download authorization, no permanent public links, retention/deletion lifecycle.
- Audit actor, action, object, timestamp and outcome for sensitive state changes; exclude secrets and file content.
- Concurrency-safe proposal acceptance and database constraints for duplicates and one match.
- Secret management via environment/deployment secret store; never commit real secrets.

M0 includes no authentication endpoints or file upload behavior and must not be represented as production secure until later milestones implement and test these controls.
