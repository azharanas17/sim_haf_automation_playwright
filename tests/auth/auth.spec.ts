import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/LoginPage';
import { ScenarioMeta } from '../../utils/helpers';
import {
  inactiveSuperadmin,
  invalidCredentials,
  superadmin,
  User,
} from '../../test-data/users';

/**
 * Authentication vertical slice - approved journey J-S1
 * "Login & Pilih Haul Akbar (FR-02, Auth, SR-8)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-001 .. TC-REQ-011.
 *
 * Expected behavior below is taken from the workbook and is intentionally
 * independent of the current application implementation. Locators are
 * semantic candidates marked `LOCATOR-TODO` in the page objects and are not
 * derived from development source code.
 */

const JOURNEY = 'J-S1 - Login & Pilih Haul Akbar (FR-02, Auth, SR-8)';
const REQUIREMENTS = ['FR-02', 'SR-6', 'SR-8'];
const ROLE = 'Superadmin';

const meta = (
  id: string,
  scenario: string,
  extra: Partial<ScenarioMeta> = {}
): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...extra,
});

/** Navigate to the login screen and submit credentials. */
const submitCredentials = async (
  loginPage: LoginPage,
  user: User
): Promise<void> => {
  await loginPage.goto();
  await loginPage.expectDisplayed();
  await loginPage.loginWith(user.email, user.password);
};

/**
 * Establish an authenticated Superadmin session.
 *
 * UNRESOLVED ADAPTER (2FA): the workbook records the Superadmin account as
 * "2FA enabled". The OTP entry mechanism is not finalised in Phase 1 (see
 * LoginPage.submitOtp). Session-dependent tests are skipped by
 * declareScenario() unless a TOTP secret is configured.
 */
const signInAsSuperadmin = async (
  loginPage: LoginPage,
  user: User
): Promise<void> => {
  await submitCredentials(loginPage, user);
  if (user.totpSecret) {
    await loginPage.submitOtp(user.totpSecret);
  }
};

