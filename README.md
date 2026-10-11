# SIM HAF - Playwright UAT Automation

Requirement-based UAT automation for **SIM HAF**, built with
[Playwright](https://playwright.dev/) and TypeScript.

## Purpose

Automate the execution of the **approved** requirement-based test scenarios,
starting with a minimal, reviewable authentication vertical slice that proves
out the architecture (configuration, fixtures, page objects, test data,
traceability, reporting) before scaling to the rest of the journeys.

## Requirement-first testing philosophy

The approved test scenarios are the **source of truth** for what must be
tested. Requirement-based expected behavior is authored independently from the
current application implementation.

- Tests are designed from the approved scenarios, not from application code.
- No scenario is invented, removed, or reworded.
- Every implemented test carries an explicit `TC-REQ-xxx` traceability id.
- Where an implementation detail is genuinely unknown (because development
  source code has deliberately not been inspected), it is **documented as
  unresolved** rather than guessed.

> **Development source code is intentionally excluded from test design in Phase 1.**

## Approved scenario source

- Workbook: `SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx` (sheet `SCENARIOS`)
- The workbook is **read-only** and currently lives **outside this repository**
  (under the workspace `../docs/`). Reporting also accepts it via
  `SCENARIO_BASELINE_PATH`.
- A **derived, committed, credential-free snapshot** of the approved baseline
  lives at `baseline/scenarios.json` (339 scenarios, 48 flow units) so CI can
  reconcile results without the workbook. Regenerate it with
  `npm run baseline:build`; check it has not drifted with `npm run baseline:verify`.
- 339 approved scenarios (not regenerated, not renumbered here)
- Phase 1 slice: journey **J-S1 - Login & Pilih Haul Akbar (FR-02, Auth, SR-8)**,
  scenarios **TC-REQ-001 … TC-REQ-011** (11 scenarios)
- Phase 3 slice: journey **J-S2 - Kelola Struktur Organisasi: Bidang → Khidmah
  (UC-1, FR-03, 15.1.1–15.1.2)**, scenarios **TC-REQ-012 … TC-REQ-021**
  (10 scenarios)

## Reporting

Two outputs are produced for a run:

1. A consolidated **Playwright HTML report** (traces/screenshots/videos).
2. A readable **scenario execution summary** (Excel + CSV + JSON) reconciled
   against **all 339 approved scenarios** (not only the discovered tests).

```bash
npm run batches:validate   # list-only; no staging access
npm run merge:reports -- --run-id <run>   # batch blobs -> reports/html/<run>
npm run summary -- --run-id <run>         # -> reports/summary/{summary.xlsx,csv,metrics.csv,journeys.csv,summary.json}
```

Batches (`reporting.config.json`) exist only to respect the login throttle
(5/min/email+IP); see `docs/REPORTING.md` for the architecture, status model,
coverage/pass-rate formulas, GitHub Actions usage, required secrets and
limitations.

## Current phase

**Phase 3 - Pengaturan / Struktur Organisasi vertical slice (J-S2).**

The approved J-S2 scenarios are registered with full traceability:

- **TC-REQ-012 … TC-REQ-019** - executable-eligible (session-guarded).
- **TC-REQ-020, TC-REQ-021** - implemented as registered tests that are
  explicitly skipped/deferred. They are rated "Partially Ready" in
  `docs/DEVELOPMENT_READINESS_ASSESSMENT.md` (explicit delete-restraint for a
  Bidang with child Khidmah, and for an in-use Khidmah, is not evidenced). The
  approved expected results are preserved verbatim; nothing is silently omitted.

The remaining journeys are intentionally out of scope until this slice is
reviewed and approved.

## Project structure

```
sim-haf-playwright/
├── tests/
│   ├── auth/
│   │   └── auth.spec.ts        # TC-REQ-001 .. TC-REQ-011 (approved J-S1 slice)
│   ├── pengaturan/
│   │   └── struktur-organisasi.spec.ts  # TC-REQ-012 .. TC-REQ-021 (approved J-S2 slice)
│   └── e2e/                    # reserved for end-to-end journeys (not implemented yet)
├── pages/
│   ├── LoginPage.ts            # UI interaction only; TODO-marked locators
│   ├── DashboardPage.ts        # UI interaction only; TODO-marked locators
│   ├── BidangPage.ts           # J-S2 Bidang list/create/edit/delete (source-grounded)
│   └── KhidmahPage.ts          # J-S2 Seksi/Khidmah list/create/edit/delete
├── fixtures/
│   └── auth.fixture.ts         # page-object fixtures + scenario declaration/guards
├── test-data/
│   ├── users.ts                # env-driven identities (no hardcoded credentials)
│   └── struktur-organisasi.ts  # J-S2 unique-name builders + verbatim messages
├── utils/
│   ├── helpers.ts              # traceability annotations + config guards
│   └── session.ts              # signIn() helper reusing the login pattern
├── scripts/                    # reporting system (source of the summary/HTML merge)
│   ├── build-baseline.mjs      # workbook -> baseline/scenarios.json (read-only)
│   ├── verify-baseline.mjs     # drift check: snapshot vs workbook (fails on diff)
│   ├── validate-batches.mjs    # list-only batch coverage check
│   ├── merge-reports.mjs       # per-batch blobs -> one HTML report
│   ├── generate-summary.mjs    # batch JSON + baseline -> xlsx/csv/json summary
│   ├── reporting/              # workbook, baseline, snapshot, collect, status, summary, xlsx
│   └── __fixtures__/json/      # synthetic JSON for reporting self-tests
├── baseline/
│   └── scenarios.json          # derived, credential-free snapshot of the workbook
├── reporting.config.json       # batch plan + login policy
├── .github/workflows/
│   ├── ci.yml                       # safe push/PR checks (no staging, no secrets)
│   └── playwright-uat-report.yml    # manual UAT run: batches + reports + artifacts
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── docs/REPORTING.md           # reporting architecture, statuses, formulas, secrets
└── README.md
```

## Install dependencies

```bash
npm install
npx playwright install --with-deps chromium
```

## Configure the environment

```bash
cp .env.example .env
# then fill in BASE_URL and the UAT test credentials
```

Configuration is entirely environment-driven:

| Variable | Purpose | Default |
| --- | --- | --- |
| `BASE_URL` | UAT application base URL | _(none - tests skip if unset)_ |
| `LOGIN_PATH` | Login screen path | `/login` |
| `PROTECTED_PATH` | Protected page used for redirect checks | `/dashboard` |
| `RETRIES` | Playwright retries | `0` |
| `WORKERS` | Parallel workers | Playwright default |
| `HEADLESS` | Run headless | `true` |
| `UAT_EMAIL_SUPERADMIN` / `UAT_PASSWORD_SUPERADMIN` | Superadmin identity | _(none)_ |
| `UAT_OTP_REQUIRED_SUPERADMIN` | Whether the Superadmin identity needs a 2FA/OTP step | derived from TOTP secret presence |
| `UAT_TOTP_SECRET_SUPERADMIN` | TOTP secret (only for OTP-required identities) | _(none)_ |
| `UAT_EMAIL_INACTIVE` / `UAT_PASSWORD_INACTIVE` | Inactive account (TC-REQ-010, deferred) | _(none)_ |
| `UAT_EMAIL_INVALID` / `UAT_PASSWORD_INVALID` | TC-REQ-006 invalid pair | built-in deliberately-wrong default |
| `BIDANG_PATH` | J-S2 Bidang list path | `/pengaturan/bidang` |
| `KHIDMAH_PATH` | J-S2 Khidmah list path | `/pengaturan/khidmah` |

No credentials or secrets are stored in this repository. Credential variable
names follow `<FIELD>_<IDENTITY>` with a `UAT_` prefix (plus `BASE_URL`); the
GitHub Secrets for the manual UAT workflow use exactly these names.

## Run Playwright

```bash
npm test                 # all tests
npm run test:auth        # the authentication suite only
npm run test:pengaturan  # the Pengaturan / Struktur Organisasi suite only
npm run test:headed      # headed mode
npm run test:list        # discover tests without running them
npm run typecheck        # TypeScript validation
npm run report           # open the last HTML report
```

Or directly:

```bash
npx playwright test tests/auth
npx playwright test --list
```

Behavior when unconfigured: if `BASE_URL` (or the required credentials) is not
provided, the affected tests are **skipped with an explicit reason** rather than
failing or faking a result. Deferred scenarios are registered so they remain
discoverable and traceable, but are skipped at runtime.

## How traceability works

Each test is registered with the approved scenario id as the first part of its
title, and the same metadata is pushed as machine-readable annotations:

```
TC-REQ-001 - Buka halaman login & masukkan kredensial valid
```

Annotations emitted per test:

- `scenario-id` → `TC-REQ-001`
- `scenario` → approved scenario text
- `requirement-id` → `FR-02, SR-6, SR-8`
- `journey` → `J-S1 - Login & Pilih Haul Akbar (FR-02, Auth, SR-8)`
- `role` → `Superadmin`

The `declareScenario()` helper in `fixtures/auth.fixture.ts` is the single place
that pushes these annotations and applies execution guards, so the scenario id
can never be omitted. The HTML and JSON reporters surface the annotations for
both humans and machines.

## Intentionally NOT done yet

- Tests for any journey other than the approved authentication (J-S1) and
  struktur-organisasi (J-S2) slices.
- Ready/Not-Ready assessment of features (out of scope for this phase).
- Finalized DOM locators: every selector is a semantic candidate marked
  `LOCATOR-TODO` and must be confirmed against UAT (not application source).
- The OTP entry adapter for identities that require 2FA: such an identity is
  only attempted when it declares `otpRequired` **and** a TOTP secret is
  configured; the OTP entry mechanism itself remains a documented gap
  (`LoginPage.submitOtp`). Email/password-only accounts are fully supported.
- Global `storageState`/session caching: not justified while the 2FA adapter is
  unresolved.
- Backend assertions such as `activity_logs` / authentication-audit records.
- More than one browser project (Chromium only in Phase 1).

## Unresolved items (documented, not guessed)

1. **Locators**: login/OTP/dashboard/navbar selectors are semantic candidates
   that require confirmation in the UAT environment.
2. **2FA/OTP**: only affects identities that require it. An account that logs
   in with email + password only is not blocked (login flow is identity-driven
   via `User.otpRequired`). OTP-required cases (TC-REQ-002, TC-REQ-007) remain
   deferred until the adapter is finalised; TC-REQ-003/004/005/011 run when the
   identity does not require OTP.
3. **Inactive account** for TC-REQ-010: not defined by the workbook; must be
   provisioned in UAT and supplied via environment variables.
4. **Brute-force threshold** for TC-REQ-008: attempt count / lockout policy is
   not specified by the workbook.
5. **Baseline dataset**: TC-REQ-004 context-switch assertion cannot verify the
   full data shift without an approved baseline dataset.
6. **J-S2 flash/validation message wording** (TC-REQ-013 … TC-REQ-019): the
   success/validation strings in `test-data/struktur-organisasi.ts` are taken
   from the development source controllers/services and must be confirmed as
   rendered in UAT.
7. **J-S2 active Haul Akbar baseline** (TC-REQ-013/014/018): Bidang creation
   relies on an active Haul Akbar being set by `SetActivePeriode`. UAT must
   guarantee an active period exists; the suite does not seed one.
8. **J-S2 delete-restraint behavior** (TC-REQ-020/021): deferred pending the
   readiness limitation recorded in
   `docs/DEVELOPMENT_READINESS_ASSESSMENT.md` (J-S2).
