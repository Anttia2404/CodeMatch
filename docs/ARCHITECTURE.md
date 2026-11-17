# Architecture

## M0 shape
Modular monolith: a React 19 + TypeScript + Vite web client; a Java 21 + Spring Boot API; PostgreSQL as the system of record; Flyway schema migrations. The API is organized by domain modules within one deployable application. Private files will use a storage abstraction and authorization-checked download endpoints.

```text
Browser ── HTTPS/JSON ── Spring Boot API ── PostgreSQL
                              │
                              └── Private file storage (future adapter)
```

Frontend uses React/TypeScript/Vite, React Router, TanStack Query, and a compact CSS token system. The M1 routes cover registration, login, account, developer profile management, public profiles, skills, and the home discovery page. API calls use credentials-included fetch requests and CSRF cookies; there is no browser token storage. CI targets Java 21 and Node 22. Docker Compose defines local PostgreSQL/API wiring.

The frontend reads `VITE_API_BASE_URL` (default `http://localhost:8080/api/v1`) and checks the sibling `/actuator/health` endpoint. Discovery cards remain explicit static demo data until request APIs are implemented. Backend CORS is restricted to `CODEMATCH_CORS_ALLOWED_ORIGIN` (default `http://localhost:5173`) for API and health paths. Spring Security permits health and the explicitly public auth bootstrap, registration/login, skills, and public profile paths; owner operations require authentication. Sessions are JDBC-backed and use HttpOnly `CMSESSION` cookies, SameSite=Lax, configurable Secure, CSRF cookie/header validation, and BCrypt strength 12. Boot's generated development user is disabled. API errors suppress stack traces and sensitive validation values.

On Windows, use Java 21 from an existing JDK/JBR and set `JAVA_HOME` in the current PowerShell session. IntelliJ IDEA 2024.2.4's bundled JBR is a verified option on the audited workstation. `backend/mvnw.cmd` pins Apache Maven 3.10.1 and does not need global Maven installation. Docker Compose publishes PostgreSQL at `127.0.0.1:5433` mapped to container port 5432, and the API at `127.0.0.1:8080`. The host port avoids the separate Windows PostgreSQL service occupying port 5432.

## Boundaries
- `identity`: account identity and session-backed authentication (M1); one account may use learner and developer capabilities.
- `profiles`: owner-managed developer profile, public read projection, and controlled skills catalog (M1).
- `requests`: learning request lifecycle and ownership (later M2).
- `proposals`: proposal lifecycle and CV associations (later M3).
- `matching`: acceptance and match lifecycle (later M4).
- `moderation`: reports, review actions, audit trail (later M5).

## Runtime configuration
Configuration is environment based. `.env.example` contains local placeholders only. Compose binds PostgreSQL 17 to host `127.0.0.1:5433` → container `5432`, leaving Windows PostgreSQL 18 on 5432 untouched; local JVM datasource defaults to 5433. `/actuator/health` is exposed for container health checks. Never log passwords, session/CSRF tokens, CV bytes, or private CV metadata.
