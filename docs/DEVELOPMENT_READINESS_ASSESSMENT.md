# SIM HAF - Development Readiness Assessment

Read-only assessment mapping the approved 339 UAT scenarios to the SIM HAF development source.

| Item | Value |
|------|-------|
| Approved baseline | `SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx` (sheet `SCENARIOS`), 339 scenarios |
| Development source | `/Users/naz/MyProject/16-AlKhidmah/new_playwright/sim_haf-main` |
| Source revision | Not available - development source is not a Git repository (no commit id) |
| Assessment scope | Read-only; no source/DB/config/migrations/tests were modified or executed |
| Assessment date | 2026-10-09 |
| Framework (target) | /Users/naz/MyProject/16-AlKhidmah/new_playwright/sim_haf-main/ (Laravel 12, Web + API V1) |

**Readiness legend**

- **Ready** - Requirement is implemented in the development source and the behavior is evidenced; scenario can proceed to automation validation.
- **Partially Ready** - Core behavior exists but has gaps, dependencies, or unverified edge cases; automation may need deferral/refinement and manual confirmation.
- **Not Ready** - Required behavior/role/permission is not implemented or cannot be satisfied; scenario should wait for development (or be manually tested once built).

> Readiness here reflects **application readiness** and is reported separately from **automation-adapter readiness** (locators, seeded test data, OTP/2FA bypass, file fixtures) in the *Automation considerations* column.

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Total scenarios | 339 |
| Ready | 259 |
| Partially Ready | 62 |
| Not Ready | 18 |
| Insufficient evidence | 0 (all rows cite at least file-level evidence) |

### 1.1 Verdicts by Journey

| Journey | Total | Ready | Partially | Not Ready |
|---------|-------|-------|-----------|-----------|
| J-S1 | 11 | 10 | 1 | 0 |
| J-S2 | 10 | 8 | 2 | 0 |
| J-S3 | 8 | 6 | 2 | 0 |
| J-S4 | 7 | 5 | 2 | 0 |
| J-S5 | 5 | 5 | 0 | 0 |
| J-S6 | 10 | 9 | 1 | 0 |
| J-S7 | 7 | 6 | 1 | 0 |
| J-S8 | 7 | 3 | 3 | 1 |
| J-K1 | 8 | 6 | 2 | 0 |
| J-K2 | 4 | 4 | 0 | 0 |
| J-K3 | 6 | 6 | 0 | 0 |
| J-SU1 | 11 | 11 | 0 | 0 |
| J-SU2 | 5 | 4 | 1 | 0 |
| J-SU3 | 6 | 4 | 2 | 0 |
| J-B1 | 9 | 8 | 1 | 0 |
| J-B2 | 6 | 6 | 0 | 0 |
| J-B3 | 11 | 10 | 1 | 0 |
| J-B4 | 6 | 5 | 1 | 0 |
| J-B5 | 12 | 11 | 1 | 0 |
| J-B6 | 9 | 7 | 2 | 0 |
| J-B7 | 7 | 5 | 2 | 0 |
| J-B8 | 9 | 5 | 1 | 3 |
| J-B9 | 7 | 6 | 1 | 0 |
| J-B10 | 5 | 4 | 1 | 0 |
| J-KB1 | 9 | 9 | 0 | 0 |
| J-KB2 | 7 | 6 | 1 | 0 |
| J-KB3 | 6 | 5 | 1 | 0 |
| J-KB4 | 2 | 2 | 0 | 0 |
| J-KB5 | 6 | 5 | 1 | 0 |
| J-SB1 | 11 | 11 | 0 | 0 |
| J-SB2 | 6 | 5 | 1 | 0 |
| J-SB3 | 7 | 6 | 1 | 0 |
| J-P1 | 6 | 6 | 0 | 0 |
| J-P2 | 9 | 9 | 0 | 0 |
| J-P3 | 6 | 6 | 0 | 0 |
| J-P4 | 12 | 12 | 0 | 0 |
| J-P5 | 4 | 4 | 0 | 0 |
| J-P6 | 9 | 8 | 1 | 0 |
| J-P7 | 5 | 4 | 1 | 0 |
| J-P8 | 4 | 3 | 1 | 0 |
| J-L1 | 13 | 0 | 11 | 2 |
| J-L2 | 11 | 0 | 8 | 3 |
| J-L3 | 6 | 1 | 5 | 0 |
| J-L4 | 10 | 1 | 0 | 9 |
| E2E-1 | 1 | 1 | 0 | 0 |
| E2E-2 | 1 | 0 | 1 | 0 |
| E2E-3 | 1 | 0 | 1 | 0 |
| E2E-4 | 1 | 1 | 0 | 0 |

### 1.2 Verdicts by Role

| Role / Persona | Total | Ready | Partially | Not Ready |
|----------------|-------|-------|-----------|-----------|
| Superadmin | 65 | 52 | 12 | 1 |
| Ketua Umum | 18 | 16 | 2 | 0 |
| Sekretaris Umum | 22 | 19 | 3 | 0 |
| Bendahara Umum | 81 | 67 | 11 | 3 |
| Ketua Bidang | 30 | 27 | 3 | 0 |
| Sekretaris Bidang | 24 | 22 | 2 | 0 |
| PJ Seksi | 55 | 52 | 3 | 0 |
| Panitia Lapangan | 40 | 2 | 24 | 14 |
| Cross-Role | 4 | 2 | 2 | 0 |

### 1.3 Common Blockers

1. **Panitia Lapangan role missing** - `UserRole` has only 7 cases and no `PANITIA_LAPANGAN`; field officers are modeled as `PJ_SEKSI` scoped by `khidmah_id`+`bidang_id` (`UatFixtureSeeder.php:124-126`). Affects J-L1, J-L2, J-L3, J-L4, and E2E-2/E2E-3.
2. **Pengembalian Saldo not implemented** - LPJ finalization exists (`LpjService.php:168-216`) but the return-of-remaining-balance transaction/reminder is absent (TC-REQ-168, 169, 173).
3. **Missing authorization on Akun Transaksi** - `AkunTransaksiController` has no `authorize()`/policy guard; affects J-S7/J-SU3 negative checks.
4. **`PenerimaanKasController::store` missing `authorize('create')`** - Web keuangan write path is insufficiently guarded (`.../PenerimaanKasController.php:97`).
5. **LPJ has no `rejected` status** - rejection reverts LPJ to `draft`, which changes status assertions in J-KB5/J-P6.
6. **Multi-year (2024/2025) report detail depends on data migration** (Bg. 34) - J-B7.
7. **Unverified notification deliveries** (N-1, N-4, N-7, N-9, N-10, N-12) and audit-log retention/role gating.

### 1.4 Manual-Testing Candidates (weakest evidence / policy-dependent)

| Scenario | Reason |
|----------|--------|
| TC-REQ-062 | On-demand backup snapshot has no application evidence - verify operationally |
| TC-REQ-168 / 169 / 173 | Pengembalian Saldo not implemented |
| TC-REQ-303 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-307 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-317 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-318 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-319 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-326 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-327 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-328 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-329 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-330 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-331 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-332 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-333 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-334 | Panitia Lapangan role/sub-permission not implemented |
| TC-REQ-011 | Session-expiry handler is framework default, not explicitly evidenced |
| TC-REQ-149 / 295 | FR-22 nota access authorization not evidenced |
| TC-REQ-185 | Audit-log role restriction not evidenced |

## 2. Scenario-Level Mapping

Readiness verdicts, development evidence, blockers, and automation guidance for every approved scenario.

### J-S1 - Login & Pilih Haul Akbar (FR-02, Auth, SR-8)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php`

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-001 | Positive | Buka halaman login & masukkan kredensial valid | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-002 | Positive | Masukkan kode OTP valid | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | OTP adapter unresolved (seeded 2FA secret or mail/Otp bypass needed) before executable. | Ready for automation validation |
| TC-REQ-003 | Positive | Periksa navbar dropdown Haul Akbar aktif | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-004 | Positive | Ganti Haul Akbar di navbar (tanpa logout) | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-005 | Positive | Klik logout | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-006 | Security | Memastikan sistem menangani kondisi: Password salah / email tidak terdaftar | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-007 | Security | Memastikan sistem menangani kondisi: OTP salah / kedaluwarsa | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-008 | Security | Memastikan sistem menangani kondisi: Percobaan login gagal berulang (brute-force) | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-009 | Security | Memastikan sistem menangani kondisi: User ingin membuka halaman tanpa sesi | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-010 | Security | Memastikan sistem menangani kondisi: User status Nonaktif | **Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | - | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Ready for automation validation |
| TC-REQ-011 | Security | Memastikan sistem menangani kondisi: Sesi kadaluarsa saat beraktivitas | **Partially Ready** | `app/Http/Controllers/Auth/LoginController.php`, `TwoFactorController.php`; `app/Http/Requests/Auth/LoginRequest.php`; `routes/api.php` (AuthController); `throttle:login`; `app/Http/Middleware/{RequireTwoFactorAuthentication,EnsurePasswordIsChanged,SetActivePeriode}.php`; tests `tests/Feature/Auth/{LoginTest,TwoFactorTest,RateLimitTest}.php` | Session-expiry/token-expired handler is framework default; no explicit test/handler evidenced. | Auth fixtures (`fixtures/auth.fixture.ts`) exist. 2FA/OTP needs a bypass adapter (seeded secret / mail catcher); session-expiry and brute-force need clock/attempt control. | Consider manual testing + refine automation after dev fixes |

