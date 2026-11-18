# Pilot validation plan

No external pilot or public environment is authorized by this plan. Run the bounded validation below against the isolated local E2E Compose project with synthetic accounts/data only.

## Hypothesis and proposed pilot design

> Vietnamese learners seeking practical coding help will publish learning requests, and independent developers will submit relevant proposals.

Proposed initial sample: 5–10 learners and 5–10 developers, voluntary participation, no payments, for 2–4 weeks. These are planning targets, not current users or validated demand. Agree privacy/consent, support coverage, moderation ownership, retention and participant recruitment before invitations. Exclude synthetic E2E traffic and test accounts from any real-pilot reporting.

## Signals and proposed decision criteria

- Request publication rate: participating learner accounts that publish at least one request ÷ participating learner accounts.
- Proposal coverage: published requests receiving at least one submitted proposal within 7 days ÷ published requests with a full 7-day observation window.
- Match conversion: published requests with a confirmed match ÷ published requests with a 14-day observation window.
- Time to first proposal/match: elapsed minutes from request publication to the first proposal/confirmed match; report median and range for the small pilot as well as the existing admin average.
- Proposal relevance: learner's voluntary “relevant / partly relevant / not relevant” feedback, counted only from actual feedback.
- Friction and abandonment: voluntary feedback from learners/developers, plus funnel step counts; do not infer reasons that the app does not collect.

Suggested initial success signal after at least two weeks: at least 60% of participating learners publish a request, at least half of eligible published requests receive a proposal within seven days, and no unresolved high-severity privacy/security incident. These are proposed small-pilot decision thresholds, not statistical proof or a product-market-fit claim. Iterate when users reach requests but proposal coverage or relevance is below the threshold; change one onboarding/discovery issue at a time and collect fresh evidence. Stop onboarding immediately for unauthorized CV access, suspected data exposure/loss, failed recovery, an unstaffed safety report, inability to respond to participants, or cost above the approved cap. The owner may amend criteria before invitations, not after seeing results.

### Feedback collection template

Collect only with informed consent, use a separate approved feedback form, and avoid asking for CVs, passwords, session details or sensitive personal data.

```text
Role (learner / developer / prefer not to say):
Which task were you trying to complete?
Where did you get stuck, if anywhere?
Was the request/proposal information clear? What was missing?
If you received a proposal, how relevant was it? (relevant / partly / not relevant / no proposal)
How long did the next step take, approximately?
What would make you stop using CodeMatch?
May the team contact you about this feedback? (yes/no; contact collected separately)
Anything else (optional):
```

## Preflight

- Confirm the Git branch and clean/understood diff, Java 21, Docker Linux engine, free local test ports, and that the compose project is the uniquely named E2E stack.
- Apply Flyway migrations to the disposable PostgreSQL service; verify the schema and `flyway_schema_history` success rows.
- Run backend `compile`, `test`, and `verify`; record Surefire totals and every skip. A Testcontainers-disabled run is a failure of the required verification, not a pass.
- Run frontend build, lint and Vitest. Then run Playwright real-browser integration with `CODEMATCH_REAL_E2E=1`, same-origin Vite proxy and no mocks. Verify registration, login/logout, CSRF-protected writes, learner/developer flows, proposal/CV download, selection, participant boundaries, non-admin denial, live health, and CV persistence after API restart.
- Run the disposable backup/restore smoke; verify synthetic row and file checksums after restore.

## Bounded local load check

Against the isolated stack only, run `node scripts/bounded-health-smoke.mjs` (40 read-only GETs, maximum concurrency 4, to the live same-origin proxied skills endpoint) and `node scripts/bounded-workflow-smoke.mjs` (four synthetic developer submissions and four competing learner selections). Both scripts use only synthetic accounts on the isolated E2E database; do not target shared databases or public resources. Record endpoint/workload, concurrency, duration, status/error counts, p50/p95 latency, PostgreSQL sessions and container resource use. A passing smoke is not a capacity, availability, or production load claim. Stop immediately on health degradation, elevated errors, or resource pressure.

## Security/dependency review

Run `npm audit --omit=dev` for shipped frontend dependencies and inspect the full audit separately for dev-toolchain advisories. Review Maven dependency versions and container base tags, environment handling, CORS/session/CSRF, management endpoint authorization, log contents, private CV access, and Compose port/network exposure. Record advisory identifiers, affected scope and remediation/acceptance owner. Do not conceal a finding by suppressing audit output.

## Acceptance and evidence

Attach exact commands, runtime versions, test counts/skips, migration/schema evidence, real browser/API results, backup/restore checksums, bounded-load parameters/results, audit findings and limitations. A local pass does not authorize public hosting, participant data, billing or production claims. Owner approval is a separate gate.
