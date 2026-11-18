# M6 Deployment Plan

**Status:** local planning only. No cloud resource, account, paid plan, domain, or public deployment has been created. The staging recommendation below is provisional and requires approval before provisioning.

**Pricing snapshot:** 2026-11-18. Public list prices are estimates before tax, data growth, domain registration, and any region-specific adjustments. Re-check each provider's calculator and checkout before approving spend.

## Current architecture

CodeMatch is a modular monolith: React 19, TypeScript and Vite frontend; one Java 21/Spring Boot API; PostgreSQL with Flyway migrations V1–V6; JDBC-backed server sessions; and filesystem-backed private PDF CVs. The application is already containerized for local development. The normal Compose stack has PostgreSQL on loopback host port 5433 (container port 5432), API on loopback port 8080, and named PostgreSQL/CV volumes. The separate E2E Compose stack uses its own ports and volumes.

Authentication uses an HttpOnly `CMSESSION` cookie, `SameSite=Lax`, a readable `XSRF-TOKEN` cookie plus `X-XSRF-TOKEN` header for mutations, credentialed fetch, and a single configured CORS origin. This is verified locally for the current localhost setup. Hosting the browser app and API on unrelated origins would require additional real-browser verification of cookie and CSRF behavior; do not solve it by weakening CSRF, setting wildcard CORS, or making private files public.

The API has health/info actuator exposure, database-backed reports and audit events, and process-local rate limits. Audit retention is manual. The current CV adapter writes private PDFs to a filesystem path; local Compose supplies a named volume, but no off-host backup or cloud object-storage adapter exists. M5 verification passed on the isolated local Postgres and real browser stack; this is not deployment or pilot evidence.

## Provisional recommendation: lowest-cost viable staging

Use one small **Hetzner Cloud CAX11** ARM64 Linux VM for a controlled, time-boxed pilot, provided measured resource use fits and an external backup destination is separately approved. Run Caddy, the Spring Boot container, and PostgreSQL in a hardened Compose project. Serve the built React application and proxy `/api/v1` and the narrowly exposed health path from the same HTTPS origin. Keep PostgreSQL on an internal container network with no public port. Keep CV PDFs in a dedicated private persistent volume; do not return filesystem or object-storage URLs. Restrict SSH to a known administrative IP/key, expose only HTTPS (and HTTP solely for certificate issuance/redirect), apply OS/container updates, and configure a firewall.

The same-origin route preserves the current cookie/CSRF design and avoids cross-site session-cookie changes. The VM is a single failure domain and requires hands-on patching and recovery. Its European locations may add latency for users in Vietnam. Before inviting anyone, confirm region latency, the chosen VM's memory/disk headroom, backup target, restore results, privacy/retention notice, incident contact and CV deletion procedure. This is a **staging/pilot candidate**, not a highly available production design.

### Cost estimate (USD/month)

| Component | Public estimate | Notes |
| --- | ---: | --- |
| CAX11 compute | $6.99 | Current published monthly price, excluding Primary IPv4; 2 ARM vCPU, 4 GB RAM, 40 GB NVMe. Availability is limited by region. |
| Primary IPv4 | $0.60 | Billed separately. |
| Provider VM backups | about $1.40 | Hetzner documents backups as 20% of server price; this is not an independent logical database/CV backup. |
| Minimum subtotal above | about $8.99 | Before tax, domain, and external encrypted backup storage. |
| Off-host encrypted database and CV backup | Not verified | Must be added and restore-tested; obtain its current price before approval. |
| Domain | Not verified | Depends on domain choice/ownership; not included. |

The $0–10 target is feasible only for the VM plus provider backups before tax/domain and before pricing the independently restorable backup destination. Therefore the complete safe pilot may exceed $10/month. Do not omit off-host backups to meet the target.

