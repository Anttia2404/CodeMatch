# Decision log

## 2026-11-20 — Shape the landing page around learning discovery
Keep the hero copy and learning illustration balanced as separate visual zones on desktop, while repositioning the same illustration for narrow screens. This direction draws on more than ten tutoring and learning products: surface discovery early, make the learning goal and next action clear, and avoid unsupported social proof or invented learner metrics.

## 2026-11-20 — Keep CodeMatch's blue palette with a decorative Three.js scene
Keep CodeMatch's light blue interface palette while borrowing TrustAgent's spatial hero treatment. Use a small custom scene of an open learning book and connected skill nodes; load Three.js only for the homepage scene, stop rendering when it leaves the viewport, honor reduced-motion preferences, and retain a CSS fallback when WebGL is unavailable. The scene is decorative and contains no user or activity data.

## 2026-11-18 — Keep pilot deployment behind an explicit approval gate
Document a same-origin Caddy + Spring Boot + PostgreSQL candidate topology, strict staging/production configuration, and operator runbooks without creating cloud resources or deploying. Preserve local Windows PostgreSQL 18 on port 5432; local Docker PostgreSQL uses loopback port 5433. Use isolated synthetic-data tests for real-browser, storage-restart and backup/restore evidence. Off-host encrypted backup, admin provisioning, privacy/retention and malware scanning remain pilot prerequisites.

## 2026-11-18 — Keep pilot metrics aggregate and low-cardinality
Record a limited event set without user identifiers and calculate funnel aggregates from existing relational data at read time, behind `ROLE_ADMIN`. Do not add a redundant analytics store or expose metrics to ordinary accounts. Keep the application single-replica because rate limits are process-local.

## 2026-11-18 — Add V6 moderation, audit and configurable rate limits
- Admin authority is a database-controlled capability (`users.is_admin`, default false); public registration cannot set it.
- Reports use a polymorphic target ID with service-level visibility checks and a unique reporter/target constraint. Report responses omit target content.
- Audit events store security metadata only. Retention cleanup remains an operational requirement before production.
- Rate limits use process-local fixed windows to avoid adding infrastructure; multi-instance deployment must replace them with shared infrastructure.

## 2026-11-17 — Use a modular monolith
Keep a single Spring Boot deployable application and PostgreSQL database. The M0 domain is cohesive and has no demonstrated scaling need for distributed services.

## 2026-11-17 — Use CSS tokens before adding a component kit
Use a compact CSS token system and hand-built accessible primitives for M0. Tailwind and shadcn/ui are deferred until reusable component needs are proven; this avoids introducing config/dependency weight for a single shell.

## 2026-11-17 — Use static local discovery examples in M0
Discovery needs a product-shaped visual foundation before API functionality. Examples are local-only, contain no ratings or verification claims, and are not connected to a live service.

## 2026-11-17 — Defer authentication mechanics decision to M1
Choose session/cookie or token model before implementing authentication, based on deployment topology and CSRF/CORS constraints. No auth shortcuts are introduced in M0.

## 2026-11-17 — Require deny-by-default API security until M1
Allow public actuator health checks for container readiness and deny all other paths until authentication and authorization are implemented. Configure CORS to one environment-selected local origin rather than using a wildcard.

## 2026-11-17 — Pin the Maven Wrapper and Maven distribution
Use the Apache Maven Wrapper 3.3.4 scripts/source and Maven 3.10.1 distribution. Wrapper source was obtained from the official Maven Central artifact and verified against its published SHA-512. Developers need not install Maven globally.

## 2026-11-17 — Use a preinstalled JDK 21 without changing system settings
The audited workstation has Java 21.0.4 in IntelliJ IDEA's JBR. Instructions set `JAVA_HOME` and prepend its `bin` directory only for the current PowerShell process. Existing system Java 8 settings remain untouched.

## 2026-11-17 — Keep local Compose services on loopback
Publish the local API and PostgreSQL ports on `127.0.0.1` only. Sample credentials are explicitly local-development values and `.env` remains ignored.

## 2026-11-17 — Use JDBC-backed sessions for M1
Use Spring Security sessions stored by Spring Session JDBC, with HttpOnly `CMSESSION`, SameSite=Lax, configurable Secure, CSRF cookie/header validation, and a strict single-origin credentialed CORS policy. This keeps bearer credentials out of browser storage and fits the same-origin local frontend/API development setup.

## 2026-11-17 — A profile enables developer capabilities without replacing learner use
Every account may use learner features; one owner-managed developer profile signals developer capabilities. M1 does not impose mutually exclusive account roles.

## 2026-11-17 — Keep skill selection controlled
M1 seeds a normalized skill catalog in Flyway and accepts only known skill identifiers in profile writes; clients cannot create arbitrary catalog entries.

## 2026-11-17 — Replace demo discovery with persisted learning requests in M2
Learning request discovery reads OPEN requests from PostgreSQL and uses controlled skill filters. Learners own draft/open/closed lifecycle actions and saved requests. Budget range filtering requires an explicit unit because hourly, per-session, and total VND values are not comparable without conversion.

## 2026-11-18 — Keep M3 proposals simple and database-enforced
Proposal status is limited to SUBMITTED and WITHDRAWN; acceptance and matching belong to M4. A partial unique index prevents concurrent duplicate active proposals. Request row locking serializes submission against close. Existing proposals stay available to both authorized participants after request closure, and closure rejects new submissions.

## 2026-11-18 — Store CV bytes privately behind an adapter
Use a filesystem-backed `PrivateCvStorage` adapter for local development, with opaque UUID storage keys and files outside public static directories. Docker Compose uses a dedicated named volume; local JVM runs use a per-user private directory. Validate PDF bytes through PDFBox in addition to extension and size. The API streams bytes only for the owner or the learner associated with that proposal. No paid object storage is needed for local development; the interface allows a future adapter.

## 2026-11-18 — Protect attached CV deletion
Reject deletion while a submitted proposal references a CV; after withdrawal, deletion is allowed. CV replacement updates the owner's selected file in place so an existing proposal continues to refer to that developer-controlled CV. No automatic CV retention schedule is implied; developers should remove files when no longer needed.

## 2026-11-18 — Confirm one developer match per learning request
Keep the match lifecycle to a single `CONFIRMED` state. Selection is allowed only for a submitted proposal on an OPEN request owned by the learner. In one transaction, lock the request and proposal, insert the match, and transition the request to `MATCHED`; V5 uniqueness and composite foreign keys protect the relationship even outside the service. Repeating the same selection is idempotent; a different selection conflicts. Retain unselected proposal rows with their original lifecycle status and report selection outcome separately. After selection, freeze the request and all its proposals so the selected offer remains stable. Match details are visible only to the learner and selected developer.

## 2026-11-18 — Keep the unresolved development-tool advisory visible
The current full npm audit reports 11 high-severity dependency paths caused by `picomatch@4.0.7` in the Vite/Vitest development toolchain; `npm audit --omit=dev` is clean. The registry has no newer 4.x release, and npm's suggested fix downgrades Vitest to 3.1.4. Keep the compatible tested toolchain, document the finding, and revisit when upstream publishes a patch rather than forcing an unreviewed major downgrade.