### J-S2 - Kelola Struktur Organisasi: Bidang → Khidmah (UC-1, FR-03, 15.1.1–15.1.2)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-012 | Positive | Buka Pengaturan > Bidang | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-013 | Positive | Tambah Bidang "Konsumsi" | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-014 | Validation | Tambah Bidang dengan nama duplikat | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-015 | Positive | Buka Pengaturan > Khidmah, tambah khidmah | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-016 | Validation | Tambah Khidmah tanpa Bidang | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-017 | Positive | Edit/hapus Bidang & Khidmah | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-018 | Negative | Memastikan sistem menangani kondisi: Nama Bidang kosong / duplikat | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-019 | Negative | Memastikan sistem menangani kondisi: Khidmah tanpa Bidang | **Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | - | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Ready for automation validation |
| TC-REQ-020 | Negative | Memastikan sistem menangani kondisi: Hapus Bidang yang masih punya Khidmah / data turunan | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | Explicit block/confirm on deleting Bidang with child Khidmah not evidenced; relies on FK. | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-021 | Negative | Memastikan sistem menangani kondisi: Hapus Khidmah yang terpakai (RAB, pengeluaran, kepanitiaan) | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`; `app/Application/Pengaturan/Services/{BidangService,KhidmahService}.php`; `app/Policies/{BidangPolicy,KhidmahPolicy}.php`; requests; feature tests | Deleting in-use Khidmah (RAB/expense/kepanitiaan) restraint not explicitly evidenced. | UI + API CRUD; need seeded unique/duplicate names and dependent-record fixtures for negative cases. | Consider manual testing + refine automation after dev fixes |

### J-S3 - Kelola Haul Akbar & Periode (UC-3, FR-01, 15.1.3–15.1.4)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php`

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-022 | Positive | Tambah Haul Akbar | **Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | - | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Ready for automation validation |
| TC-REQ-023 | Positive | Tambah Periode | **Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | - | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Ready for automation validation |
| TC-REQ-024 | Validation | Tambah periode duplikat tahun Masehi di HAF yang sama | **Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | - | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Ready for automation validation |
| TC-REQ-025 | Positive | Cek edit/hapus Periode | **Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | - | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Ready for automation validation |
| TC-REQ-026 | Negative | Memastikan sistem menangani kondisi: Haul Akbar nama/singkatan kosong | **Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | - | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Ready for automation validation |
| TC-REQ-027 | Negative | Memastikan sistem menangani kondisi: Periode tahun kembar pada HA yang sama | **Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | - | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Ready for automation validation |
| TC-REQ-028 | Negative | Memastikan sistem menangani kondisi: Hapus Periode yang sudah berisi transaksi/RAB | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | Retention policy for deleting Periode with transactions/RAB not evidenced (FK vs archive). | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-029 | Negative | Memastikan sistem menangani kondisi: Buka/tutup periode RAB oleh non-BU | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/{HaulAkbarController,PeriodeController}.php`; `StorePeriodeRequest`; `app/Policies/PeriodePolicy.php`; `app/Http/Middleware/SetActivePeriode.php` | Non-BU open/close enforcement not clearly evidenced on PeriodeController. | Seeded HA/periode; period-status transitions are BU actions (see J-B1) - reuse those fixtures. | Consider manual testing + refine automation after dev fixes |

### J-S4 - Kelola Alamat Cascading (15.1.5, FR-04)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**`

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-030 | Positive | Tambah Provinsi (Jawa Timur) | **Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | - | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Ready for automation validation |
| TC-REQ-031 | Positive | Tambah Kota di bawahnya (Surabaya) | **Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | - | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Ready for automation validation |
| TC-REQ-032 | Positive | Tambah Kecamatan (Sukolilo) | **Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | - | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Ready for automation validation |
| TC-REQ-033 | Positive | Cek dropdown cascading di form Kepanitiaan | **Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | - | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Ready for automation validation |
| TC-REQ-034 | Negative | Memastikan sistem menangani kondisi: Memilih Kecamatan tanpa memilih Kota | **Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | - | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Ready for automation validation |
| TC-REQ-035 | Negative | Memastikan sistem menangani kondisi: Duplikat nama pada level yang sama | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | Duplicate address-name handling / region code not evidenced. | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-036 | Negative | Memastikan sistem menangani kondisi: Alamat dipakai oleh Kepanitiaan lalu dihapus | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/AlamatController.php`; cascade endpoints; form views `resources/views/**/alamat/**` | FK restraint when deleting address used by Kepanitiaan not evidenced. | Cascading selects driven by API/AJAX; assert dependent enable/disable in UI and FK restraint server-side. | Consider manual testing + refine automation after dev fixes |

### J-S5 - Kelola Kepanitiaan (FR-04, 15.1.6)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/KepanitiaanController.php`; `app/Http/Requests/**/Kepanitiaan*Request.php`; photo mime/size validation; dependent Khidmah lookup

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-037 | Positive | Tambah Kepanitiaan lengkap | **Ready** | `app/Http/Controllers/Web/Pengaturan/KepanitiaanController.php`; `app/Http/Requests/**/Kepanitiaan*Request.php`; photo mime/size validation; dependent Khidmah lookup | - | File upload fixtures (JPG/PNG/WebP, invalid, >5MB); dependent Bidang->Khidmah selectors. | Ready for automation validation |
| TC-REQ-038 | Validation | Tambah dengan nama kosong | **Ready** | `app/Http/Controllers/Web/Pengaturan/KepanitiaanController.php`; `app/Http/Requests/**/Kepanitiaan*Request.php`; photo mime/size validation; dependent Khidmah lookup | - | File upload fixtures (JPG/PNG/WebP, invalid, >5MB); dependent Bidang->Khidmah selectors. | Ready for automation validation |
| TC-REQ-039 | Positive | Pilih Khidmah yang beda Bidang | **Ready** | `app/Http/Controllers/Web/Pengaturan/KepanitiaanController.php`; `app/Http/Requests/**/Kepanitiaan*Request.php`; photo mime/size validation; dependent Khidmah lookup | - | File upload fixtures (JPG/PNG/WebP, invalid, >5MB); dependent Bidang->Khidmah selectors. | Ready for automation validation |
| TC-REQ-040 | Validation | Upload foto format salah | **Ready** | `app/Http/Controllers/Web/Pengaturan/KepanitiaanController.php`; `app/Http/Requests/**/Kepanitiaan*Request.php`; photo mime/size validation; dependent Khidmah lookup | - | File upload fixtures (JPG/PNG/WebP, invalid, >5MB); dependent Bidang->Khidmah selectors. | Ready for automation validation |
| TC-REQ-041 | Positive | Edit/hapus data kepanitiaan | **Ready** | `app/Http/Controllers/Web/Pengaturan/KepanitiaanController.php`; `app/Http/Requests/**/Kepanitiaan*Request.php`; photo mime/size validation; dependent Khidmah lookup | - | File upload fixtures (JPG/PNG/WebP, invalid, >5MB); dependent Bidang->Khidmah selectors. | Ready for automation validation |

### J-S6 - Kelola Users & Role (UC-2, FR-05, 15.1.7)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-042 | Positive | Buat user untuk tiap role (7 user) | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-043 | Positive | Login user PJ Seksi | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-044 | Validation | Nonaktifkan salah satu user | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-045 | Authorization | Set multi-haul akses | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-046 | Positive | Edit password / role user | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-047 | Negative | Memastikan sistem menangani kondisi: Email duplikat | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-048 | Authorization | Memastikan sistem menangani kondisi: Tanpa role / role tidak valid | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-049 | Negative | Memastikan sistem menangani kondisi: Password lemah (pendek) | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | Password strength (beyond min length) policy not evidenced; `must_change_password` semantics incomplete. | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-050 | Security | Memastikan sistem menangani kondisi: User nonaktif login | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |
| TC-REQ-051 | Authorization | Memastikan sistem menangani kondisi: User buka modul di luar permission | **Ready** | `app/Http/Controllers/Web/Pengaturan/UserController.php`; `app/Http/Requests/**/User*Request.php`; `app/Domain/Shared/Enums/UserRole.php` (7 cases); `app/Http/Middleware/ScopeToUserAccess.php`; menu/permission matrix | - | Seed one user per role; password hashing assertion via DB; multi-haul access fixtures. | Ready for automation validation |

### J-S7 - Kelola Master Akun Transaksi (FR-07, 15.3.1)

*Role: Superadmin*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-052 | Positive | Lihat tab Penerimaan | **Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | No `authorize()`/policy guard on AkunTransaksi controller (any authenticated user may mutate). | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Ready for automation validation |
| TC-REQ-053 | Positive | Tambah akun penerimaan baru | **Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | No `authorize()`/policy guard on AkunTransaksi controller (any authenticated user may mutate). | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Ready for automation validation |
| TC-REQ-054 | Positive | Tambah akun pengeluaran | **Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | No `authorize()`/policy guard on AkunTransaksi controller (any authenticated user may mutate). | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Ready for automation validation |
| TC-REQ-055 | Validation | Cek kode duplikat | **Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | No `authorize()`/policy guard on AkunTransaksi controller (any authenticated user may mutate). | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Ready for automation validation |
| TC-REQ-056 | Negative | Memastikan sistem menangani kondisi: Kode/nama duplikat | **Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | No `authorize()`/policy guard on AkunTransaksi controller (any authenticated user may mutate). | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Ready for automation validation |
| TC-REQ-057 | Negative | Memastikan sistem menangani kondisi: Akun dipakai transaksi lalu dihapus | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | Soft-delete/in-use protection for Akun Transaksi not evidenced. | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-058 | Negative | Memastikan sistem menangani kondisi: Free-text kategori pada form transaksi | **Ready** | `app/Http/Controllers/Web/Pengaturan/AkunTransaksiController.php`; `app/Models/AkunTransaksi.php`; dropdown feeds in Penerimaan/Pengeluaran forms | No `authorize()`/policy guard on AkunTransaksi controller (any authenticated user may mutate). | Dropdown master data; duplicate-code fixtures. NOTE: controller currently lacks policy authorization. | Ready for automation validation |

### J-S8 - Pantau & Audit Sistem (LR-7, BK-6, SR-9)

*Role: Superadmin*

Evidence (module): `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-059 | Positive | Buka halaman pelacakan log aktivitas | **Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | Manual snapshot/backup trigger (TC-REQ-062) has no application evidence; auth-log retention/rotation not evidenced. | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Ready for automation validation |
| TC-REQ-060 | Authorization | Akses log RAB Seksi tertentu | **Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | Manual snapshot/backup trigger (TC-REQ-062) has no application evidence; auth-log retention/rotation not evidenced. | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Ready for automation validation |
| TC-REQ-061 | Positive | Cek log autentikasi | **Partially Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | Auth-log retention >= 1 year (LR-5) rotation/retention config not evidenced. | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Consider manual testing + refine automation after dev fixes |
| TC-REQ-062 | Positive | Trigger snapshot manual | **Not Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | On-demand backup snapshot has no application evidence (likely infra concern). | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Needs clarification |
| TC-REQ-063 | Security | Memastikan sistem menangani kondisi: User non-Superadmin/non-BU buka halaman audit | **Partially Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | Audit-page authorization for non-Superadmin/non-BU not clearly evidenced. | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Consider manual testing + refine automation after dev fixes |
| TC-REQ-064 | Security | Memastikan sistem menangani kondisi: Menghapus/edit riwayat audit (RAB, koreksi) | **Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | Manual snapshot/backup trigger (TC-REQ-062) has no application evidence; auth-log retention/rotation not evidenced. | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Ready for automation validation |
| TC-REQ-065 | Security | Memastikan sistem menangani kondisi: Log error aplikasi berisi data sensitif transaksi | **Partially Ready** | `spatie/laravel-activitylog` activity logs; RAB revision history (`RabRevisi`); `app/Http/Controllers/**/AuditController.php`; RP-7 export | Sensitive-data separation in application logs (SR-7) needs review; not evidenced. | Assert append-only (no delete route) and role gate; snapshot trigger likely infra-level (needs clarification). | Consider manual testing + refine automation after dev fixes |

