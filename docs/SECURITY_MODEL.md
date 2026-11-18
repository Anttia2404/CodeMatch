# Security model

## Trust boundaries
The browser is untrusted. Spring Security authenticates requests; services authorize every referenced object and execute lifecycle changes transactionally. PostgreSQL and private file storage are trusted infrastructure boundaries, not direct clients.

## M1 controls
- Passwords use BCrypt strength 12, are never returned, and are constrained to fit BCrypt's 72-byte input limit. Login failures use a generic response.
- Authentication uses JDBC-backed server-side sessions. The `CMSESSION` cookie is HttpOnly, SameSite=Lax, and Secure is enabled by `CODEMATCH_COOKIE_SECURE=true` for HTTPS deployments.
- Cookie-authenticated mutations require a double-submit CSRF token (`XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header). CORS is limited to one configured origin and credentials are enabled only for that origin.
- Every private profile endpoint requires an authenticated account and resolves the profile through the account identity. Public projections omit email and credentials. Skill IDs are checked against the catalog.
- DTO validation, HTTPS-only links, generic problem responses, and database constraints reject malformed/conflicting data. Stack traces and binding details are not returned.

## M3 proposal and private CV controls
- Proposal routes are authenticated and service checks enforce request ownership, developer ownership, request state, no self-application, and participant-only proposal visibility/download. Unrelated users receive not-found responses.
- A PostgreSQL partial unique index backs the one-active-submission rule; submissions lock the request row so request closure and proposal submission serialize.
- Uploads accept PDF only, cap content at 5 MiB, verify PDF signature and parse actual bytes using PDFBox; opaque UUID keys are generated server-side. Filesystem storage normalizes the configured root, rejects symlink reads, and is outside static resources.
- CV metadata omits private storage keys and filesystem paths. Downloads are authenticated attachments with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. The CV owner may access their files; the learner may access only the CV attached to an associated proposal for a request they own.
- Deletion is refused while a submitted proposal references the CV; after withdrawal, deletion is allowed. Replacement updates the existing owner-held file reference. Request closure prevents new proposals but does not revoke participants' access to existing proposals.
- Logs exclude CV bytes, storage keys, and private file metadata. Local Docker uses a dedicated private volume and the JVM default is under the user's home directory. No automatic retention deadline is implemented; users should remove files when no longer needed.

## M4 matching controls
- Selection requires the authenticated owner of the target request. The service locks the request row and selected proposal, verifies the proposal belongs to that request and remains `SUBMITTED`, then records the match and changes the request to `MATCHED` in the same transaction.
- V5 constrains one match per request and ties the match learner to the request owner and developer profile to the selected proposal for that request with composite foreign keys. Database checks permit only `CONFIRMED` match status.
- Repeating selection of the same proposal returns the existing match; selecting another proposal returns conflict. Concurrent calls serialize on the request row. A request already CLOSED cannot be matched.
- Match details are returned only to the owning learner or selected developer. Proposal selection status is visible only to the proposal owner or request owner; unrelated users receive not-found. Other proposals remain intact but are not exposed through match detail.
- After selection, the request and all its proposals are immutable through normal APIs. The request status prevents new proposals; existing proposal status remains intact for auditability. Cookie-authenticated selection remains CSRF-protected.

## Controls required before pilot
- Role and object-level checks on every operation; reject IDOR attempts without disclosing existence.
- Bean validation and strict request DTOs; safe error mapping; parameterized persistence.
- Rate limits for login, registration, proposal submission, and report creation at the edge/API.
- CSRF protection when cookie authentication is used; secure, HttpOnly, SameSite cookies; restrictive CORS and CSP.
- CV upload allowlist PDF, 5 MB maximum, server-side signature/content validation, randomized private object keys, malware scanning integration decision before launch, authenticated download authorization, no permanent public links, retention/deletion lifecycle.
- Audit actor, action, object, timestamp and outcome for sensitive state changes; exclude secrets and file content.
- Concurrency-safe proposal selection and database constraints for one match per request and same-request references.
- Secret management via environment/deployment secret store; never commit real secrets.

M1–M5 implement identity, profiles, proposals, private CV controls, participant-scoped match access, rate limits, audit events and moderation, but this is not a production security certification. Shared rate limiting, operational secret management, HTTPS and Secure cookie deployment, CSP, malware scanning, automated audit retention policy, and account recovery controls remain before a public pilot.

## M5 controls
- API fixed-window rate limits cover login (12/15 min), registration (20/hour), proposals (8/min), and CV downloads (30/min). Rejections return `429 rate_limited` with `Retry-After`. Counters are process-local; multi-instance production requires a shared limiter.
- Report creation is limited to 5 per hour per client/principal to reduce repeat abuse.
- V6 adds `users.is_admin` defaulting false. Public registration cannot grant it. Admin endpoints require server-derived `ROLE_ADMIN`; no default admin credential exists.
- Reports validate target visibility. Proposal reports are participant-only and API responses contain report metadata rather than proposal text/CV content. A database unique constraint prevents duplicate reports by the same reporter for the same target.
- Moderation decisions, account suspension, request hide/restore, match confirmation, and authentication failures are audited without storing credentials, session identifiers, CV bytes, or file paths. Retention cleanup is manual and must be operationalized before production.
- Account suspension deletes that account's JDBC-backed sessions. Hidden requests are omitted from public discovery and non-owner reads.
- `npm audit --omit=dev` reports no production dependency vulnerabilities. The full development dependency tree currently reports 11 high findings through `picomatch@4.0.7` (GHSA-fc5q-39xc-vjpf) via Vite/Vitest. No patched version is published in the advisory; npm's automated fix would downgrade Vite from 7 to 6.2.7. Do not apply that forced major downgrade without compatibility review; update the dependency tree when a compatible upstream patch is available.
