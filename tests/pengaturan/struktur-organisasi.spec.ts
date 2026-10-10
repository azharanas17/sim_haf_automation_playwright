import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { BidangPage } from '../../pages/BidangPage';
import { KhidmahPage } from '../../pages/KhidmahPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin } from '../../test-data/users';
import {
  MESSAGES,
  uniqueBidangName,
  uniqueKhidmahName,
} from '../../test-data/struktur-organisasi';

/**
 * Approved journey J-S2 - "Kelola Struktur Organisasi: Bidang -> Khidmah
 * (UC-1, FR-03, 15.1.1-15.1.2)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-012 .. TC-REQ-021 (10 scenarios).
 *
 * Locators are grounded in the development source (routes, views, form
 * components, controllers/services) - see the page objects for provenance.
 * Expected behavior is preserved verbatim from the workbook.
 *
 * EXECUTION GUARD: every scenario needs an authenticated Superadmin session.
 * `declareScenario({ requiresSession: true, user: superadmin() })` skips the
 * test unless BASE_URL and the identity credentials are configured. OTP is not
 * assumed: a TOTP secret is only required when the identity declares
 * `otpRequired` (see `test-data/users.ts`). No application execution is
 * authorized in this phase; these tests are registered and traceable and become
 * runnable once the environment + session are available.
 */

const JOURNEY =
  'J-S2 - Kelola Struktur Organisasi: Bidang \u2192 Khidmah (UC-1, FR-03, 15.1.1\u201315.1.2)';
const REQUIREMENTS = ['UC-1', 'FR-03', '15.1.1', '15.1.2'];
const ROLE = 'Superadmin';

/** Readiness limitations (quoted) for the two Partially Ready scenarios. */
const DEFERRED_020 =
  'Partially Ready (DEVELOPMENT_READINESS_ASSESSMENT.md J-S2): explicit block/confirm ' +
  'on deleting a Bidang that still has child Khidmah/data turunan is not evidenced; ' +
  'the behavior relies on FK restraint. Deferred per Phase 3 instruction; expected ' +
  'result "Diblokir / perlu konfirmasi dan pengecekan relasi (FK restraint)" is unchanged.';
const DEFERRED_021 =
  'Partially Ready (DEVELOPMENT_READINESS_ASSESSMENT.md J-S2): deleting an in-use ' +
  'Khidmah (RAB, pengeluaran, kepanitiaan) restraint is not explicitly evidenced. ' +
  'Deferred per Phase 3 instruction; expected result "Diblokir; hindari data yatim ' +
  '(orphan)" is unchanged.';

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
const bestEffort = async (action: () => Promise<void>): Promise<void> => {
  try {
    await action();
  } catch {
    // Cleanup is best-effort; the test result must reflect the assertions.
  }
};

