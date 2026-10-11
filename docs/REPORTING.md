# Reporting guide (SIM HAF UAT)

This project produces two complementary outputs:

1. A **consolidated Playwright HTML report** (technical debugging: traces,
   screenshots, videos, per-test detail).
2. A **readable scenario execution summary** (Excel + CSV + JSON) reconciled
   against **all 339 approved scenarios**, not just the ones Playwright
   discovered.

The approved workbook remains the source of truth. Playwright results are
evidence of what happened; they never edit the baseline.

---

## 1. Architecture

```
                         reporting.config.json  (batch plan)
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                        ▼
   batch: auth-a                                batch: pengaturan-b
   BLOB_DIR=blob-report/<run>/auth-a            BLOB_DIR=blob-report/<run>/pengaturan-b
   JSON_REPORT=reports/json/<run>__auth-a.json  JSON_REPORT=reports/json/<run>__pengaturan-b.json
              │                                        │
              └───────────► scripts/merge-reports.mjs ◄┘
                              (flatten zips + merge)
                                        │
                                        ▼
                        playwright merge-reports  →  reports/html/<run>/index.html

   reports/json/<run>__*.json ──► scripts/generate-summary.mjs ──► baseline/scenarios.json
                                        │                          (339 approved scenarios)
                                        ▼
      reports/summary/summary.xlsx  +  summary.csv  +  journeys.csv  +  metrics.csv  +  summary.json
```

Each batch writes a **unique** Blob report and JSON report so later batches
never overwrite earlier ones. `playwright merge-reports` requires the blob zips
to be flat in one directory, so `merge-reports.mjs` copies them to
`blob-report/<run>/_flat/` before merging.

---

## 2. Files

| File | Purpose |
| --- | --- |
| `reporting.config.json` | Batch plan + login policy. Batching only manages the login throttle; it never defines/skips approved scenarios. |
| `baseline/scenarios.json` | Derived, committed snapshot of the approved workbook (READ-ONLY, credential-free). Regenerate with `npm run baseline:build`. |
| `scripts/build-baseline.mjs` | Read the workbook → write `baseline/scenarios.json`. Never writes the workbook. |
| `scripts/reporting/snapshot.mjs` | Shared snapshot builder (fields/whitelist) used by build + verify so both agree. |
| `scripts/verify-baseline.mjs` | Drift check: regenerate from the workbook (when present) and fail if the committed snapshot differs. |
| `scripts/validate-batches.mjs` | List-only check that batches cover every implemented scenario exactly once (no duplicates/omissions). |
| `scripts/merge-reports.mjs` | Flatten per-batch blobs → one HTML report. |
| `scripts/merge-reports.config.cjs` | Config so merge output goes to `reports/html/<run>`. |
| `scripts/generate-summary.mjs` | Reconcile batch JSON vs baseline → Excel/CSV/JSON summary. |
| `scripts/reporting/*.mjs` | Library: workbook reader, baseline loader, result collector, status model, summary builder, xlsx/csv writer. |
| `scripts/__fixtures__/json/*.json` | Synthetic Playwright JSON for self-tests (not staging data). |
| `.github/workflows/playwright-uat-report.yml` | Manual `workflow_dispatch` UAT run with batching + reports + artifacts. |

---

## 3. Commands

```bash
# Regenerate the baseline snapshot from the approved workbook
npm run baseline:build

# Drift check: confirm the committed snapshot still matches the workbook
# (skips gracefully if the workbook is absent; add -- --require to make it fatal)
npm run baseline:verify

# Verify batch selection (no tests executed, no staging access)
npm run batches:validate

# Local single run (default: list + HTML report)
npm test

# Local batched run (example: one batch)
RUN_ID=local-1 BATCH_ID=auth-a \
  BLOB_DIR="$PWD/blob-report/local-1/auth-a" \
  JSON_REPORT="$PWD/reports/json/local-1__auth-a.json" \
  PW_OUTPUT_DIR="$PWD/test-results/local-1/auth-a" \
  npx playwright test tests/auth/auth.spec.ts --grep "TC-REQ-001|TC-REQ-002|TC-REQ-003|TC-REQ-004|TC-REQ-005" --workers 1

# Merge batch blobs into one HTML report
npm run merge:reports -- --run-id local-1

# Build the readable summary
npm run summary -- --run-id local-1
```

Outputs:

- `reports/html/<run>/index.html` - consolidated HTML report.
- `reports/summary/summary.xlsx` - readable workbook (136..339 rows, one per approved scenario).
- `reports/summary/summary.csv`, `journeys.csv`, `metrics.csv`, `summary.json`.
- `test-results/<run>/<batch>/` - raw traces/screenshots/videos for failures.

