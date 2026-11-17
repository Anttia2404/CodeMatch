# Security model

## Trust boundaries
The browser is untrusted. Spring Security authenticates requests; services authorize every referenced object and execute lifecycle changes transactionally. PostgreSQL and private file storage are trusted infrastructure boundaries, not direct clients.

## M1 controls
- Passwords use BCrypt strength 12, are never returned, and are constrained to fit BCrypt's 72-byte input limit. Login failures use a generic response.
- Authentication uses JDBC-backed server-side sessions. The `CMSESSION` cookie is HttpOnly, SameSite=Lax, and Secure is enabled by `CODEMATCH_COOKIE_SECURE=true` for HTTPS deployments.
- Cookie-authenticated mutations require a double-submit CSRF token (`XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header). CORS is limited to one configured origin and credentials are enabled only for that origin.
- Every private profile endpoint requires an authenticated account and resolves the profile through the account identity. Public projections omit email and credentials. Skill IDs are checked against the catalog.
- DTO validation, HTTPS-only links, generic problem responses, and database constraints reject malformed/conflicting data. Stack traces and binding details are not returned.

## Controls required before pilot
- Role and object-level checks on every operation; reject IDOR attempts without disclosing existence.
- Bean validation and strict request DTOs; safe error mapping; parameterized persistence.
- Rate limits for login, registration, proposal submission, and report creation at the edge/API.
- CSRF protection when cookie authentication is used; secure, HttpOnly, SameSite cookies; restrictive CORS and CSP.
- CV upload allowlist PDF, 5 MB maximum, server-side signature/content validation, randomized private object keys, malware scanning integration decision before launch, authenticated download authorization, no permanent public links, retention/deletion lifecycle.
- Audit actor, action, object, timestamp and outcome for sensitive state changes; exclude secrets and file content.
- Concurrency-safe proposal acceptance and database constraints for duplicates and one match.
- Secret management via environment/deployment secret store; never commit real secrets.

M1 implements authentication and developer profiles, but is not a production security certification. Add login/registration rate limits, operational secret management, HTTPS and Secure cookie deployment, CSP, security event auditing, and account recovery controls before a public pilot. M1 does not implement CV upload behavior.
