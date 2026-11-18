# API specification

The versioned base path is `/api/v1`. M1–M6 endpoint groups below are implemented; see the test strategy and pilot validation plan for verification evidence and limitations.

## M1 identity and developer profiles
- `GET /auth/csrf` returns 204 and initializes the `XSRF-TOKEN` cookie. Send its value in `X-XSRF-TOKEN` for unsafe requests.
- `POST /auth/register` accepts `{email,password,displayName}`; returns 201 with public account fields. Password is 12–64 characters (maximum 72 UTF-8 bytes); duplicate email returns a generic conflict code.
- `POST /auth/login` accepts `{email,password}`; returns the account projection and sets HttpOnly `CMSESSION`.
- `POST /auth/logout` invalidates the session and returns 204.
- `GET /auth/me` returns the current account or 401.
- `GET /skills` returns the controlled skill catalog.
- `GET /developers/{profileId}` returns a public developer profile without email or credentials.
- `GET /developers/me`, `POST /developers/me`, `PUT /developers/me` are authenticated owner operations. Profile writes include headline, biography, experience, optional HTTPS links, teaching approach, availability, and one or more catalog `skillIds`.

Browser requests must use credentials. CORS allows only the configured frontend origin. Cookie auth is CSRF-protected.

## M2 learning requests and discovery
- `POST /learning-requests` creates an authenticated learner's DRAFT request (201).
- `GET /learning-requests` returns paged OPEN requests. Filters: `q`, repeated `skillIds`, `level`, `format`, `minBudget`, `maxBudget`, `budgetUnit`, `requiresCv`, `page`, `size` (1–50), and `sort` (`NEWEST` or `OLDEST`). Budget filters require `budgetUnit`.
- `GET /learning-requests/{id}` returns an OPEN request publicly; owners can read their own DRAFT/CLOSED/MATCHED requests. Other users receive not-found for private statuses.
- `GET /me/learning-requests` returns the authenticated owner's paged requests, optionally filtered by status.
- `PATCH /learning-requests/{id}` updates the owner's DRAFT or OPEN request; CLOSED requests cannot be edited.
- `POST /learning-requests/{id}/publish` transitions DRAFT → OPEN. `POST /learning-requests/{id}/close` transitions OPEN → CLOSED.
- `GET /saved-requests` lists the current owner's saved requests. `PUT /saved-requests/{requestId}` saves an OPEN request idempotently (204); `DELETE /saved-requests/{requestId}` unsaves it (204). A saved request remains visible to its owner if it later closes.
- Request body includes title, description, learningGoal, currentLevel, preferredFormat, city, budgetMin/budgetMax/budgetUnit, preferredSchedule, expectedDuration, teachingExpectations, requiresCv, and one or more controlled `skillIds`. Response DTOs contain no learner account identity.

## M3 proposals and CVs
- `POST /learning-requests/{requestId}/proposals` submits a validated proposal for an OPEN request; developer profile required; self-application and an existing active submission conflict. Requires a CV when the request sets `requiresCv`.
- `GET /me/proposals` lists the signed-in developer's own proposals.
- `GET /me/learning-requests/{requestId}/proposals` lists proposals only if the caller owns that request.
- `GET /proposals/{id}`, `PATCH /proposals/{id}`, `POST /proposals/{id}/withdraw`: proposal owner or owning learner may view; only the developer owner may edit/withdraw.
- `POST /developer/cvs` uploads `multipart/form-data` part `file`; `GET /developer/cvs` lists the caller's files; `PUT /developer/cvs/{id}` replaces; `DELETE /developer/cvs/{id}` deletes unless referenced by a submitted proposal; `GET /developer/cvs/{id}/file` downloads an owned CV.
- `GET /proposals/{id}/cv` downloads a CV only for the proposal owner or the learner who owns its request.
- CVs are actual-content validated PDFs, at most 5 MiB. DTOs do not expose private storage keys or URLs. Download responses are `application/pdf`, attachment, `no-store`, and `nosniff`.
- Proposal statuses are `SUBMITTED` and `WITHDRAWN`. Closing a request blocks new proposals but does not change existing proposal status or participant access.