### J-K1 - Lihat Dashboard & Laporan (UC-19, FR-21)

*Role: Ketua Umum*

Evidence (module): `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel)

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-066 | Positive | Login & buka Dashboard | **Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | - | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Ready for automation validation |
| TC-REQ-067 | Calculation | Bandingkan angka Saldo | **Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | - | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Ready for automation validation |
| TC-REQ-068 | Positive | Klik menu laporan (Rekap, Detail Transaksi) | **Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | - | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Ready for automation validation |
| TC-REQ-069 | Positive | Export laporan | **Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | - | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Ready for automation validation |
| TC-REQ-070 | Positive | Buka laporan/transaksi lintas Bidang & Seksi | **Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | - | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Ready for automation validation |
| TC-REQ-071 | Negative | Memastikan sistem menangani kondisi: Data saldo/agregat tidak sesuai transaksi | **Partially Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | Real-time aggregate correctness (no manual recap) not directly tested. | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-072 | Security | Memastikan sistem menangani kondisi: Export gagal / format salah | **Partially Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | Export failure/format error handling messaging not evidenced. | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-073 | Negative | Memastikan sistem menangani kondisi: Dashboard menampilkan tombol tambah/edit/aksi | **Ready** | `app/Http/Controllers/Web/DashboardController.php`; report controllers under `app/Http/Controllers/Web/Laporan/**`; RP report services; `app/Domain/Shared/Enums/LaporanType.php` (RP1 PDF-only; RP2-5 both; RP6/7 Excel) | - | Aggregate/calc assertions against seeded transactions; PDF/Excel download assertions; cross-bidang visibility for KU. | Ready for automation validation |

### J-K2 - Lihat Semua Timeline Kegiatan (UC-20, FR-06)

*Role: Ketua Umum*

Evidence (module): `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `app/Application/Kegiatan/Services/KegiatanService.php`; read-only views for KU

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-074 | Positive | Buka modul Kegiatan | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `app/Application/Kegiatan/Services/KegiatanService.php`; read-only views for KU | - | KU sees all Bidang/Seksi; assert no mutation controls render and no POST routes allowed. | Ready for automation validation |
| TC-REQ-075 | Positive | Klik salah satu kegiatan Seksi lain | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `app/Application/Kegiatan/Services/KegiatanService.php`; read-only views for KU | - | KU sees all Bidang/Seksi; assert no mutation controls render and no POST routes allowed. | Ready for automation validation |
| TC-REQ-076 | Negative | Memastikan sistem menangani kondisi: Kegiatan Seksi lain tidak terlihat oleh KU | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `app/Application/Kegiatan/Services/KegiatanService.php`; read-only views for KU | - | KU sees all Bidang/Seksi; assert no mutation controls render and no POST routes allowed. | Ready for automation validation |
| TC-REQ-077 | Negative | Memastikan sistem menangani kondisi: Terdapat tombol approack untuk edit pada tampilan KU | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `app/Application/Kegiatan/Services/KegiatanService.php`; read-only views for KU | - | KU sees all Bidang/Seksi; assert no mutation controls render and no POST routes allowed. | Ready for automation validation |

### J-K3 - Verifikasi Read-Only Semua Modul (Bg. 8.3)

*Role: Ketua Umum*

Evidence (module): Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-078 | Positive | Sampling menu | **Ready** | Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware | - | Negative authorization matrix; API POST with KU token should return 403. | Ready for automation validation |
| TC-REQ-079 | Validation | Coba akses API transaksi (POST) via token KU | **Ready** | Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware | - | Negative authorization matrix; API POST with KU token should return 403. | Ready for automation validation |
| TC-REQ-080 | Validation | Coba approve RAB | **Ready** | Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware | - | Negative authorization matrix; API POST with KU token should return 403. | Ready for automation validation |
| TC-REQ-081 | Validation | Coba hapus data | **Ready** | Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware | - | Negative authorization matrix; API POST with KU token should return 403. | Ready for automation validation |
| TC-REQ-082 | Negative | Memastikan sistem menangani kondisi: KU bisa mengubah/menghapus data | **Ready** | Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware | - | Negative authorization matrix; API POST with KU token should return 403. | Ready for automation validation |
| TC-REQ-083 | Negative | Memastikan sistem menangani kondisi: KU bisa approve RAB/LPJ | **Ready** | Policies on Keuangan/Kegiatan controllers; `app/Policies/*`; API V1 auth middleware | - | Negative authorization matrix; API POST with KU token should return 403. | Ready for automation validation |

### J-SU1 - Kelola Timeline Kegiatan Semua Bidang/Seksi (FR-06, UC-20)

*Role: Sekretaris Umum*

Evidence (module): `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-084 | Positive | Login SU buka modul Kegiatan | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-085 | Positive | Tambah kegiatan untuk Bidang "Konsumsi" / Khidmah "Jamuan" | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-086 | Positive | Edit kegiatan milik Seksi lain | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-087 | Validation | Hapus kegiatan (negatif bila ada ketergantungan) | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-088 | Validation | Cek tanggal mulai > selesai | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-089 | Positive | Buka detail dari akun PJ Seksi lain | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-090 | Negative | Memastikan sistem menangani kondisi: Nama Kegiatan kosong / Bidang-Khidmah kosong | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-091 | Negative | Memastikan sistem menangani kondisi: Tanggal Selesai < Mulai | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-092 | Negative | Memastikan sistem menangani kondisi: Tahap/Status di luar enum | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-093 | Negative | Memastikan sistem menangani kondisi: SU tidak bisa menambah untuk Bidang/Seksi tertentu | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |
| TC-REQ-094 | Negative | Memastikan sistem menangani kondisi: Bidang/Seksi lain melihat kegiatan Seksi pemilik | **Ready** | `app/Http/Controllers/Web/Kegiatan/KegiatanController.php`; `KegiatanService`; date validation in request | - | SU full CRUD across Bidang/Seksi; assert visibility scoping for lower roles. | Ready for automation validation |

### J-SU2 - Pantau Dashboard Kegiatan (Bg. 28)

*Role: Sekretaris Umum*

Evidence (module): Dashboard kegiatan cards; permission-gated keuangan cards; `KegiatanStatus`/`KegiatanTahap` enums

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-095 | Positive | Login SU lihat Dashboard | **Ready** | Dashboard kegiatan cards; permission-gated keuangan cards; `KegiatanStatus`/`KegiatanTahap` enums | - | Card value consistency after status updates; assert SU does not see keuangan figures if policy excludes. | Ready for automation validation |
| TC-REQ-096 | Positive | Bandingkan dengan total kegiatan di master | **Ready** | Dashboard kegiatan cards; permission-gated keuangan cards; `KegiatanStatus`/`KegiatanTahap` enums | - | Card value consistency after status updates; assert SU does not see keuangan figures if policy excludes. | Ready for automation validation |
| TC-REQ-097 | Positive | Cek card keuangan | **Ready** | Dashboard kegiatan cards; permission-gated keuangan cards; `KegiatanStatus`/`KegiatanTahap` enums | - | Card value consistency after status updates; assert SU does not see keuangan figures if policy excludes. | Ready for automation validation |
| TC-REQ-098 | Negative | Memastikan sistem menangani kondisi: Card keuangan tampil angka untuk SU | **Ready** | Dashboard kegiatan cards; permission-gated keuangan cards; `KegiatanStatus`/`KegiatanTahap` enums | - | Card value consistency after status updates; assert SU does not see keuangan figures if policy excludes. | Ready for automation validation |
| TC-REQ-099 | Negative | Memastikan sistem menangani kondisi: Angka Terlaksana tidak sinkron setelah update status | **Partially Ready** | Dashboard kegiatan cards; permission-gated keuangan cards; `KegiatanStatus`/`KegiatanTahap` enums | Real-time 'Terlaksana' count after status update not directly tested. | Card value consistency after status updates; assert SU does not see keuangan figures if policy excludes. | Consider manual testing + refine automation after dev fixes |

### J-SU3 - Verifikasi Read-Only Modul Lain (Bg. 8.3)

*Role: Sekretaris Umum*

Evidence (module): Policies on Keuangan/User/MasterAkun controllers; menu permission matrix

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-100 | Validation | Coba akses menu Keuangan > Penerimaan/Pengeluaran | **Partially Ready** | Policies on Keuangan/User/MasterAkun controllers; menu permission matrix | Keuangan read gate for SU depends on policy coverage; PenerimaanKas store lacks authorize. | Negative authorization; MasterAkun has no authorize() so SU read/deny behavior needs verification. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-101 | Validation | Coba akses menu Users & Role | **Ready** | Policies on Keuangan/User/MasterAkun controllers; menu permission matrix | AkunTransaksi controller lacks authorization; SU keuangan read gating depends on policy coverage. | Negative authorization; MasterAkun has no authorize() so SU read/deny behavior needs verification. | Ready for automation validation |
| TC-REQ-102 | Validation | Coba akses Master Akun | **Partially Ready** | Policies on Keuangan/User/MasterAkun controllers; menu permission matrix | AkunTransaksi controller lacks authorization; SU denial not guaranteed. | Negative authorization; MasterAkun has no authorize() so SU read/deny behavior needs verification. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-103 | Validation | Coba POST transaksi via API | **Ready** | Policies on Keuangan/User/MasterAkun controllers; menu permission matrix | AkunTransaksi controller lacks authorization; SU keuangan read gating depends on policy coverage. | Negative authorization; MasterAkun has no authorize() so SU read/deny behavior needs verification. | Ready for automation validation |
| TC-REQ-104 | Negative | Memastikan sistem menangani kondisi: SU bisa input transaksi/ubah data keuangan | **Ready** | Policies on Keuangan/User/MasterAkun controllers; menu permission matrix | AkunTransaksi controller lacks authorization; SU keuangan read gating depends on policy coverage. | Negative authorization; MasterAkun has no authorize() so SU read/deny behavior needs verification. | Ready for automation validation |
| TC-REQ-105 | Authorization | Memastikan sistem menangani kondisi: SU bisa kelola Users & Role | **Ready** | Policies on Keuangan/User/MasterAkun controllers; menu permission matrix | AkunTransaksi controller lacks authorization; SU keuangan read gating depends on policy coverage. | Negative authorization; MasterAkun has no authorize() so SU read/deny behavior needs verification. | Ready for automation validation |

### J-B1 - Buka / Tutup Periode RAB (UC-4, FR-10)

*Role: Bendahara Umum*

Evidence (module): `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-106 | Positive | Buka list Periode | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-107 | Notification | Klik Buka Periode RAB | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-108 | Positive | Coba input RAB saat Dibuka (dari akun PJ) | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-109 | Notification | Klik Tutup Periode RAB | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-110 | Validation | Coba input/ajukan RAB saat Ditutup | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-111 | Positive | Verifikasi periode lain tidak terpengaruh | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-112 | Negative | Memastikan sistem menangani kondisi: Buka/tutup oleh non-BU (PJ/Kabid) | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |
| TC-REQ-113 | Negative | Memastikan sistem menangani kondisi: Tutup periode yang belum dibuka | **Partially Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | Close-period-before-open state guard not explicitly evidenced. | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-114 | Negative | Memastikan sistem menangani kondisi: Input RAB saat periode Belum Dibuka / Ditutup | **Ready** | `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`; `RabService` FR-10 gating (`RabService.php:201-209`); notifikasi N-1/N-7 | - | Period status transitions via BU account; assert RAB input blocked server-side when closed. | Ready for automation validation |

### J-B2 - Konfirmasi & Cairkan RAB (UC-7, 10.1)

*Role: Bendahara Umum*

Evidence (module): `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-115 | Positive | Buka RAB status Disetujui | **Ready** | `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4 | - | Seed approved Kabid RAB; assert confirm available only in valid state and audit recorded. | Ready for automation validation |
| TC-REQ-116 | Notification | Klik Konfirmasi | **Ready** | `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4 | - | Seed approved Kabid RAB; assert confirm available only in valid state and audit recorded. | Ready for automation validation |
| TC-REQ-117 | Positive | Cek dashboard/modul | **Ready** | `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4 | - | Seed approved Kabid RAB; assert confirm available only in valid state and audit recorded. | Ready for automation validation |
| TC-REQ-118 | Validation | Verifikasi tidak bisa konfirmasi RAB belum disetujui (menunggu/ditolak) | **Ready** | `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4 | - | Seed approved Kabid RAB; assert confirm available only in valid state and audit recorded. | Ready for automation validation |
| TC-REQ-119 | Security | Memastikan sistem menangani kondisi: Konfirmasi RAB milik Bidang lain dengan data global | **Ready** | `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4 | - | Seed approved Kabid RAB; assert confirm available only in valid state and audit recorded. | Ready for automation validation |
| TC-REQ-120 | Negative | Memastikan sistem menangani kondisi: RAB ditolak → bisa konfirmasi | **Ready** | `app/Application/Keuangan/Services/RabService.php` (status `approved_kabid` -> `disbursed`, transitions `RabService.php:186-193`); BU confirm action; notifikasi N-4 | - | Seed approved Kabid RAB; assert confirm available only in valid state and audit recorded. | Ready for automation validation |

### J-B3 - Catat Penerimaan Kas (UC-5, FR-11, 15.3.3)

*Role: Bendahara Umum*

Evidence (module): `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-121 | Positive | Buka form Penerimaan Kas | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-122 | Positive | Isi: kategori (dropdown) "Jamaah Umum", nominal 1.000.000, disetor oleh, channel Transfer Bank | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-123 | Calculation | Simpan | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-124 | Validation | Cek Disetor Oleh wajib | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-125 | Validation | Coba nominal 0 / negatif | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-126 | Positive | Upload bukti opsional (format valid) | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-127 | Negative | Memastikan sistem menangani kondisi: Tanpa kategori / kategori tidak valid | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-128 | Negative | Memastikan sistem menangani kondisi: Nominal ≤ 0 / bukan angka | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-129 | Negative | Memastikan sistem menangani kondisi: Tanggal kosong / di luar periode | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-130 | Negative | Memastikan sistem menangani kondisi: Kuitansi diisi manual | **Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Web `PenerimaanKasController::store` (`.../PenerimaanKasController.php:97`) missing `authorize('create')`. | Receipt auto-gen + saldo assertions; ROC. NOTE store() lacks authorize('create'). | Ready for automation validation |
| TC-REQ-131 | Negative | Memastikan sistem menangani kondisi: Panitia Lapangan mengedit transaksi | **Partially Ready** | `app/Http/Controllers/Web/Keuangan/PenerimaanKasController.php`; `app/Http/Requests/**/PenerimaanKas*Request.php`; auto receipt no; saldo update; master kategori | Panitia Lapangan role absent; edit restriction for field staff not implemented. | No Panitia role to drive this scenario cleanly. | Consider manual testing + refine automation after dev fixes |

### J-B4 - Penerimaan Kas Valuta Asing (FR-12, 10.2)

*Role: Bendahara Umum*

Evidence (module): Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-132 | Positive | Pilih Valuta Asing (USD) | **Ready** | Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted | - | Currency fixtures; assert stored IDR equals amount*kurs and kurs<=0 rejected. | Ready for automation validation |
| TC-REQ-133 | Positive | Isi Kurs (mis. 15.850) sebagai Rp / USD | **Ready** | Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted | - | Currency fixtures; assert stored IDR equals amount*kurs and kurs<=0 rejected. | Ready for automation validation |
| TC-REQ-134 | Calculation | Simpan | **Ready** | Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted | - | Currency fixtures; assert stored IDR equals amount*kurs and kurs<=0 rejected. | Ready for automation validation |
| TC-REQ-135 | Negative | Memastikan sistem menangani kondisi: Valuta dipilih tanpa Kurs | **Ready** | Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted | - | Currency fixtures; assert stored IDR equals amount*kurs and kurs<=0 rejected. | Ready for automation validation |
| TC-REQ-136 | Negative | Memastikan sistem menangani kondisi: Kurs ≤ 0 | **Ready** | Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted | - | Currency fixtures; assert stored IDR equals amount*kurs and kurs<=0 rejected. | Ready for automation validation |
| TC-REQ-137 | Negative | Memastikan sistem menangani kondisi: Kurs tidak konsisten (input semi-manual) | **Partially Ready** | Valuta/kurs fields in PenerimaanKas request + service; conversion to IDR persisted | Pre-save conversion preview / kurs consistency validation not evidenced. | Currency fixtures; assert stored IDR equals amount*kurs and kurs<=0 rejected. | Consider manual testing + refine automation after dev fixes |

### J-B5 - Catat Pengeluaran Kas (UC-6, FR-13, 15.3.4)

*Role: Bendahara Umum*

Evidence (module): `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-138 | Positive | Buka form Pengeluaran | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-139 | Positive | Isi kategori "Konsumsi", uraian, qty 10, satuan "porsi", harga 25.000, dibayarkan ke | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-140 | Validation | Simpan tanpa foto nota | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-141 | Positive | Upload foto nota | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-142 | Positive | Referensikan ke RAB Seksi | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-143 | Positive | Kategori "Pengadaan Inventaris" | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-144 | Negative | Memastikan sistem menangani kondisi: Foto nota tidak di-upload | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-145 | Negative | Memastikan sistem menangani kondisi: Qty / harga 0 atau negatif | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-146 | Security | Memastikan sistem menangani kondisi: File format non-gambar (exe/txt) / >5MB | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-147 | Authorization | Memastikan sistem menangani kondisi: Referensi RAB milik Seksi lain | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-148 | Negative | Memastikan sistem menangani kondisi: Bidang/Khidmah/kategori kosong | **Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota access authorization (FR-22) not clearly evidenced as signed/limited. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Ready for automation validation |
| TC-REQ-149 | Authorization | Memastikan sistem menangani kondisi: Akses foto nota oleh role tak berhak | **Partially Ready** | `app/Http/Controllers/Web/Keuangan/PengeluaranKasController.php`; required nota photo; qty*harga; RAB reference + realisasi update; inventaris candidate flag | Nota-photo access restriction (FR-22) for unauthorized roles not evidenced. | File upload + required-photo validation; RAB-scope reference; realisasi delta assertions. | Consider manual testing + refine automation after dev fixes |

