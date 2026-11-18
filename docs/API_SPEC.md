# API specification

The versioned base path is `/api/v1`. M1–M3 endpoints below are implemented; matching and moderation remain planned.

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
- `GET /learning-requests/{id}` returns an OPEN request publicly; owners can read their own DRAFT/CLOSED requests. Other users receive not-found for private statuses.
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
- Proposal statuses are `SUBMITTED` and `WITHDRAWN`. Closing a request blocks new proposals but does not change existing proposal status or participant access. Selection/acceptance is deferred to M4.

Matching acceptance and moderator-only report/moderation endpoints remain planned.

## Contract conventions
Use JSON, ISO-8601 timestamps, stable opaque identifiers, field-level validation errors, and safe problem responses without stack traces or sensitive values. All object reads and writes require object-level authorization. CV bytes are returned only through authenticated, authorized endpoints with private/no-store cache policy. Proposal acceptance is idempotent or returns a conflict for an already resolved request.
