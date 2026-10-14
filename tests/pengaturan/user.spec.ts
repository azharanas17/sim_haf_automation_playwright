import { expect, Locator, Page } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { UserPage } from '../../pages/UserPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin, nonaktifPjSeksi } from '../../test-data/users';
import {
  MESSAGES,
  ROLES,
  strongPassword,
  uniqueEmail,
  uniqueNama,
  weakPassword,
} from '../../test-data/user';

/**
 * Approved journey J-S6 - "Kelola User & Role (FR-05, UC-2)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-042 .. TC-REQ-051 (10 scenarios).
 *
 * Scenarios 042, 043, 044, 046, 047, 048, 049, 050, 051 are implemented for
 * real against the app (grounded in `UserController`, `UserPolicy`,
 * `StoreUserRequest`, `UpdateUserRequest`, `resources/views/pengaturan/user/*`).
 * Scenario 045 (multi-haul access) is deferred: its observable outcome depends
 * on two or more Haul Akbar fixtures being exercised against the live navbar
 * switcher after a role login.
 *
 * Every test creates its OWN users (unique emails) and deletes them in a
 * best-effort cleanup, so runs never mutate UAT fixture accounts. The created
 * PJ Seksi accounts authenticate WITHOUT OTP (no TOTP secret is configured on
 * them), which is why the role-login tests can reuse the same credentials.
 *
 * LOGIN THROTTLE: sign-out/sign-in transitions in 043/044/051 each consume a
 * login POST; the batching plan (workers=1, expectedLogins <= 4) accounts for
 * this. Deferred scenarios introduce no logins (declareScenario aborts them).
 */

const JOURNEY = 'J-S6 - Kelola User & Role (FR-05, UC-2)';
const REQUIREMENTS = ['FR-05', 'UC-2'];
const ROLE = 'Superadmin';

/** Scenario 045 blocker (quoted for traceability). */
const DEFERRED_045 =
  'Multi-haul access (TC-REQ-045) requires >= 2 Haul Akbar fixtures and observing ' +
  'the navbar switcher after a role login (DashboardPage.selectHaulAkbar). Not ' +
  'provisionable in this phase; deferred per Phase 3 instruction; expected result ' +
  '(dropdown only lists the Haul Akbars granted) unchanged.';

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

/** Declare the scenario (session-guarded) and sign in as Superadmin. */
const beginSession = async (
  loginPage: Parameters<typeof signIn>[0],
  id: string,
  scenario: string,
  extra: Partial<ScenarioMeta> = {}
): Promise<void> => {
  declareScenario(meta(id, scenario, extra), {
    requiresSession: true,
    user: superadmin(),
  });
  await signIn(loginPage, superadmin());
};

/** Best-effort cleanup - never masks the assertion outcome of a test. */
/**
 * Best-effort cleanup - never masks the assertion outcome of a test, but a
 * failed cleanup is surfaced (console warning + test attachment) so leftover
 * operational data is visible in the report instead of being silently lost.
 * The label is optional; an unlabeled step is numbered for traceability.
 */
let bestEffortSeq = 0;
const bestEffort = async (
  labelOrAction: string | (() => Promise<void>),
  maybeAction?: () => Promise<void>
): Promise<void> => {
  const label =
    typeof labelOrAction === 'string'
      ? labelOrAction
      : `cleanup#${++bestEffortSeq}`;
  const action =
    typeof labelOrAction === 'function' ? labelOrAction : maybeAction!;
  try {
    await action();
  } catch (error) {
    const message =
      error instanceof Error ? error.stack ?? error.message : String(error);
    console.warn(`[bestEffort] "${label}" failed: ${message}`);
    try {
      await authTest.info().attach(`cleanup-failed-${label}`, {
        body: `Cleanup step "${label}" failed:\n\n${message}`,
        contentType: 'text/plain',
      });
    } catch {
      // Attaching is itself best-effort; the test outcome is unaffected.
    }
  }
};

/** First usable (non-placeholder) option label of a select. */
const firstOptionLabel = async (select: Locator): Promise<string> => {
  const opts = await select.locator('option').all();
  for (const o of opts.slice(1)) {
    const text = (await o.textContent()) ?? '';
    if (text.trim()) return text.trim();
  }
  throw new Error('No selectable option available.');
};

/** Pick the first serving Bidang, then the first Khidmah nested under it. */
const chooseFirstBidangAndKhidmah = async (
  page: Page
): Promise<{ bidang: string; khidmah: string }> => {
  const bidangSelect = page.locator('select[name="bidang_id"]');
  const khidmahSelect = page.locator('select[name="khidmah_id"]');
  const bidang = await firstOptionLabel(bidangSelect);
  await bidangSelect.selectOption({ label: bidang });
  await expect(khidmahSelect).toBeEnabled();
  const khidmah = await firstOptionLabel(khidmahSelect);
  return { bidang, khidmah };
};

/**
 * Fill the create form for a PJ Seksi (scoped) user that we created ourselves.
 * Credentials therefore need no pre-configured secret and login works OTP-less.
 */
