# Decision log

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