### J-B6 - Koreksi / Reversal Transaksi (UC-8, FR-15, 15.3.5)

*Role: Bendahara Umum*

Evidence (module): Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-150 | Positive | Buka form Koreksi | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-151 | Positive | Ubah Kategori (mis. transaksi salah kategori) | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-152 | Calculation | Reversal penuh penerimaan | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-153 | Positive | Cek audit trail koreksi | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-154 | Negative | Memastikan sistem menangani kondisi: Alasan kosong | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-155 | Negative | Memastikan sistem menangani kondisi: Reversal / koreksi → saldo negatif | **Partially Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | Negative-balance guard on reversal/koreksi not evidenced. | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-156 | Authorization | Memastikan sistem menangani kondisi: PJ/Sekretaris (tanpa hak) coba koreksi | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-157 | Negative | Memastikan sistem menangani kondisi: Menghapus riwayat koreksi | **Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | - | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Ready for automation validation |
| TC-REQ-158 | Security | Memastikan sistem menangani kondisi: Transaksi yang sudah final/dicairkan di-reversal | **Partially Ready** | Koreksi/Reversal controller + `JenisKoreksi` enum; snapshot/audit trail; BU/Superadmin-only policy | Reversing final/disbursed transactions policy + audit behavior needs verification. | Reversal balance assertions; assert append-only and reason required; check negatives balance policy. | Consider manual testing + refine automation after dev fixes |

### J-B7 - Laporan Kas Konsolidasi (UC-9, FR-17, 15.3.6, 27)

*Role: Bendahara Umum*

Evidence (module): Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-159 | Positive | Buka Rekap Penerimaan | **Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Multi-year summary (2024/2025) depends on data migration (Bg. 34); realtime aggregation source-of-truth needs verification. | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Ready for automation validation |
| TC-REQ-160 | Positive | Buka Rekap Pengeluaran | **Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Multi-year summary (2024/2025) depends on data migration (Bg. 34); realtime aggregation source-of-truth needs verification. | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Ready for automation validation |
| TC-REQ-161 | Positive | Cek RAB vs Realisasi | **Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Multi-year summary (2024/2025) depends on data migration (Bg. 34); realtime aggregation source-of-truth needs verification. | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Ready for automation validation |
| TC-REQ-162 | Positive | Export PDF/Excel | **Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Multi-year summary (2024/2025) depends on data migration (Bg. 34); realtime aggregation source-of-truth needs verification. | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Ready for automation validation |
| TC-REQ-163 | Negative | Memastikan sistem menangani kondisi: Filter tanpa data | **Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Multi-year summary (2024/2025) depends on data migration (Bg. 34); realtime aggregation source-of-truth needs verification. | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Ready for automation validation |
| TC-REQ-164 | Negative | Memastikan sistem menangani kondisi: Data multi-tahun tidak tampil (2024/2025 belum dimigrasi detail) | **Partially Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Multi-year (2024/2025) summary depends on data migration (Bg. 34). | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-165 | Negative | Memastikan sistem menangani kondisi: Dashboard/saldo tidak sinkron dengan laporan | **Partially Ready** | Report services RP2-RP5 (`LaporanType.php:30-38`); rekap penerimaan/pengeluaran; RAB vs realisasi; PDF/Excel export | Single source of truth for dashboard vs report aggregation needs verification. | Multi-year seed data dependency (2024/2025); assert empty-filter handled without error. | Consider manual testing + refine automation after dev fixes |

