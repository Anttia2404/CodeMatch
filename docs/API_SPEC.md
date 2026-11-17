# API specification

The versioned base path is `/api/v1`. M1 endpoints are implemented as below; later marketplace endpoints remain planned.

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

## Planned resource outline
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET|POST /requests`, `GET|PATCH /requests/{id}`, `POST /requests/{id}/cancel`
- `GET /requests/{id}/proposals`, `POST /requests/{id}/proposals`
- `POST /proposals/{id}/withdraw`, `POST /requests/{id}/proposals/{proposalId}/accept`
- `GET|POST|DELETE /developer/cvs`, `GET /requests/{id}/proposals/{proposalId}/cv`
- `GET|PATCH /developers/{id}` and private owner profile routes
- Moderator-only report and moderation routes

## Contract conventions
Use JSON, ISO-8601 timestamps, stable opaque identifiers, field-level validation errors, and safe problem responses without stack traces or sensitive values. All object reads and writes require object-level authorization. CV bytes are returned only through authenticated, authorized endpoints with private/no-store cache policy. Proposal acceptance is idempotent or returns a conflict for an already resolved request.
