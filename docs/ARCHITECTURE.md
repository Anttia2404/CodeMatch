# Architecture

## M0 shape
Modular monolith: a React 19 + TypeScript + Vite web client; a Java 21 + Spring Boot API; PostgreSQL as the system of record; Flyway schema migrations. The API is organized by domain modules within one deployable application. Private files will use a storage abstraction and authorization-checked download endpoints.

```text
Browser ── HTTPS/JSON ── Spring Boot API ── PostgreSQL
                              │
                              └── Private CV storage (filesystem adapter; Docker volume locally)
```

Frontend uses React/TypeScript/Vite, React Router, TanStack Query, and a compact CSS token system. M1 routes cover identity and profiles; M2 adds request discovery and management; M3 adds proposal application, developer proposal/CV management, and learner proposal comparison; M4 adds learner selection and learner/selected-developer match views. API calls use credentials-included fetch requests and CSRF cookies; there is no browser token storage. Multipart CV uploads retain browser-generated boundaries. CI targets Java 21 and Node 22. Docker Compose defines local PostgreSQL/API wiring.

The frontend reads `VITE_API_BASE_URL` (default `http://localhost:8080/api/v1`) and checks the sibling `/actuator/health` endpoint. M2 discovery and learner request workflows use the API; public request reads expose OPEN requests only. Backend CORS is restricted to `CODEMATCH_CORS_ALLOWED_ORIGIN` (default `http://localhost:5173`) for API and health paths. Spring Security permits health and explicitly public auth bootstrap, registration/login, skills, public profiles, and public request discovery/details; owner operations require authentication. Sessions are JDBC-backed and use HttpOnly `CMSESSION` cookies, SameSite=Lax, configurable Secure, CSRF cookie/header validation, and BCrypt strength 12. Boot's generated development user is disabled. API errors suppress stack traces and sensitive validation values.

On Windows, use Java 21 from an existing JDK/JBR and set `JAVA_HOME` in the current PowerShell session. IntelliJ IDEA 2024.2.4's bundled JBR is a verified option on the audited workstation. `backend/mvnw.cmd` pins Apache Maven 3.10.1 and does not need global Maven installation. Docker Compose publishes PostgreSQL at `127.0.0.1:5433` mapped to container port 5432, and the API at `127.0.0.1:8080`. The host port avoids the separate Windows PostgreSQL service occupying port 5432.

## Boundaries
- `identity`: account identity and session-backed authentication (M1); one account may use learner and developer capabilities.
- `profiles`: owner-managed developer profile, public read projection, and controlled skills catalog (M1).
- `requests`: learning request lifecycle, ownership, discovery, and saved items (M2).
- `proposals`: submission, owner editing/withdrawal, learner review, and proposal-scoped CV access (M3).
- `cvs`: PDF content validation, opaque private storage, owner management, and controlled download authorization (M3).
- `matching`: learner selection, confirmed-match lifecycle, participant-scoped reads, and proposal selection status (M4).
- `moderation`: reports, review actions, audit trail (M5).

## Runtime configuration
Configuration is environment based. `.env.example` contains local placeholders only. Compose binds PostgreSQL 17 to host `127.0.0.1:5433` → container `5432`, leaving Windows PostgreSQL 18 on 5432 untouched; local JVM datasource defaults to 5433. `/actuator/health` is exposed for container health checks. Never log passwords, session/CSRF tokens, CV bytes, or private CV metadata.

CV metadata and associations are in PostgreSQL; PDF content is stored outside web/static resources through `PrivateCvStorage`. Compose mounts the named `private_cvs` volume at `/var/lib/codematch/private-cvs`; a local API process defaults to `%USERPROFILE%\\.codematch\\private-cvs` or `CODEMATCH_CV_STORAGE_DIR`. Storage keys are opaque UUID values and are not returned in DTOs. The owner manages their files, while only an owner or the learner who owns an associated proposal can download bytes. Delete is blocked while a submitted proposal refers to a CV. Closing a request prevents new applications while preserving existing proposals for authorized review. V4 migration adds these tables and constraints.

M4 persists confirmed matches in PostgreSQL. Selection locks the learning-request row and selected proposal, validates ownership and `SUBMITTED` status, changes the request to `MATCHED`, and inserts the match in one transaction. V5 adds one-match-per-request uniqueness and composite foreign keys tying the learner and selected developer/proposal to the same request. A matched request blocks new proposals; proposals remain historical and immutable after selection. Only the owning learner and selected developer can read match details.

## M5 moderation and abuse controls
- A Spring MVC interceptor applies configurable process-local limits to sensitive API paths and returns standardized 429 responses.
- Reports and audit events are persisted in PostgreSQL via Flyway V6. Admin paths require database-derived `ROLE_ADMIN`; frontend state does not grant access.
- Hidden requests remain stored for their owner/moderation history but are excluded from public discovery.
- Shared rate-limit storage and automated audit retention are deployment requirements before horizontal scaling/production.
