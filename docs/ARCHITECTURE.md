# Architecture

## M0 shape
Modular monolith: a React 19 + TypeScript + Vite web client; a Java 21 + Spring Boot API; PostgreSQL as the system of record; Flyway schema migrations. The API is organized by domain modules within one deployable application. Private files will use a storage abstraction and authorization-checked download endpoints.

```text
Browser ── HTTPS/JSON ── Spring Boot API ── PostgreSQL
                              │
                              └── Private file storage (future adapter)
```

Frontend uses React/TypeScript/Vite, TanStack Query for the API health query, Lucide icons, and a compact CSS token system. React Hook Form and Zod are installed for later forms. M0.5 retains the small CSS system rather than introducing Tailwind/shadcn scaffolding without component requirements. CI targets Java 21 and Node 22. Docker Compose defines local PostgreSQL/API wiring.

The frontend reads `VITE_API_BASE_URL` (default `http://localhost:8080/api/v1`) and checks the sibling `/actuator/health` endpoint. Discovery cards remain explicit static demo data until request APIs are implemented. Backend CORS is restricted to `CODEMATCH_CORS_ALLOWED_ORIGIN` (default `http://localhost:5173`) for API and health paths. Until authentication/API routes exist, Spring Security permits health checks and denies all other routes; Boot's generated development user is disabled to prevent credentials being printed to logs. API error responses suppress stack traces and validation details.

On Windows, use Java 21 from an existing JDK/JBR and set `JAVA_HOME` in the current PowerShell session. IntelliJ IDEA 2024.2.4's bundled JBR is a verified option on the audited workstation. `backend/mvnw.cmd` pins Apache Maven 3.10.1 and does not need global Maven installation. Docker Compose publishes PostgreSQL at `127.0.0.1:5433` mapped to container port 5432, and the API at `127.0.0.1:8080`. The host port avoids the separate Windows PostgreSQL service occupying port 5432.

## Boundaries
- `identity`: account identity and roles (later M1).
- `profiles`: learner/developer public and private profile data (later M1).
- `requests`: learning request lifecycle and ownership (later M2).
- `proposals`: proposal lifecycle and CV associations (later M3).
- `matching`: acceptance and match lifecycle (later M4).
- `moderation`: reports, review actions, audit trail (later M5).

## Runtime configuration
Configuration is environment based. `.env.example` contains local placeholders only. `/actuator/health` is exposed for container health checks. Structured logging is configured through Spring Boot's JSON console option when supported by deployment configuration; never log passwords, tokens, CV bytes, or private CV metadata.