## M4 developer selection and matching
- `POST /me/learning-requests/{requestId}/match` accepts `{proposalId}` and confirms the learner's selection for an OPEN owned request. It returns the confirmed match; repeating the same selection is idempotent, while a different selection conflicts.
- `GET /me/learning-requests/{requestId}/match` returns the confirmed match only to the request owner.
- `GET /me/matches` and `GET /me/matches/{matchId}` return matches only to the selected developer profile owner.
- `GET /proposals/{proposalId}/selection-status` returns `PENDING`, `SELECTED`, `NOT_SELECTED`, or `WITHDRAWN` to the proposal owner or request owner. Other users receive not-found.
- A match has the single lifecycle state `CONFIRMED`. The learning request transitions from `OPEN` to `MATCHED` in the same transaction. A matched request accepts no proposals and allows no request/proposal edits. Existing proposals remain `SUBMITTED` for historical comparison; their separate selection status becomes `NOT_SELECTED`.
- Withdrawn, cross-request, and non-submitted proposals cannot be selected. A closed request cannot be selected. Cookie-authenticated writes require the existing CSRF token.

## Contract conventions

## M5 moderation and rate limits
- Login, registration, proposal submission, and CV download have configurable rate limits. A rejected request returns HTTP 429, `code: rate_limited`, and `Retry-After` seconds.
- Report creation is limited to 5 per hour per client/principal. The admin queue returns at most 100 oldest reports for the selected status.
- `POST /reports` accepts `{targetType,targetId,reason,description?}`. Target types are `LEARNING_REQUEST`, `DEVELOPER_PROFILE`, and `TEACHING_PROPOSAL`; reasons are `SPAM`, `HARASSMENT`, `INAPPROPRIATE`, `FRAUD`, and `OTHER`. Proposal reports require participant access. Duplicate reports from the same reporter return 409.
- `GET /me/reports` lists the caller's report metadata without target content.
- Admin only: `GET /admin/reports?status=OPEN`, `GET /admin/reports/{id}`, `POST /admin/reports/{id}/review` with `{status: RESOLVED|DISMISSED}`, `POST /admin/learning-requests/{id}/hide`, `POST /admin/learning-requests/{id}/restore`, and `POST /admin/users/{id}/suspend`.
- Admin access derives from the database `users.is_admin` flag, false by default; registration cannot assign it. Hidden requests are omitted from discovery and non-owner direct reads.
- `GET /admin/pilot-overview` is admin-only. It returns aggregate registration, active developer, open request, submitted proposal, confirmed match, pending report, funnel coverage/conversion, and average time-to-first-proposal/match values. It does not return account identifiers or proposal/CV content; zero-data metrics are `0`.
- Pilot aggregate counts are live database-derived values, not event-sourced analytics; time-to-first values consider requests with published timestamps and any recorded proposal/match. Synthetic test accounts/traffic must be excluded from real-pilot interpretation by using isolated databases. No analytics-retention table is introduced.
- `GET /actuator/metrics` and metric subpaths require admin authority. Publicly reachable management routes are limited to health and info; `/actuator/health/readiness` checks application readiness and database connectivity.
- Low-cardinality counters record selected business events, authentication failures, rate-limit responses, and proposal/match errors without user labels. Request correlation IDs are validated or generated and returned as `X-Request-ID`.
Use JSON, ISO-8601 timestamps, stable opaque identifiers, field-level validation errors, and safe problem responses without stack traces or sensitive values. All object reads and writes require object-level authorization. CV bytes are returned only through authenticated, authorized endpoints with private/no-store cache policy. Match selection is idempotent for the same proposal and returns a conflict for a different proposal after resolution.
