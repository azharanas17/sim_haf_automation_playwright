import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { HaulAkbarPage } from '../../pages/HaulAkbarPage';
import { PeriodePage } from '../../pages/PeriodePage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin } from '../../test-data/users';
import {
  MESSAGES,
  uniqueHaulAkbarName,
  uniqueHaulAkbarSingkatan,
  uniqueTahunHijriyah,
  uniqueTahunMasehi,
} from '../../test-data/haul-akbar-periode';

/**
 * Approved journey J-S3 - "Kelola Haul Akbar & Periode
 * (UC-3, FR-01, 15.1.3-15.1.4)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-022 .. TC-REQ-029 (8 scenarios).
 *
 * Locators are grounded in the development source (routes, views, form
 * components, controllers/requests) - see the page objects for provenance.
 * Expected behavior is preserved verbatim from the workbook.
 *
 * EXECUTION GUARD: every scenario needs an authenticated Superadmin session.
 * `declareScenario({ requiresSession: true, user: superadmin() })` skips the
 * test unless BASE_URL and the identity credentials are configured. No
 * application execution is authorized in this phase; these tests are registered
 * and traceable and become runnable once the environment + session are available.
 *
 * ACTIVE-HA PRECONDITION: the Periode list is scoped to the active Haul Akbar
 * (`PeriodeController::index` -> `session('active_haul_akbar_id')`), which J-S1
 * establishes. Periode scenarios therefore create records under the active HA.
 */

const JOURNEY =
  'J-S3 - Kelola Haul Akbar & Periode (UC-3, FR-01, 15.1.3\u201315.1.4)';
const REQUIREMENTS = ['FR-01', 'UC-3'];
const ROLE = 'Superadmin';

/** Readiness limitation (quoted) for the two Partially Ready scenarios. */
const DEFERRED_028 =
  'Partially Ready (DEVELOPMENT_READINESS_ASSESSMENT.md J-S3): retention policy for ' +
  'deleting a Periode that already holds transactions/RAB (FK restraint vs archive) is ' +
  'not evidenced in PeriodeController/PeriodeHaulAkbarService. Deferred per Phase 3 ' +
  'instruction; expected result "Diblokir atau dipindah ke arsip (sesuai keputusan retensi ' +
  'selamanya)" is unchanged.';
const DEFERRED_029 =
  'Partially Ready (DEVELOPMENT_READINESS_ASSESSMENT.md J-S3): non-BU enforcement of the ' +
  'open/close RAB-period action is not clearly evidenced on PeriodeController (authorize ' +
  'is Superadmin-only, but no non-BU role guard/policy for status transitions is ' +
  'evidenced). Deferred per Phase 3 instruction; expected result "Ditolak (hanya ' +
  'BU/Superadmin teknis dengan kebijakan)" is unchanged.';

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