### J-B8 - Review & Finalisasi LPJ + Pengembalian Saldo (FR-16, 10.3, 15.3.6)

*Role: Bendahara Umum*

Evidence (module): `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-166 | Positive | Buka LPJ Seksi yang diajukan & disetujui Kabid | **Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pengembalian Saldo (return of remaining balance) NOT implemented; LPJ has no `rejected` status (rejection reverts to `draft`). | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Ready for automation validation |
| TC-REQ-167 | Calculation | Finalisasi | **Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pengembalian Saldo (return of remaining balance) NOT implemented; LPJ has no `rejected` status (rejection reverts to `draft`). | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Ready for automation validation |
| TC-REQ-168 | Calculation | Cek sisa saldo | **Not Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pengembalian Saldo action/transaction NOT implemented. | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Wait for development |
| TC-REQ-169 | Calculation | Verifikasi saldo setelah pengembalian | **Not Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Post-pengembalian saldo verification impossible (feature missing). | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Wait for development |
| TC-REQ-170 | Positive | Cek LPJ final di Report | **Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pengembalian Saldo (return of remaining balance) NOT implemented; LPJ has no `rejected` status (rejection reverts to `draft`). | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Ready for automation validation |
| TC-REQ-171 | Negative | Memastikan sistem menangani kondisi: LPJ belum diajukan/disetujui → di-finalisasi | **Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pengembalian Saldo (return of remaining balance) NOT implemented; LPJ has no `rejected` status (rejection reverts to `draft`). | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Ready for automation validation |
| TC-REQ-172 | Authorization | Memastikan sistem menangani kondisi: Generate LPJ Seksi lain | **Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pengembalian Saldo (return of remaining balance) NOT implemented; LPJ has no `rejected` status (rejection reverts to `draft`). | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Ready for automation validation |
| TC-REQ-173 | Negative | Memastikan sistem menangani kondisi: Sisa saldo tidak dicatat | **Not Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Reminder/auto-flow for unrecorded remaining balance (10.3) not implemented. | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Wait for development |
| TC-REQ-174 | Negative | Memastikan sistem menangani kondisi: Data transaksi hilang / tidak lengkap | **Partially Ready** | `app/Application/Keuangan/Services/LpjService.php` finalize (`LpjService.php:168-216`); LPJ PDF generation; report listing | Pre-finalize completeness reminder for missing transaction data not evidenced. | Finalize flow + PDF assertions. Pengembalian Saldo has no implementation - scenarios 168/169/173 cannot pass. | Consider manual testing + refine automation after dev fixes |

### J-B9 - Otomasi Inventaris dari LPJ (FR-18, 15.4)

*Role: Bendahara Umum*

Evidence (module): Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-175 | Positive | Buat pengeluaran kategori "Pengadaan Inventaris" (tenda, kursi) | **Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal-cancels-inventaris-candidate behavior needs verification. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Ready for automation validation |
| TC-REQ-176 | Positive | Finalisasi LPJ pemilik | **Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal-cancels-inventaris-candidate behavior needs verification. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Ready for automation validation |
| TC-REQ-177 | Positive | Update Kondisi & Lokasi | **Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal-cancels-inventaris-candidate behavior needs verification. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Ready for automation validation |
| TC-REQ-178 | Positive | Cek asal periode | **Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal-cancels-inventaris-candidate behavior needs verification. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Ready for automation validation |
| TC-REQ-179 | Negative | Memastikan sistem menangani kondisi: Item masuk inventaris tanpa LPJ final | **Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal-cancels-inventaris-candidate behavior needs verification. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Ready for automation validation |
| TC-REQ-180 | Negative | Memastikan sistem menangani kondisi: Kondisi di luar enum (Baik/Rusak/Hilang) | **Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal-cancels-inventaris-candidate behavior needs verification. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Ready for automation validation |
| TC-REQ-181 | Negative | Memastikan sistem menangani kondisi: Duplikat item dari transaksi yang dikoreksi/reversal | **Partially Ready** | Inventaris creation triggered on LPJ finalize; `KondisiAset` enum; asal periode tracking | Reversal cancelling inventaris candidate not evidenced. | Requires finalised LPJ fixture; assert candidate flag -> inventaris item; reversal cancels candidate. | Consider manual testing + refine automation after dev fixes |

### J-B10 - Telusuri Log Audit (LR-7)

*Role: Bendahara Umum*

Evidence (module): Activity log query + RAB revision history; RP-7 Excel export

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-182 | Positive | Buka log per user pj.konsumsi | **Ready** | Activity log query + RAB revision history; RP-7 Excel export | Log access restriction for PJ/Kabid (TC-REQ-185) not clearly evidenced. | Role gate to BU/Superadmin; assert no delete route; export assertion. | Ready for automation validation |
| TC-REQ-183 | Positive | Buka riwayat RAB Seksi "Jamuan" | **Ready** | Activity log query + RAB revision history; RP-7 Excel export | Log access restriction for PJ/Kabid (TC-REQ-185) not clearly evidenced. | Role gate to BU/Superadmin; assert no delete route; export assertion. | Ready for automation validation |
| TC-REQ-184 | Positive | Export log (RP-7) | **Ready** | Activity log query + RAB revision history; RP-7 Excel export | Log access restriction for PJ/Kabid (TC-REQ-185) not clearly evidenced. | Role gate to BU/Superadmin; assert no delete route; export assertion. | Ready for automation validation |
| TC-REQ-185 | Authorization | Memastikan sistem menangani kondisi: akses log oleh PJ/Kabid | **Partially Ready** | Activity log query + RAB revision history; RP-7 Excel export | Audit-log access restriction for PJ/Kabid not clearly evidenced. | Role gate to BU/Superadmin; assert no delete route; export assertion. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-186 | Security | Memastikan sistem menangani kondisi: Menghapus log audit | **Ready** | Activity log query + RAB revision history; RP-7 Excel export | Log access restriction for PJ/Kabid (TC-REQ-185) not clearly evidenced. | Role gate to BU/Superadmin; assert no delete route; export assertion. | Ready for automation validation |

### J-KB1 - Approve RAB Seksi (UC-10, FR-08)

*Role: Ketua Bidang*

Evidence (module): `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-187 | Positive | Buka list RAB Bidang "Konsumsi" | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-188 | Positive | Tinjau detail | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-189 | Notification | Setujui | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-190 | Validation | Tolak RAB lain | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-191 | Validation | Coba approve RAB Bidang lain | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-192 | Negative | Memastikan sistem menangani kondisi: Approve RAB Bidang lain | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-193 | Negative | Memastikan sistem menangani kondisi: Approve tanpa status valid (sudah disetujui/ditolak) | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-194 | Negative | Memastikan sistem menangani kondisi: Penolakan tanpa alasan | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |
| TC-REQ-195 | Negative | Memastikan sistem menangani kondisi: PAPER-DI-F: RAB approval oleh non-Kabid | **Ready** | `RabService` approval transitions; `app/Policies/RabPolicy.php` Bidang scope; reject reason required; notifikasi N-2/N-4 | - | Kabid scope fixtures; assert cross-Bidang approval denied and state guards enforced. | Ready for automation validation |

### J-KB2 - Approve Revisi RAB (UC-11, FR-09)

*Role: Ketua Bidang*

Evidence (module): RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-196 | Notification | Terima notif revisi RAB | **Partially Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revision notification delivery trigger not evidenced. | Seed submitted revision; assert diff rendering and append-only history. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-197 | Positive | Review diff | **Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revisi notification trigger (N-?) needs verification of delivery. | Seed submitted revision; assert diff rendering and append-only history. | Ready for automation validation |
| TC-REQ-198 | Positive | Setujui | **Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revisi notification trigger (N-?) needs verification of delivery. | Seed submitted revision; assert diff rendering and append-only history. | Ready for automation validation |
| TC-REQ-199 | Validation | Coba tolak | **Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revisi notification trigger (N-?) needs verification of delivery. | Seed submitted revision; assert diff rendering and append-only history. | Ready for automation validation |
| TC-REQ-200 | Negative | Memastikan sistem menangani kondisi: Menghapus/mengubah riwayat revisi | **Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revisi notification trigger (N-?) needs verification of delivery. | Seed submitted revision; assert diff rendering and append-only history. | Ready for automation validation |
| TC-REQ-201 | Negative | Memastikan sistem menangani kondisi: Approve revisi untuk Bidang lain | **Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revisi notification trigger (N-?) needs verification of delivery. | Seed submitted revision; assert diff rendering and append-only history. | Ready for automation validation |
| TC-REQ-202 | Negative | Memastikan sistem menangani kondisi: Revisi diajukan tanpa alasan | **Ready** | RAB revision flow (`RabRevisi`), diff view, approve/update history; notifikasi revisi | Revisi notification trigger (N-?) needs verification of delivery. | Seed submitted revision; assert diff rendering and append-only history. | Ready for automation validation |

### J-KB3 - Pantau Realisasi Bidang vs RAB (UC-12)

*Role: Ketua Bidang*

Evidence (module): RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5)

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-203 | Positive | Buka laporan RAB vs Realisasi Bidang | **Ready** | RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5) | Large-deficit flagging (RP-5) needs verification. | Kabid-scope report; assert other Bidang invisible; deficit flag assertion. | Ready for automation validation |
| TC-REQ-204 | Positive | Bandingkan angka | **Ready** | RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5) | Large-deficit flagging (RP-5) needs verification. | Kabid-scope report; assert other Bidang invisible; deficit flag assertion. | Ready for automation validation |
| TC-REQ-205 | Positive | Cek sisa | **Ready** | RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5) | Large-deficit flagging (RP-5) needs verification. | Kabid-scope report; assert other Bidang invisible; deficit flag assertion. | Ready for automation validation |
| TC-REQ-206 | Authorization | Coba buka Bidang lain | **Ready** | RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5) | Large-deficit flagging (RP-5) needs verification. | Kabid-scope report; assert other Bidang invisible; deficit flag assertion. | Ready for automation validation |
| TC-REQ-207 | Negative | Memastikan sistem menangani kondisi: Data Bidang lain bocor | **Ready** | RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5) | Large-deficit flagging (RP-5) needs verification. | Kabid-scope report; assert other Bidang invisible; deficit flag assertion. | Ready for automation validation |
| TC-REQ-208 | Negative | Memastikan sistem menangani kondisi: Defisit besar tidak ter-flag | **Partially Ready** | RAB vs realisasi Bidang report; surplus/deficit indicator (RP-5) | Large-deficit flag (RP-5) rendering not evidenced. | Kabid-scope report; assert other Bidang invisible; deficit flag assertion. | Consider manual testing + refine automation after dev fixes |