authTest.describe(`Authentication - ${JOURNEY}`, () => {
  authTest(
    testTitle(meta('TC-REQ-001', 'Buka halaman login & masukkan kredensial valid')),
    async ({ loginPage, dashboardPage }) => {
      declareScenario(meta('TC-REQ-001', 'Buka halaman login & masukkan kredensial valid'), {
        requiresCredentials: true,
        user: superadmin(),
      });

      await submitCredentials(loginPage, superadmin());

      // Approved expected result: "Login berhasil".
      // With 2FA enabled, a successful credential step surfaces either the
      // OTP step (TC-REQ-002) or the authenticated dashboard.
      // LOCATOR-TODO: confirm the OTP/dashboard surfaces against UAT.
      await expect(
        loginPage.otpInput.or(dashboardPage.dashboardHeading).first()
      ).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-002', 'Masukkan kode OTP valid')),
    async ({ loginPage, dashboardPage }) => {
      declareScenario(
        meta('TC-REQ-002', 'Masukkan kode OTP valid', {
          deferred:
            'Requires a valid TOTP secret and the unresolved 2FA/OTP adapter; no 2FA secret is available in Phase 1.',
        })
      );

      await signInAsSuperadmin(loginPage, superadmin());
      // Approved expected result: "Masuk dashboard".
      await dashboardPage.expectDisplayed();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-003', 'Periksa navbar dropdown Haul Akbar aktif')),
    async ({ loginPage, dashboardPage }) => {
      declareScenario(
        meta('TC-REQ-003', 'Periksa navbar dropdown Haul Akbar aktif'),
        { requiresSession: true, user: superadmin() }
      );

      await signInAsSuperadmin(loginPage, superadmin());
      // Approved expected result: "Dropdown menampilkan entitas Haul Akbar".
      await dashboardPage.expectHaulAkbarSelectorVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-004', 'Ganti Haul Akbar di navbar (tanpa logout)')),
    async ({ loginPage, dashboardPage }) => {
      declareScenario(
        meta('TC-REQ-004', 'Ganti Haul Akbar di navbar (tanpa logout)'),
        { requiresSession: true, user: superadmin() }
      );

      await signInAsSuperadmin(loginPage, superadmin());
      // Test data (workbook): pindah HAF 2025 -> 2026.
      await dashboardPage.selectHaulAkbar(/HAF 2026/i);
      // Approved expected result: "Seluruh data menu/dashboard mengikuti
      // konteks baru". The exact data shift cannot be asserted without an
      // approved baseline dataset; assert the selector reflects the choice.
      // LOCATOR-TODO: confirm the context indicator against UAT.
      await expect(dashboardPage.haulAkbarSelector.first()).toContainText(
        /2026/i
      );
    }
  );

  authTest(
    testTitle(meta('TC-REQ-005', 'Klik logout')),
    async ({ loginPage, dashboardPage }) => {
      declareScenario(meta('TC-REQ-005', 'Klik logout'), {
        requiresSession: true,
        user: superadmin(),
      });

      await signInAsSuperadmin(loginPage, superadmin());
      await dashboardPage.logout();
      // Approved expected result: "Sesi berakhir, kembali ke halaman login".
      await loginPage.expectDisplayed();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-006',
        'Memastikan sistem menangani kondisi: Password salah / email tidak terdaftar'
      )
    ),
    async ({ loginPage }) => {
      declareScenario(
        meta(
          'TC-REQ-006',
          'Memastikan sistem menangani kondisi: Password salah / email tidak terdaftar'
        )
      );

      const bad = invalidCredentials();
      await submitCredentials(loginPage, { role: ROLE, ...bad });
      // Approved expected result: "Login ditolak, pesan error jelas".
      await loginPage.expectErrorVisible();
      // NOTE: the workbook also requires "catatan activity_logs + log
      // autentikasi". Backend log verification is out of scope for UI
      // automation in Phase 1 and is intentionally not asserted here.
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-007',
        'Memastikan sistem menangani kondisi: OTP salah / kedaluwarsa'
      )
    ),
    async ({ loginPage }) => {
      declareScenario(
        meta(
          'TC-REQ-007',
          'Memastikan sistem menangani kondisi: OTP salah / kedaluwarsa',
          {
            deferred:
              'Requires the unresolved 2FA/OTP adapter and a controlled OTP source; not available in Phase 1.',
          }
        )
      );

      await submitCredentials(loginPage, superadmin());
      // Approved expected result: "2FA gagal, login ditolak, tidak masuk dashboard".
      await loginPage.submitOtp('000000');
      await loginPage.expectErrorVisible();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-008',
        'Memastikan sistem menangani kondisi: Percobaan login gagal berulang (brute-force)'
      )
    ),
    async ({ loginPage }) => {
      declareScenario(
        meta(
          'TC-REQ-008',
          'Memastikan sistem menangani kondisi: Percobaan login gagal berulang (brute-force)',
          {
            deferred:
              'Requires repeatable failed-login attempts plus backend rate-limit/audit observation; risks locking a real UAT account in Phase 1.',
          }
        )
      );

      const bad = invalidCredentials();
      // Approved expected result: "Rate limiting aktif (SR-6), akun/request
      // diblokir sementara". Repeated attempts count is not defined by the
      // workbook and must not be guessed.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await submitCredentials(loginPage, { role: ROLE, ...bad });
      }
      await loginPage.expectErrorVisible();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-009',
        'Memastikan sistem menangani kondisi: User ingin membuka halaman tanpa sesi'
      )
    ),
    async ({ dashboardPage, loginPage, page }) => {
      declareScenario(
        meta(
          'TC-REQ-009',
          'Memastikan sistem menangani kondisi: User ingin membuka halaman tanpa sesi'
        )
      );

      // Approved expected result: "Redirect ke login (Auth middleware)".
      await dashboardPage.gotoProtected();
      const loginPath = process.env.LOGIN_PATH || '/login';
      const escaped = loginPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(page).toHaveURL(new RegExp(escaped));
      await loginPage.expectDisplayed();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-010',
        'Memastikan sistem menangani kondisi: User status Nonaktif'
      )
    ),
    async ({ loginPage }) => {
      declareScenario(
        meta(
          'TC-REQ-010',
          'Memastikan sistem menangani kondisi: User status Nonaktif',
          {
            deferred:
              'Requires a deliberately inactive account provisioned in UAT; the workbook does not define one (see .env.example).',
          }
        )
      );

      await submitCredentials(loginPage, inactiveSuperadmin());
      // Approved expected result: "Login ditolak (15.1.7)".
      await loginPage.expectErrorVisible();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-011',
        'Memastikan sistem menangani kondisi: Sesi kadaluarsa saat beraktivitas'
      )
    ),
    async ({ loginPage, dashboardPage }) => {
      declareScenario(
        meta(
          'TC-REQ-011',
          'Memastikan sistem menangani kondisi: Sesi kadaluarsa saat beraktivitas',
          {
            deferred:
              'Requires a controllable/expired session token or app-configured short session timeout; not available without application-specific setup.',
          }
        )
      );

      await signInAsSuperadmin(loginPage, superadmin());
      // Approved expected result: "Kembali ke login / token expired handler".
      await dashboardPage.gotoProtected();
      await loginPage.expectDisplayed();
    }
  );
});