authTest.describe(`Haul Akbar & Periode - ${JOURNEY}`, () => {
  authTest(
    testTitle(meta('TC-REQ-022', 'Tambah Haul Akbar')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan sebagai entitas terpisah".
      await beginSession(loginPage, 'TC-REQ-022', 'Tambah Haul Akbar');

      const haul = new HaulAkbarPage(page);
      await haul.goto();
      const nama = uniqueHaulAkbarName();
      const singkatan = uniqueHaulAkbarSingkatan();

      try {
        await haul.addHaulAkbar(nama, singkatan);
        await haul.expectSuccess(MESSAGES.haulAkbarCreated);
        // Stored as its own entity: the new row (unique name + abbreviation).
        await haul.expectRow(nama);
        await expect(haul.rowByName(nama).first()).toContainText(singkatan);
      } finally {
        await bestEffort(async () => {
          await haul.goto();
          await haul.deleteByNameIfPresent(nama);
        });
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-023', 'Tambah Periode')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan, status Belum Dibuka".
      await beginSession(loginPage, 'TC-REQ-023', 'Tambah Periode');

      const periode = new PeriodePage(page);
      await periode.goto();
      const tahun = uniqueTahunMasehi();
      const hijriyah = uniqueTahunHijriyah();

      try {
        // Uses the pre-selected active Haul Akbar so the new Periode is listed.
        await periode.addPeriode({ tahunMasehi: tahun, tahunHijriyah: hijriyah });
        await periode.expectSuccess(MESSAGES.periodeCreated);
        await periode.expectRow(tahun);
        await periode.expectStatus(tahun, MESSAGES.statusBelumDibuka);
      } finally {
        await bestEffort(async () => {
          await periode.goto();
          await periode.deleteByTahunIfPresent(tahun);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-024', 'Tambah periode duplikat tahun Masehi di HAF yang sama')
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak".
      await beginSession(
        loginPage,
        'TC-REQ-024',
        'Tambah periode duplikat tahun Masehi di HAF yang sama'
      );

      const periode = new PeriodePage(page);
      await periode.goto();
      const tahun = uniqueTahunMasehi();

      try {
        // Seed one Periode, then submit the same tahun_masehi under the same HA.
        await periode.addPeriode({
          tahunMasehi: tahun,
          tahunHijriyah: uniqueTahunHijriyah(),
        });
        await periode.expectSuccess(MESSAGES.periodeCreated);

        await periode.addPeriode({
          tahunMasehi: tahun,
          tahunHijriyah: uniqueTahunHijriyah(),
        });
        await periode.expectValidationError(MESSAGES.periodeTahunDuplicate);
        // Rejected: exactly one row carries the year.
        expect(await periode.countRows(tahun)).toBe(1);
      } finally {
        await bestEffort(async () => {
          await periode.goto();
          await periode.deleteByTahunIfPresent(tahun);
        });
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-025', 'Cek edit/hapus Periode')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Berhasil; relasi transaksi dicek".
      await beginSession(loginPage, 'TC-REQ-025', 'Cek edit/hapus Periode');

      const periode = new PeriodePage(page);
      await periode.goto();
      const tahun = uniqueTahunMasehi();
      const hijriyahBaru = uniqueTahunHijriyah();

      try {
        await periode.addPeriode({
          tahunMasehi: tahun,
          tahunHijriyah: uniqueTahunHijriyah(),
        });
        await periode.expectSuccess(MESSAGES.periodeCreated);

        // Edit the Hijriyah label of the row (identity key = tahun_masehi).
        await periode.editPeriode(tahun, { tahunHijriyah: hijriyahBaru });
        await periode.expectSuccess(MESSAGES.periodeUpdated);
        await expect(periode.rowByTahun(tahun).first()).toContainText(hijriyahBaru);

        // Delete a Periode with no relations (unrelated to RAB/transaction).
        await periode.deleteByTahun(tahun);
        await periode.expectSuccess(MESSAGES.periodeDeleted);
        await periode.expectRowAbsent(tahun);
      } finally {
        await bestEffort(async () => {
          await periode.goto();
          await periode.deleteByTahunIfPresent(tahun);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-026',
        'Memastikan sistem menangani kondisi: Haul Akbar nama/singkatan kosong'
      )
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak".
      await beginSession(
        loginPage,
        'TC-REQ-026',
        'Memastikan sistem menangani kondisi: Haul Akbar nama/singkatan kosong'
      );

      const haul = new HaulAkbarPage(page);
      await haul.goto();

      // Empty nama + singkatan: native HTML5 `required` rejects the submit.
      await haul.openAddForm();
      await haul.addForm
        .getByRole('button', { name: 'Simpan', exact: true })
        .click();
      await expect(haul.addForm).toBeVisible();
      expect(await haul.isFieldInvalid(haul.addNamaInput)).toBe(true);
      expect(await haul.isFieldInvalid(haul.addSingkatanInput)).toBe(true);
      await expect(page.getByText(MESSAGES.haulAkbarCreated)).toHaveCount(0);
      await haul.closeAddForm();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-027',
        'Memastikan sistem menangani kondisi: Periode tahun kembar pada HA yang sama'
      )
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak".
      await beginSession(
        loginPage,
        'TC-REQ-027',
        'Memastikan sistem menangani kondisi: Periode tahun kembar pada HA yang sama'
      );

      const periode = new PeriodePage(page);
      await periode.goto();
      const tahun = uniqueTahunMasehi();

      try {
        await periode.addPeriode({
          tahunMasehi: tahun,
          tahunHijriyah: uniqueTahunHijriyah(),
        });
        await periode.expectSuccess(MESSAGES.periodeCreated);

        await periode.addPeriode({
          tahunMasehi: tahun,
          tahunHijriyah: uniqueTahunHijriyah(),
        });
        await periode.expectValidationError(MESSAGES.periodeTahunDuplicate);
        expect(await periode.countRows(tahun)).toBe(1);
      } finally {
        await bestEffort(async () => {
          await periode.goto();
          await periode.deleteByTahunIfPresent(tahun);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-028',
        'Memastikan sistem menangani kondisi: Hapus Periode yang sudah berisi transaksi/RAB',
        { deferred: DEFERRED_028 }
      )
    ),
    async ({ page, loginPage }) => {
      // Retained for future execution once the retention policy is evidenced.
      await beginSession(
        loginPage,
        'TC-REQ-028',
        'Memastikan sistem menangani kondisi: Hapus Periode yang sudah berisi transaksi/RAB',
        { deferred: DEFERRED_028 }
      );

      const periode = new PeriodePage(page);
      await periode.goto();
      const tahun = uniqueTahunMasehi();

      try {
        await periode.addPeriode({
          tahunMasehi: tahun,
          tahunHijriyah: uniqueTahunHijriyah(),
        });
        await periode.expectSuccess(MESSAGES.periodeCreated);

        // Precondition "contains transactions/RAB" cannot be provisioned safely
        // in this phase; the retention outcome must be observed.
        await periode.deleteByTahun(tahun);
        await periode.expectValidationError(MESSAGES.periodeDeleted);
        await periode.expectRow(tahun);
      } finally {
        await bestEffort(async () => {
          await periode.goto();
          await periode.deleteByTahunIfPresent(tahun);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-029',
        'Memastikan sistem menangani kondisi: Buka/tutup periode RAB oleh non-BU',
        { deferred: DEFERRED_029 }
      )
    ),
    async ({ page, loginPage }) => {
      // Retained for future execution once a non-BU identity + guard is available.
      await beginSession(
        loginPage,
        'TC-REQ-029',
        'Memastikan sistem menangani kondisi: Buka/tutup periode RAB oleh non-BU',
        { deferred: DEFERRED_029 }
      );

      const periode = new PeriodePage(page);
      await periode.goto();
      // The non-BU open/close attempt must be rejected; the guard is not
      // evidenced, and no non-BU identity is configured. Implementation retained.
      await expect(periode.heading).toBeVisible();
    }
  );
});