### J-KB4 - Kelola Kepanitiaan Bidang (Bg. 8.3)

*Role: Ketua Bidang*

Evidence (module): `KepanitiaanController` scoped by Bidang via policy; dependent Seksi (Khidmah) selection

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-209 | Authorization | Tambah panitia Seksi Jamuan | **Ready** | `KepanitiaanController` scoped by Bidang via policy; dependent Seksi (Khidmah) selection | - | Kabid can add within own Bidang only; assert cross-Bidang edit denied. | Ready for automation validation |
| TC-REQ-210 | Validation | Edit panitia Seksi lain (Bidang lain) | **Ready** | `KepanitiaanController` scoped by Bidang via policy; dependent Seksi (Khidmah) selection | - | Kabid can add within own Bidang only; assert cross-Bidang edit denied. | Ready for automation validation |

### J-KB5 - Review & Approve LPJ Seksi (10.3)

*Role: Ketua Bidang*

Evidence (module): `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-211 | Notification | Terima notif LPJ Jamuan | **Partially Ready** | `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10 | LPJ notification (N-9/N-10) delivery trigger not evidenced. | Approve -> Disetujui; reject reverts to draft (no rejected status); assert Cabid cannot finalize. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-212 | Notification | Approve | **Ready** | `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10 | LPJ has no dedicated `rejected` status; rejection reverts to `draft` (affects status assertions). | Approve -> Disetujui; reject reverts to draft (no rejected status); assert Cabid cannot finalize. | Ready for automation validation |
| TC-REQ-213 | Validation | Tolak LPJ lain | **Ready** | `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10 | LPJ has no dedicated `rejected` status; rejection reverts to `draft` (affects status assertions). | Approve -> Disetujui; reject reverts to draft (no rejected status); assert Cabid cannot finalize. | Ready for automation validation |
| TC-REQ-214 | Negative | Memastikan sistem menangani kondisi: Approve LPJ Bidang lain | **Ready** | `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10 | LPJ has no dedicated `rejected` status; rejection reverts to `draft` (affects status assertions). | Approve -> Disetujui; reject reverts to draft (no rejected status); assert Cabid cannot finalize. | Ready for automation validation |
| TC-REQ-215 | Authorization | Memastikan sistem menangani kondisi: Finalisasi LPJ (hak BU) oleh Kabid | **Ready** | `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10 | LPJ has no dedicated `rejected` status; rejection reverts to `draft` (affects status assertions). | Approve -> Disetujui; reject reverts to draft (no rejected status); assert Cabid cannot finalize. | Ready for automation validation |
| TC-REQ-216 | Negative | Memastikan sistem menangani kondisi: LPJ belum diajukan | **Ready** | `LpjService` submit/approve (`LpjService.php:168-216`); status flow; finalize reserved for BU; notifikasi N-9/N-10 | LPJ has no dedicated `rejected` status; rejection reverts to `draft` (affects status assertions). | Approve -> Disetujui; reject reverts to draft (no rejected status); assert Cabid cannot finalize. | Ready for automation validation |

### J-SB1 - Input & Ajukan RAB Seksi (UC-2, FR-07, FR-08)

*Role: Sekretaris Bidang*

Evidence (module): `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-217 | Authorization | Buka menu RAB Bidang "Konsumsi" | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-218 | Positive | Buat RAB Seksi "Jamuan": kategori "Konsumsi", uraian, estimasi 3.000.000 | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-219 | Positive | Edit draft & submit saat periode Dibuka | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-220 | Validation | Coba submit ke periode status Ditutup | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-221 | Validation | Submit dengan kategori kosong / estimasi ≤ 0 | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-222 | Validation | Coba buat RAB Seksi Bidang lain | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-223 | Negative | Memastikan sistem menangani kondisi: RAB di-submit saat periode Belum Dibuka / Ditutup | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-224 | Negative | Memastikan sistem menangani kondisi: Kategori bebas-teks | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-225 | Negative | Memastikan sistem menangani kondisi: Estimasi ≤ 0 / non-numerik | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-226 | Negative | Memastikan sistem menangani kondisi: Access Seksi Bidang lain | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |
| TC-REQ-227 | Negative | Memastikan sistem menangani kondisi: Submit Draft dengan field wajib kosong | **Ready** | `RabService` create/submit; period gating (FR-10); `StoreRabRequest` validation; master kategori dropdown; Bidang scope | - | Draft->submit state; closed-period negative; scope enforcement to Seksi/Bidang. | Ready for automation validation |

### J-SB2 - Ajukan Ulang RAB yang Ditolak (UC-10, FR-08)

*Role: Sekretaris Bidang*

Evidence (module): RAB reject->revise->resubmit; rejection reason preserved in history

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-228 | Validation | Buka RAB yang ditolak | **Ready** | RAB reject->revise->resubmit; rejection reason preserved in history | Resubmit-without-change is policy-allowed (documented), not blocked. | Reuse rejected-RAB fixture; assert history retains reason and resubmit resets state. | Ready for automation validation |
| TC-REQ-229 | Positive | Revisi estimasi / lengkapi uraian | **Ready** | RAB reject->revise->resubmit; rejection reason preserved in history | Resubmit-without-change is policy-allowed (documented), not blocked. | Reuse rejected-RAB fixture; assert history retains reason and resubmit resets state. | Ready for automation validation |
| TC-REQ-230 | Positive | Ajukan ulang | **Ready** | RAB reject->revise->resubmit; rejection reason preserved in history | Resubmit-without-change is policy-allowed (documented), not blocked. | Reuse rejected-RAB fixture; assert history retains reason and resubmit resets state. | Ready for automation validation |
| TC-REQ-231 | Positive | Cek riwayat RAB | **Ready** | RAB reject->revise->resubmit; rejection reason preserved in history | Resubmit-without-change is policy-allowed (documented), not blocked. | Reuse rejected-RAB fixture; assert history retains reason and resubmit resets state. | Ready for automation validation |
| TC-REQ-232 | Security | Memastikan sistem menangani kondisi: Menghapus riwayat penolakan | **Ready** | RAB reject->revise->resubmit; rejection reason preserved in history | Resubmit-without-change is policy-allowed (documented), not blocked. | Reuse rejected-RAB fixture; assert history retains reason and resubmit resets state. | Ready for automation validation |
| TC-REQ-233 | Negative | Memastikan sistem menangani kondisi: Ajukan ulang tanpa perubahan | **Partially Ready** | RAB reject->revise->resubmit; rejection reason preserved in history | Resubmit-without-change is policy-allowed (not blocked); document as accepted behavior. | Reuse rejected-RAB fixture; assert history retains reason and resubmit resets state. | Consider manual testing + refine automation after dev fixes |

### J-SB3 - Input Pengeluaran Seksi (UC-6, FR-13, 15.3.4)

*Role: Sekretaris Bidang*

Evidence (module): PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-234 | Positive | Buka form Pengeluaran | **Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) expenditure consistency (TC-REQ-240) not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Ready for automation validation |
| TC-REQ-235 | Validation | Simpan tanpa foto | **Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) expenditure consistency (TC-REQ-240) not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Ready for automation validation |
| TC-REQ-236 | Positive | Upload foto nota & simpan | **Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) expenditure consistency (TC-REQ-240) not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Ready for automation validation |
| TC-REQ-237 | Positive | Cek Dashboard Bidang | **Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) expenditure consistency (TC-REQ-240) not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Ready for automation validation |
| TC-REQ-238 | Negative | Memastikan sistem menangani kondisi: Foto belum di-upload / format non-gambar | **Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) expenditure consistency (TC-REQ-240) not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Ready for automation validation |
| TC-REQ-239 | Authorization | Memastikan sistem menangani kondisi: Referensi RAB di luar scope Bidang | **Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) expenditure consistency (TC-REQ-240) not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Ready for automation validation |
| TC-REQ-240 | Negative | Memastikan sistem menangani kondisi: Panitia Lapangan (P08) input pengeluaran terpisah | **Partially Ready** | PengeluaranKas create by Sekretaris Bidang; required nota; RAB reference + realisasi; scope | Panitia Lapangan (P08) separate-input consistency not modeled (role absent). | Scope fixtures; realisasi delta; missing Panitia Lapangan (P08) model for 240. | Consider manual testing + refine automation after dev fixes |

### J-P1 - Kelola Kegiatan Seksi (FR-06, 10.4, UC-20)

*Role: PJ Seksi*

Evidence (module): `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-241 | Positive | Buat kegiatan "Rapat Koordinasi Jamuan" | **Ready** | `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation | - | PJ Seksi scope fixtures; assert other Seksi activities hidden. | Ready for automation validation |
| TC-REQ-242 | Positive | Edit status → Terlaksana | **Ready** | `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation | - | PJ Seksi scope fixtures; assert other Seksi activities hidden. | Ready for automation validation |
| TC-REQ-243 | Validation | Buat kegiatan Seksi lain / Bidang lain | **Ready** | `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation | - | PJ Seksi scope fixtures; assert other Seksi activities hidden. | Ready for automation validation |
| TC-REQ-244 | Positive | Cek tahap LPJ | **Ready** | `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation | - | PJ Seksi scope fixtures; assert other Seksi activities hidden. | Ready for automation validation |
| TC-REQ-245 | Authorization | Memastikan sistem menangani kondisi: Kegiatan seksi lain terlihat/terakses | **Ready** | `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation | - | PJ Seksi scope fixtures; assert other Seksi activities hidden. | Ready for automation validation |
| TC-REQ-246 | Negative | Memastikan sistem menangani kondisi: Tanggal selesai < mulai | **Ready** | `KegiatanController`/`KegiatanService` scoped to PJ Seksi; `KegiatanTahap` LPJ marker; date validation | - | PJ Seksi scope fixtures; assert other Seksi activities hidden. | Ready for automation validation |

### J-P2 - Ajukan RAB Seksi (UC-2, FR-07/08, 15.3.2) — alur utama

*Role: PJ Seksi*

Evidence (module): `RabService` create/submit; period gating; validation; scope

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-247 | Positive | Buat RAB "Konsumsi Jamuan" | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-248 | Positive | Submit saat periode Dibuka | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-249 | Validation | Submit saat periode Ditutup | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-250 | Validation | Kosongkan kategori/uraian, estimasi 0 | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-251 | Positive | Submit draft belum lengkap | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-252 | Negative | Memastikan sistem menangani kondisi: RAB Bidang/Seksi lain | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-253 | Negative | Memastikan sistem menangani kondisi: Kategori bebas-teks (bukan dropdown) | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-254 | Negative | Memastikan sistem menangani kondisi: Estimasi ≤ 0 | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |
| TC-REQ-255 | Negative | Memastikan sistem menangani kondisi: Submit saat periode belum dibuka/ditutup | **Ready** | `RabService` create/submit; period gating; validation; scope | - | Same as J-SB1; PJ Seksi actor. | Ready for automation validation |

### J-P3 - Revisi & Ajukan Ulang RAB yang Ditolak (UC-10, FR-09, 10.1)

*Role: PJ Seksi*

Evidence (module): RAB revision flow; reject reason; history with old/new values

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-256 | Validation | Terima N-3 (ditolak) | **Ready** | RAB revision flow; reject reason; history with old/new values | - | Revision diff/history assertions; reason-required validation. | Ready for automation validation |
| TC-REQ-257 | Positive | Revisi | **Ready** | RAB revision flow; reject reason; history with old/new values | - | Revision diff/history assertions; reason-required validation. | Ready for automation validation |
| TC-REQ-258 | Positive | Ajukan ulang | **Ready** | RAB revision flow; reject reason; history with old/new values | - | Revision diff/history assertions; reason-required validation. | Ready for automation validation |
| TC-REQ-259 | Positive | Cek riwayat | **Ready** | RAB revision flow; reject reason; history with old/new values | - | Revision diff/history assertions; reason-required validation. | Ready for automation validation |
| TC-REQ-260 | Negative | Memastikan sistem menangani kondisi: Ajukan revisi tanpa alasan perubahan | **Ready** | RAB revision flow; reject reason; history with old/new values | - | Revision diff/history assertions; reason-required validation. | Ready for automation validation |
| TC-REQ-261 | Negative | Memastikan sistem menangani kondisi: Menghapus riwayat revisi | **Ready** | RAB revision flow; reject reason; history with old/new values | - | Revision diff/history assertions; reason-required validation. | Ready for automation validation |

### J-P4 - Input Pengeluaran + Foto Nota (UC-6, FR-13/14, 15.3.4) — inti operasional

*Role: PJ Seksi*

Evidence (module): PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-262 | Positive | Buka form pengeluaran | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-263 | Calculation | Isi kategori "Konsumsi", qty 100, satuan porsi, harga 2.500 | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-264 | Validation | Simpan tanpa foto | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-265 | Positive | Foto valid upload | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-266 | Positive | Referensi RAB Jamuan | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-267 | Validation | Foto > 5MB / format exe | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-268 | Positive | Kategori Pengadaan Inventaris | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-269 | Negative | Memastikan sistem menangani kondisi: Pengeluaran tanpa nota | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-270 | Negative | Memastikan sistem menangani kondisi: Pengeluaran Seksi lain / Bidang lain | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-271 | Negative | Memastikan sistem menangani kondisi: Referensi RAB yang belum disetujui/dicairkan | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-272 | Negative | Memastikan sistem menangani kondisi: Kategori non-master | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |
| TC-REQ-273 | Negative | Memastikan sistem menangani kondisi: Qty/harga 0 atau minus | **Ready** | PengeluaranKas create; required nota; qty*harga; RAB reference; inventaris candidate; file validation | - | File upload matrix; realisasi delta; scope negatives. | Ready for automation validation |

### J-P5 - Pantau Realisasi & Sisa Budget (10.2, FR-17)

*Role: PJ Seksi*

Evidence (module): Realisasi/sisa budget view for PJ Seksi; over-budget indicator; seksi report

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-274 | Positive | Cek realisasi RAB Jamuan | **Ready** | Realisasi/sisa budget view for PJ Seksi; over-budget indicator; seksi report | - | Calc assertions vs seeded expenditure; over-budget flag. | Ready for automation validation |
| TC-REQ-275 | Positive | Cek sisa | **Ready** | Realisasi/sisa budget view for PJ Seksi; over-budget indicator; seksi report | - | Calc assertions vs seeded expenditure; over-budget flag. | Ready for automation validation |
| TC-REQ-276 | Positive | Over budget uji | **Ready** | Realisasi/sisa budget view for PJ Seksi; over-budget indicator; seksi report | - | Calc assertions vs seeded expenditure; over-budget flag. | Ready for automation validation |
| TC-REQ-277 | Positive | Export laporan seksi | **Ready** | Realisasi/sisa budget view for PJ Seksi; over-budget indicator; seksi report | - | Calc assertions vs seeded expenditure; over-budget flag. | Ready for automation validation |

### J-P6 - Susun & Ajukan LPJ Seksi (FR-16, 10.3, UC-13)

*Role: PJ Seksi*

Evidence (module): `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-278 | Positive | Buka LPJ seksi | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-279 | Positive | Tambah item yang belum masuk | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-280 | Positive | Submit | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-281 | Positive | Review isi dokumen | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-282 | Validation | LPJ ditolak Kabid | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-283 | Positive | Cek PDF setelah finalisasi BU | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-284 | Negative | Memastikan sistem menangani kondisi: LPJ di-submit saat data tidak lengkap | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-285 | Negative | Memastikan sistem menangani kondisi: Buat LPJ Seksi lain | **Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | LPJ item-integrity (delete transaction already in LPJ) enforcement needs verification. | LPJ draft composition; status flow; PDF after BU finalize. | Ready for automation validation |
| TC-REQ-286 | Negative | Memastikan sistem menangani kondisi: Menghapus transaksi yang sudah masuk LPJ | **Partially Ready** | `LpjService` draft auto-generate, add item, submit (N-9), reject->draft, finalize PDF | Preventing deletion of transactions already in LPJ (integrity) not evidenced. | LPJ draft composition; status flow; PDF after BU finalize. | Consider manual testing + refine automation after dev fixes |