authTest.describe(`Struktur Organisasi - ${JOURNEY}`, () => {
  authTest(
    testTitle(meta('TC-REQ-012', 'Buka Pengaturan > Bidang')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "List Bidang sesuai konteks Haul Akbar aktif".
      await beginSession(loginPage, 'TC-REQ-012', 'Buka Pengaturan > Bidang');

      const bidang = new BidangPage(page);
      await bidang.goto();
      await bidang.expectDisplayed();
      // The list view ("List Bidang") renders as a table with the aktif context.
      await expect(bidang.table).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-013', 'Tambah Bidang "Konsumsi"')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan".
      await beginSession(loginPage, 'TC-REQ-013', 'Tambah Bidang "Konsumsi"');

      const bidang = new BidangPage(page);
      await bidang.goto();
      const nama = uniqueBidangName('Konsumsi');

      try {
        await bidang.addBidang(nama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);
        await bidang.expectRow(nama);
      } finally {
        await bestEffort(() => bidang.deleteByNameIfPresent(nama));
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-014', 'Tambah Bidang dengan nama duplikat')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak (unik per Haul Akbar)".
      await beginSession(
        loginPage,
        'TC-REQ-014',
        'Tambah Bidang dengan nama duplikat'
      );

      const bidang = new BidangPage(page);
      await bidang.goto();
      const nama = uniqueBidangName('Konsumsi');

      try {
        // Seed one record, then attempt the same name again within the same HA.
        await bidang.addBidang(nama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);

        await bidang.openAddForm();
        await bidang.addNamaInput.fill(nama);
        await bidang.addForm
          .getByRole('button', { name: 'Simpan', exact: true })
          .click();

        await bidang.expectValidationError(MESSAGES.bidangNamaDuplicate);
        // Invalid data was not persisted: exactly one row carries the name.
        expect(await bidang.countRows(nama)).toBe(1);
      } finally {
        await bestEffort(() => bidang.deleteByNameIfPresent(nama));
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-015', 'Buka Pengaturan > Khidmah, tambah khidmah')
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan; Khidmah dependent ke Bidang".
      await beginSession(
        loginPage,
        'TC-REQ-015',
        'Buka Pengaturan > Khidmah, tambah khidmah'
      );

      const bidang = new BidangPage(page);
      const khidmah = new KhidmahPage(page);
      const bidangNama = uniqueBidangName('Bidang Induk');
      const khidmahNama = uniqueKhidmahName('Jamuan');

      try {
        // Precondition: a parent Bidang must exist for the dependent Khidmah.
        await bidang.goto();
        await bidang.addBidang(bidangNama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);

        await khidmah.goto();
        await khidmah.addKhidmah(khidmahNama, bidangNama);
        await khidmah.expectSuccess(MESSAGES.khidmahCreated);
        await khidmah.expectRow(khidmahNama);
      } finally {
        await bestEffort(() => khidmah.deleteByNameIfPresent(khidmahNama));
        await bestEffort(async () => {
          await bidang.goto();
          await bidang.deleteByNameIfPresent(bidangNama);
        });
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-016', 'Tambah Khidmah tanpa Bidang')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak".
      await beginSession(
        loginPage,
        'TC-REQ-016',
        'Tambah Khidmah tanpa Bidang'
      );

      const khidmah = new KhidmahPage(page);
      await khidmah.goto();
      await khidmah.openAddForm();

      const nama = uniqueKhidmahName('TanpaBidang');
      await khidmah.addNamaInput.fill(nama);
      // Leave "Menaungi Bidang" at its empty placeholder, then submit.
      await khidmah.addForm
        .getByRole('button', { name: 'Simpan', exact: true })
        .click();

      // Rejected: no success feedback and no persisted row.
      await expect(khidmah.addForm).toBeVisible();
      await expect(khidmah.addBidangSelect).toBeVisible();
      expect(await khidmah.isFieldInvalid(khidmah.addBidangSelect)).toBe(true);
      await expect(page.getByText(MESSAGES.khidmahCreated)).toHaveCount(0);
      // The native `required` rejection leaves the add modal open; dismiss it
      // before interacting with the (otherwise obscured) list controls.
      await khidmah.closeAddForm();
      await khidmah.expectRowAbsent(nama);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-017', 'Edit/hapus Bidang & Khidmah')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Berhasil; relasi terkait dicek".
      await beginSession(loginPage, 'TC-REQ-017', 'Edit/hapus Bidang & Khidmah');

      const bidang = new BidangPage(page);
      const khidmah = new KhidmahPage(page);
      const bidangNama = uniqueBidangName('Bidang Edit');
      const bidangNamaBaru = uniqueBidangName('Bidang Edit Baru');
      const khidmahNama = uniqueKhidmahName('Seksi Edit');
      const khidmahNamaBaru = uniqueKhidmahName('Seksi Edit Baru');

      try {
        await bidang.goto();
        await bidang.addBidang(bidangNama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);

        // Edit Bidang.
        await bidang.editName(bidangNama, bidangNamaBaru);
        await bidang.expectSuccess(MESSAGES.bidangUpdated);
        await bidang.expectRow(bidangNamaBaru);

        // Create + edit Khidmah.
        await khidmah.goto();
        await khidmah.addKhidmah(khidmahNama, bidangNamaBaru);
        await khidmah.expectSuccess(MESSAGES.khidmahCreated);
        await khidmah.editName(khidmahNama, khidmahNamaBaru);
        await khidmah.expectSuccess(MESSAGES.khidmahUpdated);
        await khidmah.expectRow(khidmahNamaBaru);

        // Delete Khidmah before its parent Bidang (relasi terkait dicek).
        await khidmah.deleteByName(khidmahNamaBaru);
        await khidmah.expectSuccess(MESSAGES.khidmahDeleted);
        await khidmah.expectRowAbsent(khidmahNamaBaru);

        await bidang.goto();
        await bidang.deleteByName(bidangNamaBaru);
        await bidang.expectSuccess(MESSAGES.bidangDeleted);
        await bidang.expectRowAbsent(bidangNamaBaru);
      } finally {
        await bestEffort(async () => {
          await khidmah.goto();
          await khidmah.deleteByNameIfPresent(khidmahNama);
        });
        await bestEffort(async () => {
          await khidmah.goto();
          await khidmah.deleteByNameIfPresent(khidmahNamaBaru);
        });
        await bestEffort(async () => {
          await bidang.goto();
          await bidang.deleteByNameIfPresent(bidangNama);
        });
        await bestEffort(async () => {
          await bidang.goto();
          await bidang.deleteByNameIfPresent(bidangNamaBaru);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-018',
        'Memastikan sistem menangani kondisi: Nama Bidang kosong / duplikat'
      )
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak dengan pesan validasi".
      await beginSession(
        loginPage,
        'TC-REQ-018',
        'Memastikan sistem menangani kondisi: Nama Bidang kosong / duplikat'
      );

      const bidang = new BidangPage(page);
      await bidang.goto();

      // Case 1 - empty name: native required constraint rejects the submit.
      await bidang.openAddForm();
      await bidang.addForm
        .getByRole('button', { name: 'Simpan', exact: true })
        .click();
      await expect(bidang.addForm).toBeVisible();
      expect(await bidang.isFieldInvalid(bidang.addNamaInput)).toBe(true);
      await expect(page.getByText(MESSAGES.bidangCreated)).toHaveCount(0);
      // Dismiss the modal left open by the native `required` rejection so the
      // next "Tambah Bidang" click is not blocked by the modal overlay.
      await bidang.closeAddForm();

      // Case 2 - duplicate name: server-side uniqueness (per Haul Akbar).
      const nama = uniqueBidangName('Konsumsi');
      try {
        await bidang.addBidang(nama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);

        await bidang.openAddForm();
        await bidang.addNamaInput.fill(nama);
        await bidang.addForm
          .getByRole('button', { name: 'Simpan', exact: true })
          .click();

        await bidang.expectValidationError(MESSAGES.bidangNamaDuplicate);
        expect(await bidang.countRows(nama)).toBe(1);
      } finally {
        await bestEffort(() => bidang.deleteByNameIfPresent(nama));
      }
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-019',
        'Memastikan sistem menangani kondisi: Khidmah tanpa Bidang'
      )
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak".
      await beginSession(
        loginPage,
        'TC-REQ-019',
        'Memastikan sistem menangani kondisi: Khidmah tanpa Bidang'
      );

      const khidmah = new KhidmahPage(page);
      await khidmah.goto();
      await khidmah.openAddForm();

      const nama = uniqueKhidmahName('Khidmah Tanpa Induk');
      await khidmah.addNamaInput.fill(nama);
      await khidmah.addForm
        .getByRole('button', { name: 'Simpan', exact: true })
        .click();

      // No orphan Khidmah is created; the field remains invalid.
      await expect(khidmah.addForm).toBeVisible();
      expect(await khidmah.isFieldInvalid(khidmah.addBidangSelect)).toBe(true);
      await expect(page.getByText(MESSAGES.khidmahCreated)).toHaveCount(0);
      // The native `required` rejection leaves the add modal open; dismiss it
      // before interacting with the (otherwise obscured) list controls.
      await khidmah.closeAddForm();
      await khidmah.expectRowAbsent(nama);
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-020',
        'Memastikan sistem menangani kondisi: Hapus Bidang yang masih punya Khidmah / data turunan',
        { deferred: DEFERRED_020 }
      )
    ),
    async ({ page, loginPage }) => {
      // Retained for future execution once the readiness limitation is cleared.
      await beginSession(
        loginPage,
        'TC-REQ-020',
        'Memastikan sistem menangani kondisi: Hapus Bidang yang masih punya Khidmah / data turunan',
        { deferred: DEFERRED_020 }
      );

      const bidang = new BidangPage(page);
      const khidmah = new KhidmahPage(page);
      const bidangNama = uniqueBidangName('Bidang Berisi');
      const khidmahNama = uniqueKhidmahName('Seksi Isi');

      try {
        await bidang.goto();
        await bidang.addBidang(bidangNama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);
        await khidmah.goto();
        await khidmah.addKhidmah(khidmahNama, bidangNama);
        await khidmah.expectSuccess(MESSAGES.khidmahCreated);

        await bidang.goto();
        await bidang.deleteByName(bidangNama);
        await bidang.expectValidationError(MESSAGES.bidangDeleteBlocked);
        await bidang.expectRow(bidangNama);
      } finally {
        await bestEffort(async () => {
          await khidmah.goto();
          await khidmah.deleteByNameIfPresent(khidmahNama);
        });
        await bestEffort(async () => {
          await bidang.goto();
          await bidang.deleteByNameIfPresent(bidangNama);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-021',
        'Memastikan sistem menangani kondisi: Hapus Khidmah yang terpakai (RAB, pengeluaran, kepanitiaan)',
        { deferred: DEFERRED_021 }
      )
    ),
    async ({ page, loginPage }) => {
      // Retained for future execution once the readiness limitation is cleared.
      await beginSession(
        loginPage,
        'TC-REQ-021',
        'Memastikan sistem menangani kondisi: Hapus Khidmah yang terpakai (RAB, pengeluaran, kepanitiaan)',
        { deferred: DEFERRED_021 }
      );

      const bidang = new BidangPage(page);
      const khidmah = new KhidmahPage(page);
      const bidangNama = uniqueBidangName('Bidang Terpakai');
      const khidmahNama = uniqueKhidmahName('Seksi Terpakai');

      try {
        await bidang.goto();
        await bidang.addBidang(bidangNama);
        await bidang.expectSuccess(MESSAGES.bidangCreated);
        await khidmah.goto();
        await khidmah.addKhidmah(khidmahNama, bidangNama);
        await khidmah.expectSuccess(MESSAGES.khidmahCreated);

        // Precondition "terpakai by RAB/pengeluaran/kepanitiaan" cannot be
        // provisioned safely in this phase; the rejection must be observed.
        await khidmah.deleteByName(khidmahNama);
        await khidmah.expectValidationError(MESSAGES.khidmahDeleteBlockedPeriode);
        await khidmah.expectRow(khidmahNama);
      } finally {
        await bestEffort(() => khidmah.deleteByNameIfPresent(khidmahNama));
        await bestEffort(async () => {
          await bidang.goto();
          await bidang.deleteByNameIfPresent(bidangNama);
        });
      }
    }
  );
});
