# API specification

The versioned base path is `/api/v1`. API operations are not implemented in M0.

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