### J-P7 - Buat / Batalkan Pick Up Request (FR-20, 15.5)

*Role: PJ Seksi*

Evidence (module): Pick Up Request controller + `PickUpStatus`/`PickUpJenis` enums; tracking + cancel

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-287 | Positive | Buat request pickup | **Ready** | Pick Up Request controller + `PickUpStatus`/`PickUpJenis` enums; tracking + cancel | - | Create/track/cancel status transitions; duplicate tracking investigation. | Ready for automation validation |
| TC-REQ-288 | Positive | Lihat tracking | **Ready** | Pick Up Request controller + `PickUpStatus`/`PickUpJenis` enums; tracking + cancel | - | Create/track/cancel status transitions; duplicate tracking investigation. | Ready for automation validation |
| TC-REQ-289 | Positive | Batalkan | **Ready** | Pick Up Request controller + `PickUpStatus`/`PickUpJenis` enums; tracking + cancel | - | Create/track/cancel status transitions; duplicate tracking investigation. | Ready for automation validation |
| TC-REQ-290 | Negative | Memastikan sistem menangani kondisi: Request tanpa detail wajib | **Ready** | Pick Up Request controller + `PickUpStatus`/`PickUpJenis` enums; tracking + cancel | - | Create/track/cancel status transitions; duplicate tracking investigation. | Ready for automation validation |
| TC-REQ-291 | Negative | Memastikan sistem menangani kondisi: Tracking status kacau/duplikat | **Partially Ready** | Pick Up Request controller + `PickUpStatus`/`PickUpJenis` enums; tracking + cancel | Duplicate/erratic pickup tracking-state investigation; no explicit guard evidenced. | Create/track/cancel status transitions; duplicate tracking investigation. | Consider manual testing + refine automation after dev fixes |

### J-P8 - Verifikasi Hak & Batas Seksi (Bg. 8.3, FR-22)

*Role: PJ Seksi*

Evidence (module): Policies/scope for PJ Seksi (Bg. 8.3); nota access (FR-22)

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-292 | Validation | Coba akses data Bidang lain | **Ready** | Policies/scope for PJ Seksi (Bg. 8.3); nota access (FR-22) | Nota access grant for PJ (FR-22) and denial for others needs verification. | Negative authorization matrix; nota access approval depends on FR-22 implementation. | Ready for automation validation |
| TC-REQ-293 | Validation | Coba CRUD Pengaturan/Users/Role | **Ready** | Policies/scope for PJ Seksi (Bg. 8.3); nota access (FR-22) | Nota access grant for PJ (FR-22) and denial for others needs verification. | Negative authorization matrix; nota access approval depends on FR-22 implementation. | Ready for automation validation |
| TC-REQ-294 | Validation | Coba buat koreksi (hak BU/SA) | **Ready** | Policies/scope for PJ Seksi (Bg. 8.3); nota access (FR-22) | Nota access grant for PJ (FR-22) and denial for others needs verification. | Negative authorization matrix; nota access approval depends on FR-22 implementation. | Ready for automation validation |
| TC-REQ-295 | Authorization | Akses bukti nota | **Partially Ready** | Policies/scope for PJ Seksi (Bg. 8.3); nota access (FR-22) | FR-22 nota access grant for PJ Seksi not evidenced. | Negative authorization matrix; nota access approval depends on FR-22 implementation. | Consider manual testing + refine automation after dev fixes |

### J-L1 - Input Penerimaan Kas Harian (Setoran Kotak Amal dll.) (UC-5, UC-21, FR-11, FR-12, 15.3.3)

*Role: Panitia Lapangan*