Source: [Hetzner June 2026 cloud price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [Primary IPv4 pricing](https://docs.hetzner.com/cloud/servers/primary-ips/overview/), [backup pricing](https://docs.hetzner.com/cloud/billing/faq/), and [CAX11 specifications](https://www.hetzner.com/cloud/cost-optimized/).

## Provider comparison

| Provider | Candidate shape | Estimated recurring cost | Benefits | Constraints and risks |
| --- | --- | ---: | --- | --- |
| **Hetzner VPS (recommended low-cost)** | CAX11 ARM64 VM; Caddy + API + PostgreSQL + private CV volume; encrypted off-host backups | At least **$8.99** for VM, IPv4 and provider VM backup, plus external backup storage, domain, tax and possible egress | Lowest published compute cost; one HTTPS origin; full control of persistent DB/CV volumes; no free-tier sleep | Single VM; operator owns OS hardening, updates, firewall, Docker, database pooling, alerts, backup/restore and incidents; European data locations can add Vietnam latency; off-host backup and domain prices not included; provider snapshots alone do not prove restoreability |
| **Render** | Static Site + paid Docker web service + paid Render Postgres + private persistent disk for CVs | Roughly **$13–$31+** for continuously available API and DB, plus Postgres storage ($0.30/GB/month), CV disk ($0.25/GB/month), and egress beyond included allowance; re-check chosen plans | Managed TLS, private service networking, managed Postgres, operationally simpler deploy/log experience | Free API sleeps after 15 minutes; free Postgres expires after 30 days and free filesystem is ephemeral, so free is unsuitable for pilot data. Java requires Docker. Separate static/API origins need a deliberate same-site CSRF/cookie design or same-origin proxy. |
| **Railway** | Static frontend + API service + PostgreSQL service and persistent volume | Common always-on small shape is approximately **$15–$35/month**, usage-dependent; $5 Hobby subscription includes up to $5 resource usage, then CPU/RAM/storage/egress are metered | Fast GitHub/Docker deployment; private networking; volumes, health checks, logs and easy rollback | Usage can rise with uptime/traffic; Free tier is limited and should not be treated as durable pilot hosting; validate disk/backup behavior and resource limits; cross-origin cookie/CSRF issue still needs a solution. |
| **Azure alternative** | Linux App Service B1 container (serve SPA and API same-origin) + Azure Database for PostgreSQL Flexible Server B1ms + private Azure Blob container for CVs | About **$25.55/month** for listed B1 compute ($13.14) + B1ms Postgres compute ($12.41), before database storage/backup, Blob operations/storage, egress, monitoring, tax, and networking | Managed app and database, private object-storage controls, Azure identity/secrets integrations, strong cloud-engineering demonstration | Higher baseline cost; prices vary by region/offer; managed database network restrictions, secret setup, storage lifecycle and monitoring need careful configuration. Azure App Service F1 is not production-supported and must not be assumed as the pilot tier. |

Pricing evidence: [Render compute and storage pricing](https://render.com/pricing), [Render free-plan limitations](https://render.com/docs/free), [Railway pricing](https://docs.railway.com/pricing), [Azure App Service Linux pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/linux/), [Azure PostgreSQL Flexible Server pricing](https://azure.microsoft.com/en-us/pricing/details/postgresql/flexible-server/), and [Azure Blob Storage pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/). Azure page examples are public pay-as-you-go list figures and not a quote for a selected region or account.

Render's published free-plan documentation states that free web services spin down after 15 idle minutes, free PostgreSQL expires after 30 days, and free web filesystems are ephemeral. Railway documents a $5 Hobby plan with metered resource pricing. Neither free tier is the safe default for retaining pilot accounts, proposals, audit rows, or CVs.

## Azure-oriented alternative

Use Azure Container Registry/GitHub Actions to publish a pinned container image, Linux App Service B1 to run a single-origin container serving SPA and API, Azure Database for PostgreSQL Flexible Server with TLS and restricted network access, Azure Key Vault for runtime secrets, and a private Blob container for CV files using managed identity. Configure HTTPS, database backups, storage lifecycle/retention, alerts and least privilege. This reduces VM maintenance and demonstrates Azure managed services, but costs materially more than the target and needs additional cross-service network/configuration work. Validate the exact region and whether private connectivity is available within the selected budget before choosing this option.

## Environment separation and deployment process

- **Local:** existing loopback-only Docker Compose; `.env` is local and ignored; sample values remain clearly local-only.
- **Automated tests:** disposable Testcontainers databases and isolated E2E Compose project; no shared staging or production data.
- **Staging:** dedicated provider account/project, domain and database, unique secrets, persistent private CV path/bucket, restricted admin provisioning, backup schedule and explicit origins. No local or CI secrets reused.
- **Future production:** separately approved capacity, threat/privacy review, off-host backup, documented alert ownership, operational on-call and retention policy; no production target exists yet.

Deployment after approval: CI builds/tests and emits an immutable image/artifact; a protected deployment workflow requires environment approval; take a database backup; run backward-compatible Flyway migrations; deploy; verify readiness and smoke flows; observe error/latency/database signals; retain the previous image and migration-aware rollback instructions. Never roll back schema changes by deleting or overwriting data. Stop rollout on failed health, migration, CV access, CSRF/session or smoke checks.

## Persistence, backup and recovery

Use PostgreSQL persistent storage and a private, non-public CV volume/bucket. Keep DB and files on a durable medium, but do not treat a volume, provider snapshot, or GitHub artifact as a backup. Produce encrypted logical DB dumps and encrypted CV backups to separately permissioned off-host storage; use separate credentials and no public links. Define retention and user deletion handling before pilot. Verify a restore into disposable infrastructure against Flyway schema history, counts/integrity checks, and CV object/file hashes; test authenticated owner access and cross-user denial after recovery. Never exercise recovery against a shared/live database.

## Deployment and rollback

No public deployment is authorized by this plan. Before deployment approval, provide the selected provider, named resources, region, monthly estimate/maximum, billing account, domain, backup destination, data location, and planned pilot dates. Rollback should repoint the service to the previous immutable application image only when the current schema remains backward-compatible; otherwise use a forward fix. Restore data only into an isolated recovery target until independently validated. Keep the maintenance/incident communication and pilot shutdown procedure ready before onboarding users.

## Security and operational risks

- The current process-local rate limiter does not coordinate across replicas; keep one API replica until a shared store is implemented and verified.
- Session authentication requires Secure cookies under HTTPS, `SameSite=Lax`, CSRF tokens and an exact credentialed CORS origin. A split-origin layout must be browser-tested and configured explicitly; do not use `SameSite=None` or wildcard CORS as a shortcut.
- CV PDFs and user-submitted learning data are sensitive. Do not use public object buckets or expose storage URLs. Malware scanning is not implemented; decide whether scanning or an explicit pilot restriction/acceptance policy is required before inviting users.
- Admin access has no default account. Provision through a reviewed, auditable operator-only process and verify a non-admin remains denied.
- Audit retention is manual. Define retention/deletion and backup expiration without retaining personal data indefinitely.
- One VM has no high availability; provider region latency, resource exhaustion, disk exhaustion, provider account loss and operator availability can interrupt the pilot.
- Current full frontend audit includes a documented development-only `picomatch` advisory; production dependency audit was clean at M5. Re-run audits before external launch.
- Consent, privacy notice, support contact, data deletion, incident escalation, and legal/privacy obligations for Vietnamese participants need owner review. This plan is not legal advice or a compliance certification.

## Approval gates and required external resources

**Before creating billable/public resources, obtain explicit approval** for provider/region, maximum monthly spend, account/project, domain and DNS, object/off-host backup destination, data location, terms/billing, and public deployment. No provider account, billing, server, managed database, storage, DNS record, TLS endpoint or deployment has been created by this work.

Before inviting pilot participants, separately approve pilot scope and dates, privacy/consent text, support and moderation coverage, admin provisioning, data retention/deletion, backup/restore evidence, malware/file handling decision, and participant recruitment. Synthetic E2E accounts and traffic are excluded from product analytics.

## M6 implementation status (2026-11-18)

- **Locally verified:** environment-specific examples/profiles, same-origin local Vite proxy, pinned Docker base-image indexes (including Linux ARM64), restricted management endpoints, metrics/correlation, aggregate admin overview, candidate staging Compose/Caddy config, real browser E2E, CV volume restart, disposable logical database/file-archive restore smoke, bounded read/proposal/match concurrency checks, runbook, pilot validation criteria and CI artifact/dependency checks.
- **Not completed by design:** no cloud provider account or resource, DNS/domain, public staging, deployment workflow/credentials, encrypted off-host backup destination, or real-user pilot. The cloud/deployment gate remains closed pending the approval information listed above. Do not treat the local unencrypted restore smoke as evidence of an encrypted recovery system.
- **Owner/operator prerequisites before invitation:** approve cost/provider/region/data location; configure and test encrypted off-host backup/restore; assign an operator to create/revoke the first admin account through a reviewed transaction plus audit record; finalize consent/privacy, deletion, support/moderation cover, retention, incident contact, and the file-malware policy. CI must pass on the review PR before merge.
- **Outstanding security item:** the production npm dependency audit is clean, but the development dependency tree reports 11 high paths through `picomatch@4.0.7`; see `SECURITY_MODEL.md`. Re-run all audits immediately before any external launch.
