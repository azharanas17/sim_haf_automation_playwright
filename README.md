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

```
docs/SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx
```

- Workbook: `SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx`
- Sheet: `SCENARIOS`
- 339 approved scenarios (not regenerated, not renumbered here)
- Phase 1 slice: journey **J-S1 - Login & Pilih Haul Akbar (FR-02, Auth, SR-8)**,
  scenarios **TC-REQ-001 … TC-REQ-011** (11 scenarios)
- Phase 3 slice: journey **J-S2 - Kelola Struktur Organisasi: Bidang → Khidmah
  (UC-1, FR-03, 15.1.1–15.1.2)**, scenarios **TC-REQ-012 … TC-REQ-021**
  (10 scenarios)

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
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .env.example
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
| `UAT_TOTP_SECRET_SUPERADMIN` | TOTP secret for the 2FA step | _(none - unresolved)_ |
| `UAT_EMAIL_INACTIVE` / `UAT_PASSWORD_INACTIVE` | Inactive account (TC-REQ-010) | _(none)_ |
| `BIDANG_PATH` | J-S2 Bidang list path | `/pengaturan/bidang` |
| `KHIDMAH_PATH` | J-S2 Khidmah list path | `/pengaturan/khidmah` |

No credentials or secrets are stored in this repository.

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
- The 2FA/OTP adapter: the approved workbook records the Superadmin account as
  "2FA enabled"; the OTP entry mechanism is intentionally left as a documented
  gap (`LoginPage.submitOtp`).
- Global `storageState`/session caching: not justified while the 2FA adapter is
  unresolved.
- Backend assertions such as `activity_logs` / authentication-audit records.
- More than one browser project (Chromium only in Phase 1).

## Unresolved items (documented, not guessed)

1. **Locators**: login/OTP/dashboard/navbar selectors are semantic candidates
   that require confirmation in the UAT environment.
2. **2FA/OTP**: blocks the fully automated happy path (TC-REQ-001 session
   continuation, TC-REQ-002, TC-REQ-003/004/005, TC-REQ-007, TC-REQ-011).
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