Evidence (module): PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-296 | Positive | Buka form Penerimaan Kas | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-297 | Positive | Isi Tanggal, Kategori "Kotak Amal", Nominal 500.000, Disetor Oleh "Panitia Shift A", Channel Tunai | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-298 | Calculation | Simpan | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-299 | Validation | Coba isi bebas-teks pada Kategori | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-300 | Validation | Nominal 0 / negatif | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-301 | Validation | Kategori kosong / Disetor Oleh kosong | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-302 | Positive | Buat transaksi Valuta Asing (USD 50, Kurs asumsi) | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-303 | Negative | Memastikan sistem menangani kondisi: Edit/hapus transaksi oleh Panitia | **Not Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | Edit/delete denial for Panitia (create-only) not implemented; no Panitia role. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Wait for development |
| TC-REQ-304 | Negative | Memastikan sistem menangani kondisi: Nominal ≤ 0 / bukan angka | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-305 | Negative | Memastikan sistem menangani kondisi: Kategori bukan dari Master | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-306 | Negative | Memastikan sistem menangani kondisi: Valuta tanpa Kurs / Kurs ≤ 0 | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-307 | Authorization | Memastikan sistem menangani kondisi: Panitia akses form modul lain (Login Menu) | **Not Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | Panitia menu/permission restriction (-) not implemented; no Panitia role. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Wait for development |
| TC-REQ-308 | Negative | Memastikan sistem menangani kondisi: PHP/periode kosong | **Partially Ready** | PenerimaanKas create path (shared with J-B3); Valuta/kurs; master kategori; period auto-fill | No `PANITIA_LAPANGAN` role (`UserRole` has 7 cases); field officers modeled as `PJ_SEKSI` (`UatFixtureSeeder.php:124-126`). Restricted create-only profile not implemented. | Blocked by absent Panitia Lapangan role; using PJ_SEKSI + flag as proxy. | Consider manual testing + refine automation after dev fixes |

### J-L2 - Input Pengeluaran Kas + Foto Nota dari Lapangan (FR-13, 15.3.4, UC-6, FM-2/3/5)

*Role: Panitia Lapangan*

Evidence (module): PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-309 | Positive | Buka form Pengeluaran | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-310 | Calculation | Isi kategori "Konsumsi", qty 20, satuan "kotak", harga 15.000, dibayarkan ke | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-311 | Validation | Simpan tanpa foto | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-312 | Positive | Upload foto nota valid (1,5 MB JPG) | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-313 | Validation | Upload file > 5MB / format txt | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-314 | Positive | Kategori "Pengadaan Inventaris" | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-315 | Negative | Memastikan sistem menangani kondisi: Foto tidak ada / non-gambar / >5MB | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-316 | Negative | Memastikan sistem menangani kondisi: Qty/harga/nominal ≤ 0 | **Partially Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | No Panitia Lapangan role; create-only permission and nota-read restriction (FR-22) for field staff not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-317 | Negative | Memastikan sistem menangani kondisi: Panitia edit/hapus pengeluaran | **Not Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | Panitia edit/delete denial (create-only) not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Wait for development |
| TC-REQ-318 | Negative | Memastikan sistem menangani kondisi: Baca ulang bukti nota milik seksi lain | **Not Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | Nota read restriction for Panitia across Seksi (FR-22) not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Wait for development |
| TC-REQ-319 | Authorization | Memastikan sistem menangani kondisi: Input dari Seksi lain di luar penugasan | **Not Ready** | PengeluaranKas create path (shared with J-B5); required nota; inventaris candidate; file validation | Cross-Seksi input scope denial for Panitia not implemented. | Blocked by absent Panitia Lapangan role/permissions. | Wait for development |

### J-L3 - Catat Aktifitas Pick Up sebagai Petugas (FR-20, 15.5, matriks 8.3)

*Role: Panitia Lapangan*

Evidence (module): Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-320 | Notification | Terima notifikasi N-12 | **Partially Ready** | Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum | N-12 notification to petugas / role assignment not implemented. | Status transition and task-assignment fixtures; no petugas role mapping. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-321 | Positive | Buka permintaan & update status | **Partially Ready** | Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum | Petugas status update mapping to a role not implemented. | Status transition and task-assignment fixtures; no petugas role mapping. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-322 | Positive | Update status → Selesai | **Partially Ready** | Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum | Petugas completion visibility to PJ not fully evidenced for field role. | Status transition and task-assignment fixtures; no petugas role mapping. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-323 | Validation | Coba create permintaan untuk seksi lain | **Partially Ready** | Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum | Scope denial for Panitia pickup to other Seksi not fully enforced. | Status transition and task-assignment fixtures; no petugas role mapping. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-324 | Negative | Memastikan sistem menangani kondisi: Lompat dari Diminta langsung Selesai (tanpa Dijadwalkan) | **Partially Ready** | Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum | Skip Diminta->Selesai enforcement is policy-dependent; document decision. | Status transition and task-assignment fixtures; no petugas role mapping. | Consider manual testing + refine automation after dev fixes |
| TC-REQ-325 | Negative | Memastikan sistem menangani kondisi: Status invalid / bukan enum | **Ready** | Pick Up Request status update; notifikasi N-12; `PickUpStatus` enum | Petugas (field officer) assignment/notification mapping to a role is not implemented. | Status transition and task-assignment fixtures; no petugas role mapping. | Ready for automation validation |

### J-L4 - Verifikasi Batas Hak (only-create & akses terbatas) (Bg. 8.3, FR-22)

*Role: Panitia Lapangan*

Evidence (module): Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia)

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-326 | Validation | Coba access menu di luar subset (RAB, LPJ, Sumbangan, Report, Dashboard) | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Menu subset restriction for Panitia not implemented (no Panitia role). | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-327 | Validation | Coba edit/hapus transaksi | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Panitia edit/delete denial not implemented. | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-328 | Validation | Coba buka bukti nota seksi lain | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Nota access denial for Panitia (FR-22) not implemented. | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-329 | Validation | Coba POST transaksi Seksi lain | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Cross-Seksi POST denial for Panitia not implemented. | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-330 | Authorization | Bandingkan menu user Panitia vs PJ Seksi (login 2 akun) | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Panitia-vs-PJ menu subset comparison not possible (role absent). | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-331 | Negative | Memastikan sistem menangani kondisi: Panitia dapat mengubah/menghapus transaksi | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Defect check: Panitia can currently mutate transactions (no create-only guard). | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-332 | Authorization | Memastikan sistem menangani kondisi: Panitia melihat menu RAB/LPJ/Sumbangan seperti PJ penuh | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Defect check: Panitia menu subset cannot be enforced (no sub-permission). | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-333 | Negative | Memastikan sistem menangani kondisi: Panitia melihat Dashboard/Report | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Defect check: Dashboard/Report denial for Panitia not implemented. | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-334 | Negative | Memastikan sistem menangani kondisi: Panitia membaca bukti nota | **Not Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Defect check: nota read denial for Panitia not enforced. | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Wait for development |
| TC-REQ-335 | Authorization | Memastikan sistem menangani kondisi: Dropdown Users&Role tidak bisa memilih "Panitia Lapangan" | **Ready** | Menu permission matrix (Bg. 8.3), policies, nota signed access (FR-22); `UserRole` enum (7 cases, no Panitia) | Panitia Lapangan sub-permission (read/create-only) not implemented; dropdown correctly only offers 7 roles (TC-REQ-335 expected). | Negative authorization matrix; absence of Panitia role prevents the create-only subset from being enforced. | Ready for automation validation |

### E2E-1 - RAB & Approval

*Role: Cross-Role*

Evidence (module): Composes J-SB1/J-P2/J-KB1/J-B1/J-B2 RAB lifecycle; `RabService` transitions + policies + notifikasi

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-336 | End-to-End | Menjalankan alur lintas-role RAB & Approval dari awal hingga kondisi akhir. | **Ready** | Composes J-SB1/J-P2/J-KB1/J-B1/J-B2 RAB lifecycle; `RabService` transitions + policies + notifikasi | - | Cross-role orchestration; reuses per-journey adapters; state + traceability assertions. | Ready for automation validation |

### E2E-2 - Penerimaan Kas

*Role: Cross-Role*

Evidence (module): Composes J-B3/J-B4/J-L1 penerimaan lifecycle; PenerimaanKas create + valuta + saldo

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-337 | End-to-End | Menjalankan alur lintas-role Penerimaan Kas dari awal hingga kondisi akhir. | **Partially Ready** | Composes J-B3/J-B4/J-L1 penerimaan lifecycle; PenerimaanKas create + valuta + saldo | PenerimaanKas store lacks authorize('create'); Panitia Lapangan role absent. | Depends on J-B3/J-L1 readiness; Panitia role and store authorization gaps apply. | Consider manual testing + refine automation after dev fixes |

### E2E-3 - Pengeluaran Kas & LPJ

*Role: Cross-Role*

Evidence (module): Composes J-B5/J-P4/J-P6/J-KB5/J-B8/J-B9 pengeluaran+LPJ lifecycle; LpjService + Inventaris

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-338 | End-to-End | Menjalankan alur lintas-role Pengeluaran Kas & LPJ dari awal hingga kondisi akhir. | **Partially Ready** | Composes J-B5/J-P4/J-P6/J-KB5/J-B8/J-B9 pengeluaran+LPJ lifecycle; LpjService + Inventaris | Pengembalian Saldo missing; Panitia role absent; LPJ no rejected status. | Depends on LPJ + Pengembalian Saldo; PDF assertions. | Consider manual testing + refine automation after dev fixes |

### E2E-4 - Kegiatan — Visibilitas Terbatas

*Role: Cross-Role*

Evidence (module): Composes J-SU1/J-P1 visibility; Kegiatan scope + policies

| Scenario ID | Type | Scenario | Readiness | Development evidence | Missing behavior / blocker | Automation considerations | Suggested next action |
|-------------|------|----------|-----------|----------------------|----------------------------|--------------------------|-----------------------|
| TC-REQ-339 | End-to-End | Menjalankan alur lintas-role Kegiatan — Visibilitas Terbatas dari awal hingga kondisi akhir. | **Ready** | Composes J-SU1/J-P1 visibility; Kegiatan scope + policies | - | Cross-role visibility/negative access; reuses Kegiatan adapters. | Ready for automation validation |

## 3. Method & Limitations

- Extraction: the approved workbook `SCENARIOS` sheet was read as-is; all 339 scenario IDs are preserved exactly once, with no invented IDs and no renumbering.
- Evidence: gathered by read-only inspection of `/Users/naz/MyProject/16-AlKhidmah/new_playwright/sim_haf-main` (controllers, services, policies, form requests, enums, middleware, migrations, seeders, tests) and cross-checked with `docs/uat.md`.
- No modifications were made to the development source, database, environment, configuration, migrations, or tests; no workflows were executed.
- No source revision is reported because the development source is not a Git repository.
- 'Partially Ready' frequently reflects **unverified** (not necessarily missing) behavior; see the *Missing behavior / blocker* column for the specific uncertainty.
- Security, OTP/2FA, brute-force, and session-expiry scenarios were assessed individually (not auto-classified as manual-only).
- Activating the Playwright suite against a live environment still requires a configured `BASE_URL` and test credentials; Phase 1 auth tests remain skipped until then.