---

## 4. How scenario-to-test mapping works

Each Playwright test pushes machine-readable annotations (see
`fixtures/auth.fixture.ts` → `annotateScenario`):

- `scenario-id` → `TC-REQ-001`
- `scenario` → approved scenario text
- `requirement-id` → `FR-02, SR-6, SR-8`
- `journey` → e.g. `J-S1`
- `role` → `Superadmin`

The JSON reporter records these annotations plus every attempt
(`status`, `retry`, `duration`, `error`, `attachments`). The collector maps each
`scenario-id` to a baseline row. Approved scenarios with **no** matching test are
reported as `NOT RUN` (they never silently disappear). Tests without a
`scenario-id` are reported as a warning, not counted.

---

## 5. Statuses, precedence and formulas

| Status | Meaning |
| --- | --- |
| `PASSED` | Executed; final attempt expected (includes flaky-recovered). |
| `FAILED` | Executed; final attempt unexpected (assertion/test failure). |
| `SKIPPED` | Registered but intentionally not executed (deferred by design). |
| `BLOCKED` | Not executed because a prerequisite/environment was unavailable (e.g. `BASE_URL`/credentials/TOTP not configured). |
| `ERROR` | Interrupted / unexpected harness outcome. |
| `NOT RUN` | Approved scenario with no execution record in this run. |

**Skip classification:** a skipped test's reason (Playwright records it as a
`skip` annotation) is matched against environment/prerequisite patterns
(`BASE_URL is not configured`, `credentials are not configured`, `no TOTP
secret`). Matches → `BLOCKED`; otherwise → `SKIPPED`.

**Multiple records for one scenario (precedence):**
`FAILED > ERROR > PASSED > BLOCKED > SKIPPED > NOT RUN`.
`PASSED` outranks `BLOCKED`/`SKIPPED` so a real pass is not masked by a
duplicate skip; `FAILED`/`ERROR` always win.

**Retries:** attempts of the same test are never counted as extra scenarios. A
flaky test (failed then passed) is `PASSED` with `flaky=yes`; the failing
attempts are preserved.

**Formulas:**

- `executed = passed + failed + error`
- `accounted = executed + skipped + blocked`
- `execution coverage = executed / approved`
- `registration coverage = accounted / approved`
- `pass rate = passed / executed` (denominator = `passed + failed + error`; `n/a` if `executed = 0`)
- reconciliation invariant: `accounted + notRun = approved` (339)

A scenario discovered by `playwright test --list` is **not** counted as tested
until it actually executes.

---

## 6. Batching and the login throttle

The staging app throttles `POST /login` to **5 attempts per minute per
email+IP** (`routes/web.php:33`, `AppServiceProvider` login limiter). This is
**not** changed.

Login behaviour measured from the tests/fixtures:

- Every executable J-S1/J-S2 test calls `signIn()` → **1 login** (plus test
  activity).
- TC-REQ-006 performs 1 failed login; TC-REQ-008 (deferred) would perform 3.
- Deferred scenarios skip **before** any login.

So under the default 4-worker parallel run, the login-producing tests land in
one 60s window and trip HTTP 429. Batches therefore run with `workers=1` and a
cooldown between batches, each batch budgeted to **≤ 4 logins**
(`reporting.config.json` → `loginPolicy`).

The `loginPolicy` is **enforced**, not just documented: `npm run batches:validate`
fails unless `expectedLogins ≤ maxLoginsPerBatch < loginAttemptsPerMinutePerIdentity`,
`cooldownSecondsAfterBatch ≥ 60`, and `workersPerBatch = 1`. A batch's
`expectedLogins` counts every login POST (successful *and* failed, since the
throttle counts both).

The workflow applies the cooldown **before every batch, including the first**,
so two manual runs triggered back-to-back are still spaced by ≥ `cooldown_seconds`;
this costs the same number of sleeps as a trailing cooldown. The workflow also
uses `concurrency: sim-haf-uat` so two UAT runs never hit staging at once, and
`RETRIES=0` so a retry cannot add an unbudgeted login.

Do not raise `workers` above 1 for UAT batches without re-checking the login
budget. Do not add uncontrolled retries around login.

---

## 7. GitHub Actions

