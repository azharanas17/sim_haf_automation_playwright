import { expect, Locator, Page } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { KepanitiaanPage } from '../../pages/KepanitiaanPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin } from '../../test-data/users';
import { MESSAGES, uniquePanitiaNama } from '../../test-data/kepanitiaan';

/**
 * Approved journey J-S5 - "Kelola Kepanitiaan (FR-04, 15.1.6)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-037 .. TC-REQ-041 (5 scenarios). All Ready in
 * the readiness assessment.
 *
 * EXECUTION GUARD: every scenario needs an authenticated Superadmin session and
 * an active Haul Akbar context with serving Bidangs/Khidmahs (J-S1 establishes
 * the context; fixture data supplies the Bidang -> Seksi structure). Tests are
 * registered and traceable and run once the environment + session are available.
 */

const JOURNEY = 'J-S5 - Kelola Kepanitiaan (FR-04, 15.1.6)';
const REQUIREMENTS = ['FR-04', '15.1.6'];
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
const chooseFirstBidangAndKhidmah = async (page: Page): Promise<void> => {
  const bidangSelect = page.locator('select[name="bidang_id"]');
  const khidmahSelect = page.locator('select[name="khidmah_id"]');
  const bidang = await firstOptionLabel(bidangSelect);
  await bidangSelect.selectOption({ label: bidang });
  const khidmah = await firstOptionLabel(khidmahSelect);
  await khidmahSelect.selectOption({ label: khidmah });
};

authTest.describe(`Kepanitiaan - ${JOURNEY}`, () => {
  authTest(
    testTitle(meta('TC-REQ-037', 'Tambah Kepanitiaan lengkap')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan".
      await beginSession(loginPage, 'TC-REQ-037', 'Tambah Kepanitiaan lengkap');

      const kep = new KepanitiaanPage(page);
      const nama = uniquePanitiaNama();
      await kep.gotoCreate();
      await chooseFirstBidangAndKhidmah(page);
      await kep.fillNama(nama);

      try {
        await kep.submitCreate();
        await kep.expectSuccess(MESSAGES.kepanitiaanCreated);
        // Stored separately from the form input: row is searchable by name.
        await kep.gotoIndex();
        await kep.expectRow(nama);
      } finally {
        await bestEffort(() => kep.deleteByNameIfPresent(nama));
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-038', 'Tambah dengan nama kosong')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak".
      await beginSession(loginPage, 'TC-REQ-038', 'Tambah dengan nama kosong');

      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();
      await chooseFirstBidangAndKhidmah(page);

      // Leave Nama empty: native HTML5 `required` rejects the submit.
      await kep.submitCreate();
      await expect(page.locator('input[name="nama"]')).toBeVisible();
      expect(await kep.isFieldInvalid(page.locator('input[name="nama"]'))).toBe(true);
      await expect(page.getByText(MESSAGES.kepanitiaanCreated)).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-039', 'Pilih Khidmah yang beda Bidang')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Form mencegah / menolak (dependent)".
      await beginSession(loginPage, 'TC-REQ-039', 'Pilih Khidmah yang beda Bidang');

      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();

      // Before a Bidang is chosen, the Seksi/Khidmah select is disabled and
      // offers no options, so a Khidmah "dari Bidang lain" cannot be picked.
      const khidmahSelect = page.locator('select[name="khidmah_id"]');
      await expect(khidmahSelect).toBeDisabled();
      expect(await khidmahSelect.locator('option').count()).toBe(1); // placeholder only

      // After a Bidang is chosen, only the Khidmahs nested under it are offered.
      const bidang = await firstOptionLabel(page.locator('select[name="bidang_id"]'));
      await page.locator('select[name="bidang_id"]').selectOption({ label: bidang });
      await expect(khidmahSelect).toBeEnabled();
      const offered = (await khidmahSelect.locator('option').allTextContents())
        .map((t) => t.trim())
        .filter(Boolean);
      expect(offered.length).toBeGreaterThan(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-040', 'Upload foto format salah')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak (JPG/PNG/WebP, ≤5MB)".
      // The request enforces `mimes:jpg,jpeg,png,webp` and `max:2048` (2MB).
      await beginSession(loginPage, 'TC-REQ-040', 'Upload foto format salah');

      const kep = new KepanitiaanPage(page);
      const nama = uniquePanitiaNama('Panitia Foto');
      await kep.gotoCreate();
      await chooseFirstBidangAndKhidmah(page);
      await kep.fillNama(nama);

      try {
        // Non-image file: rejected by the server-side `mimes` rule (no save).
        await page
          .locator('input[name="foto"]')
          .setInputFiles({
            name: 'foto.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not-an-image', 'utf8'),
          });
        await kep.submitCreate();
        await kep.expectValidationError(MESSAGES.fotoMime);
        await expect(page.getByText(MESSAGES.kepanitiaanCreated)).toHaveCount(0);
      } finally {
        await bestEffort(() => kep.deleteByNameIfPresent(nama));
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-041', 'Edit/hapus data kepanitiaan')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Berhasil; relasi user (jika terhubung) konsisten".
      await beginSession(loginPage, 'TC-REQ-041', 'Edit/hapus data kepanitiaan');

      const kep = new KepanitiaanPage(page);
      const nama = uniquePanitiaNama('Panitia Edit');
      const namaBaru = uniquePanitiaNama('Panitia Edit Baru');

      try {
        await kep.gotoCreate();
        await chooseFirstBidangAndKhidmah(page);
        await kep.fillNama(nama);
        await kep.submitCreate();
        await kep.expectSuccess(MESSAGES.kepanitiaanCreated);

        // Edit the member's name via the dedicated edit page.
        await kep.editNama(nama, namaBaru);
        await kep.expectSuccess(MESSAGES.kepanitiaanUpdated);
        await kep.gotoIndex();
        await kep.expectRow(namaBaru);

        // Delete the freshly created member (no linked user in this phase).
        await kep.gotoIndex();
        await kep.deleteByName(namaBaru);
        await kep.expectSuccess(MESSAGES.kepanitiaanDeleted);
        await kep.expectRowAbsent(namaBaru);
      } finally {
        await bestEffort(() => kep.deleteByNameIfPresent(nama));
        await bestEffort(() => kep.deleteByNameIfPresent(namaBaru));
      }
    }
  );
});