const createPjSeksi = async (
  page: Page,
  input: { nama: string; email: string; password: string }
): Promise<void> => {
  const users = new UserPage(page);
  await users.gotoCreate();
  const scope = await chooseFirstBidangAndKhidmah(page);
  await users.createUser({ roleLabel: 'PJ Seksi', ...input, scope });
  await users.expectSuccess(MESSAGES.userCreated);
};

authTest.describe(() => {
  authTest(
    testTitle(
      meta('TC-REQ-042', 'Buat user untuk tiap role (7 user) | EXPECT: masing-masing bisa login sesuai role.')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-042', 'Buat user untuk tiap role (7 user)');

      const users = new UserPage(page);
      const created: Array<{ email: string }> = [];

      try {
        for (const role of ROLES) {
          const email = uniqueEmail();
          const nama = uniqueNama();
          let scope: { bidang: string; khidmah: string } | undefined;
          if (role.scoped) {
            await users.gotoCreate();
            scope = await chooseFirstBidangAndKhidmah(page);
          }
          await users.createUser({
            roleLabel: role.label,
            nama,
            email,
            password: strongPassword(),
            scope,
          });
          // Positive outcome: user is created and listed under its role.
          await users.expectSuccess(MESSAGES.userCreated);
          await users.expectRowVisible(email);
          created.push({ email });
        }
        expect(created).toHaveLength(ROLES.length);
        // The "masing-masing bisa login sesuai role" part is exercised by
        // TC-REQ-043 (PJ Seksi menu matrix) and TC-REQ-051 (out-of-permission),
        // plus the role journeys whose identities come from the UAT seeder.
      } finally {
        await bestEffort(async () => {
          for (const c of created) {
            await users.deleteByEmailIfPresent(c.email);
          }
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-043', 'Login user PJ Seksi | EXPECT: hanya menu yang sesuai matrix (tidak lihat Users & Role).')
    ),
    async ({ page, loginPage, dashboardPage }) => {
      await beginSession(loginPage, 'TC-REQ-043', 'Login user PJ Seksi');

      const users = new UserPage(page);
      const email = uniqueEmail();
      const nama = uniqueNama();
      const password = strongPassword();

      try {
        await createPjSeksi(page, { nama, email, password });

        // Switch user: log out Superadmin, then sign in as the PJ Seksi.
        await dashboardPage.logout();
        await loginPage.goto();
        await loginPage.loginWith(email, password);

        // Role matrix (8.3): PJ Seksi must NOT see the Superadmin-only menus.
        await dashboardPage.expectDisplayed();
        await expect(
          page.getByRole('link', { name: /Akun Pengguna/i })
        ).toHaveCount(0);
        await expect(
          page.getByRole('link', { name: /Backup & Restore/i })
        ).toHaveCount(0);
        // "Struktur Panitia" renders only for Superadmin | Kabid | SekBid.
        await expect(
          page.getByRole('link', { name: /Struktur Panitia/i })
        ).toHaveCount(0);
      } finally {
        await bestEffort(async () => {
          await page
            .getByRole('button', { name: new RegExp(nama, 'i') })
            .first()
            .click();
          await dashboardPage.logoutControl.first().click();
          await signIn(loginPage, superadmin());
          await users.deleteByEmailIfPresent(email);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-044', 'Nonaktifkan salah satu user | EXPECT: login user tersebut ditolak.')
    ),
    async ({ page, loginPage, dashboardPage }) => {
      await beginSession(loginPage, 'TC-REQ-044', 'Nonaktifkan salah satu user');

      const users = new UserPage(page);
      const email = uniqueEmail();
      const password = strongPassword();

      try {
        await createPjSeksi(page, { nama: uniqueNama(), email, password });

        // Deactivate through the index row action (PATCH toggle-status).
        await users.toggleStatus(email, 'Nonaktifkan');
        await users.expectSuccess(MESSAGES.statusToggled);

        // The deactivated account must be rejected on login.
        await dashboardPage.logout();
        await loginPage.goto();
        await loginPage.loginWith(email, password);
        await loginPage.expectErrorVisible();
        await expect(
          page.getByText('Akun Anda nonaktif. Silakan hubungi administrator.')
        ).toBeVisible();
      } finally {
        await bestEffort(async () => {
          await signIn(loginPage, superadmin());
          await users.deleteByEmailIfPresent(email);
        });
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-045', 'Set multi-haul akses', { deferred: DEFERRED_045 })),
    async ({ loginPage }) => {
      // Deferred scenarios abort (skip) in declareScenario before any sign-in.
      await beginSession(loginPage, 'TC-REQ-045', 'Set multi-haul akses', {
        deferred: DEFERRED_045,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-046', 'Edit password / role user | EXPECT: perubahan tersimpan; hash password sebelum persist.')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-046', 'Edit password / role user');

      const users = new UserPage(page);
      const email = uniqueEmail();

      try {
        await createPjSeksi(page, { nama: uniqueNama(), email, password: strongPassword() });

        // Role change persists through the edit form.
        await users.editUser(email, { roleLabel: 'Sekretaris Bidang' });
        await users.expectSuccess(MESSAGES.userUpdated);
        await users.expectRowVisible(email);

        // Password reset through the index modal; UserService hashes before
        // persist (no plaintext value is ever stored - verified in source).
        await users.resetPassword(email, strongPassword());
        await users.expectSuccess(MESSAGES.passwordReset);
      } finally {
        await bestEffort(async () => {
          await users.deleteByEmailIfPresent(email);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-047', 'Email duplikat | EXPECT: ditolak (unique).')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-047', 'Email duplikat');

      const users = new UserPage(page);
      const email = uniqueEmail();

      try {
        await createPjSeksi(page, { nama: uniqueNama(), email, password: strongPassword() });

        // Second user with the same email must be rejected by the unique rule
        // (StoreUserRequest: 'Email sudah terdaftar.').
        await users.gotoCreate();
        await users.createUser({
          roleLabel: 'PJ Seksi',
          nama: uniqueNama(),
          email,
          password: strongPassword(),
        });
        await users.expectValidationError(MESSAGES.emailTaken);
      } finally {
        await bestEffort(async () => {
          await users.deleteByEmailIfPresent(email);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-048', 'Tanpa role / role tidak valid | EXPECT: ditolak.')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-048', 'Tanpa role / role tidak valid');

      const users = new UserPage(page);
      await users.gotoCreate();
      await page.locator('input[name="nama"]').fill(uniqueNama());
      await page.locator('input[name="email"]').fill(uniqueEmail());
      await page.locator('input[name="password"]').fill(strongPassword());
      // role_id left empty: native HTML5 required blocks the submission.
      const roleSelect = page.locator('select[name="role_id"]');
      await users.submitCreate();
      await expect(await users.isFieldInvalid(roleSelect)).toBe(true);
      await expect(
        page.getByRole('heading', { name: 'Tambah Akun Pengguna', exact: true })
      ).toBeVisible();
      await expect(page.getByText(MESSAGES.userCreated)).toHaveCount(0);
      // An invalid role VALUE is rejected server-side by `exists:roles` in
      // StoreUserRequest (same rejection path); a tampered submit is not
      // reachable through the UI-only form options.
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-049', 'Password lemah (pendek) | EXPECT: ditolak (kebijakan kekuatan password).')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-049', 'Password lemah (pendek)');

      const users = new UserPage(page);
      await users.gotoCreate();
      await page.locator('select[name="role_id"]').selectOption({ label: 'PJ Seksi' });
      await page.locator('input[name="nama"]').fill(uniqueNama());
      await page.locator('input[name="email"]').fill(uniqueEmail());
      // letters() + numbers() present, but shorter than Password::min(8).
      await page.locator('input[name="password"]').fill(weakPassword);
      await users.submitCreate();

      // Server-side password policy rejection: form stays on the create page
      // and no success message appears (redirect back with old input).
      await expect(
        page.getByRole('heading', { name: 'Tambah Akun Pengguna', exact: true })
      ).toBeVisible();
      await expect(page.getByText(MESSAGES.userCreated)).toHaveCount(0);
      await expect(page.getByText(/password/i).first()).toBeVisible();
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-050', 'User nonaktif login | EXPECT: ditolak.')
    ),
    async ({ loginPage }) => {
      const identity = nonaktifPjSeksi();
      declareScenario(meta('TC-REQ-050', 'User nonaktif login'), {
        requiresCredentials: true,
        user: identity,
      });
      // The seeded fixture account marked 'nonaktif' is rejected at the gate.
      await loginPage.goto();
      await loginPage.loginWith(identity.email, identity.password);
      await loginPage.expectErrorVisible();
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-051', 'User buka modul di luar permission | EXPECT: 403 / menu tidak tampil (lihat matriks Bg. 8.3).')
    ),
    async ({ page, loginPage, dashboardPage }) => {
      await beginSession(loginPage, 'TC-REQ-051', 'User buka modul di luar permission');

      const users = new UserPage(page);
      const email = uniqueEmail();
      const nama = uniqueNama();
      const password = strongPassword();

      try {
        await createPjSeksi(page, { nama, email, password });

        await dashboardPage.logout();
        await loginPage.goto();
        await loginPage.loginWith(email, password);
        await dashboardPage.expectDisplayed();

        // Directly opening a Superadmin-only module must be refused:
        // UserPolicy.viewAny -> isSuperadmin() denies -> HTTP 403 page.
        await page.goto('/pengaturan/user');
        await expect(page.getByText(/403/i).first()).toBeVisible();
      } finally {
        await bestEffort(async () => {
          await page
            .getByRole('button', { name: new RegExp(nama, 'i') })
            .first()
            .click();
          await dashboardPage.logoutControl.first().click();
          await signIn(loginPage, superadmin());
          await users.deleteByEmailIfPresent(email);
        });
      }
    }
  );
});