Workflow: `.github/workflows/playwright-uat-report.yml` (manual only,
`workflow_dispatch`). It installs dependencies + Chromium, runs each configured
batch sequentially, merges blobs, generates the summary, and uploads artifacts.
Reporting steps use `if: ${{ !cancelled() }}` so they run after test failures
but not after cancellation.

`.github/workflows/ci.yml` is the SAFE push/PR pipeline (no staging, no
secrets): `typecheck`, `batches:validate`, `report:selftest`, `baseline:verify`
(graceful skip without the workbook), and `playwright test --list`. It never
executes tests, so a green "Playwright Tests"-style run that skipped everything
can no longer happen.

**Inputs:** `run_id`, `batch_ids` (comma list or `all`), `workers` (keep `1`),
`cooldown_seconds`.

**Required secrets** (Settings → Secrets and variables → Actions):

| Secret | Purpose |
| --- | --- |
| `BASE_URL` | Staging base URL. If empty, every test skips (nothing runs). |
| `UAT_EMAIL_SUPERADMIN`, `UAT_PASSWORD_SUPERADMIN` | Superadmin identity. |
| `UAT_OTP_REQUIRED_SUPERADMIN`, `UAT_TOTP_SECRET_SUPERADMIN` | OTP identity (leave unset/`false` for accounts without OTP). |
| `UAT_EMAIL_INACTIVE`, `UAT_PASSWORD_INACTIVE` | Inactive account for TC-REQ-010 (deferred; optional today). |

Naming convention: `<FIELD>_<IDENTITY>` with a `UAT_` prefix (plus `BASE_URL`).

No secret is needed for TC-REQ-006: the suite uses a built-in deliberately-wrong
credential pair. `LOGIN_PATH`, `PROTECTED_PATH`, `BIDANG_PATH`, and
`KHIDMAH_PATH` are non-secret config with built-in defaults; override them as
plain workflow `env` only if UAT differs.

Secrets are injected as environment variables and never echoed. `.env` and
authentication state are git-ignored and never uploaded. No GitHub Pages/public
report site is configured.

**Artifacts:** `html-report-<run>`, `scenario-summary-<run>`,
`raw-evidence-<run>` (traces), `batch-reports-<run>` (blobs + JSON).

---

## 8. Baseline input

The approved workbook is read-only. Reporting loads, in order:

1. `--baseline` CLI arg, or
2. `SCENARIO_BASELINE_PATH` env var, or
3. `baseline/scenarios.json` (committed derived snapshot), or
4. `docs/SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx` (repo or parent
   `../docs/`).

If none is found, the summary **fails loudly** rather than fabricating a
baseline. Regenerate the snapshot after any (externally approved) workbook
change with `npm run baseline:build`.

The committed snapshot is intentionally **credential-free**: it keeps only
`id`, `role`, `journey`, `journeyName`, `requirementIds`, `scenarioType`,
`scenario`, `expectedResult`, `sourceDocument`, `sourceSection`. Workbook
columns that can contain environment-specific sample data or credentials
(`Precondition`, `Test Steps`, `Test Data`, `Source Evidence`, `Notes`) are
excluded, because TC-REQ-001's test data embeds a sample password. When a
reporting need ever requires those columns, load the workbook directly via
`--baseline`/`SCENARIO_BASELINE_PATH` instead of widening the snapshot.

Guard against the snapshot drifting from the approved workbook with
`npm run baseline:verify`. It regenerates from the workbook when one is
available and exits non-zero on any difference (count, flow units, or per
scenario). Where the workbook is absent it skips with a notice; pass
`-- --require` to make absence fatal (recommended in a job that has the
workbook).

---

## 9. Known limitations

- The workbook currently lives **outside** this repository
  (`../docs/SIM_HAF_...v4.xlsx`). CI uses the committed derived snapshot
  `baseline/scenarios.json`; if the approved workbook changes, regenerate and
  commit the snapshot deliberately.
- The current test suite covers 21 of 339 approved scenarios; the remaining 318
  are reported as `NOT RUN` until implemented.
- `baseline/scenarios.json` contains approved scenario text only (no secrets).
- `exceljs` declared as `devDependency` (offline/CI-only summary writer). Its
  transitive `uuid` was flagged (GHSA-w5hq-g745-h8pq, moderate, <11.1.1);
  exceljs only calls `uuid.v4()`, which the advisory does not cover. Resolved
  with a `package.json` override to `uuid@^11.1.1` (`npm audit` now reports
  0). Keep `exceljs@4`; do not run `npm audit fix --force` (it would downgrade
  exceljs and break the writer).
- Skip reason text is the same string authored in the specs; it is preserved
  verbatim, not reworded.
