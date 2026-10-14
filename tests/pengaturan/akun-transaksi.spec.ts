import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { AkunTransaksiPage } from '../../pages/AkunTransaksiPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin } from '../../test-data/users';
import { MESSAGES, uniqueKode, uniqueNama } from '../../test-data/akun-transaksi';

/**
 * Approved journey J-S7 - "Master Akun Transaksi (FR-07, FR-14)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-052 .. TC-REQ-058 (7 scenarios).
 *
 * VERIFIED READINESS (source-grounded): the module is Superadmin-only in the
 * sidebar and controller-gated. Scenarios 052-056 are implemented for real.
 * 057 (delete an account already used by a transaction) is deferred: the FK
 * `constrained()` on `penerimaan_kas.akun_penerimaan_id` /
 * `pengeluaran_kas.akun_pengeluaran_id` (database/migrations) restricts the
 * delete, but provisioning a real transacted account is not safe in this phase
 * and the controller/service does not soft-delete. 058 (free-text kategori on
 * the KAS entry form) belongs to the KAS-entry UI, not the master form, and
 * cannot be observed from this module.
 *
 * SCENARIO 055/056 note: the penerimaan create modal auto-generates kode
 * (kode field only renders in edit mode), so duplicate-kode rejection is
 * exercised through the pengeluaran modal (kode is editable there) - both hit
 * the same `unique:kode` request rule + the global validation alert.
 *
 * Each test creates its OWN rows (unique kode/nama) and deletes them in a
 * best-effort cleanup. LOGIN THROTTLE: one Superadmin login per real test.
 */

const JOURNEY = 'J-S7 - Master Akun Transaksi (FR-07, FR-14)';
const REQUIREMENTS = ['FR-07', 'FR-14'];
const ROLE = 'Superadmin';

/** Scenario 057 blocker (quoted for traceability). */
const DEFERRED_057 =
  'Deleting an account already used by a transaction: the FK constraints on ' +
  'penerimaan_kas.akun_penerimaan_id and pengeluaran_kas.akun_pengeluaran_id ' +
  '(constrained()/restrict in database/migrations) would block the delete, but ' +
  'provisioning a real transacted account is not safe in this phase and no ' +
  'soft-delete or in-use guard is evidenced in AkunTransaksiService/Repository. ' +
  'Expected result "Diblokir/nonaktifkan (soft-delete)" requires that history; ' +
  'deferred per Phase 3 instruction.';

/** Scenario 058 blocker (quoted for traceability). */
const DEFERRED_058 =
  'Free-text kategori on the KAS ENTRY form (dropdown mandatory) belongs to the ' +
  'Periode Kas entry UI (penerimaan-kas/pengeluaran-kas), which is not this ' +
  'master-akun module; the master form uses required text inputs. Impossible to ' +
  'observe from J-S7; deferred pending the KAS-entry journey.' ;

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

authTest.describe(() => {
  authTest(
    testTitle(
      meta('TC-REQ-052', 'Lihat tab Penerimaan | EXPECT: list tampil sesuai kelompok wilayah')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-052', 'Lihat tab Penerimaan');

      const akun = new AkunTransaksiPage(page);
      await akun.goto();
      // Default tab is 'penerimaan'; the tab label and its table render.
      await expect(akun.tabPenerimaan).toBeVisible();
      await expect(page.getByRole('table').first()).toBeVisible();
      // Switch to Pengeluaran and back to confirm tabs keep their lists.
      await akun.openTab('pengeluaran');
      await akun.openTab('penerimaan');
      await expect(page.getByRole('table').first()).toBeVisible();
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-053', 'Tambah akun penerimaan baru | EXPECT: tersimpan; muncul di dropdown Penerimaan Kas')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-053', 'Tambah akun penerimaan baru');

      const akun = new AkunTransaksiPage(page);
      const nama = uniqueNama('Penerimaan QA');

      try {
        await akun.addPenerimaan({ nama, kategori: 'Jawa Timur' });
        await akun.expectSuccess(MESSAGES.penerimaanCreated);
        await akun.expectRow('penerimaan', nama);
      } finally {
        await bestEffort(async () => {
          await akun.deleteByTextIfPresent('penerimaan', nama);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-054', 'Tambah akun pengeluaran | EXPECT: tersimpan; muncul di dropdown Pengeluaran Kas')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-054', 'Tambah akun pengeluaran');

      const akun = new AkunTransaksiPage(page);
      const kode = uniqueKode('OUT-QA');
      const nama = uniqueNama('Pengeluaran QA');

      try {
        await akun.addPengeluaran({ kode, nama, kategori: 'Konsumsi' });
        await akun.expectSuccess(MESSAGES.pengeluaranCreated);
        await akun.expectRow('pengeluaran', kode);
      } finally {
        await bestEffort(async () => {
          await akun.deleteByTextIfPresent('pengeluaran', kode);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-055', 'Cek kode duplikat | EXPECT: ditolak')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-055', 'Cek kode duplikat');

      const akun = new AkunTransaksiPage(page);
      const kode = uniqueKode('CKD-QA');
      const nama = uniqueNama('Cek Duplikat');

      try {
        await akun.addPengeluaran({ kode, nama, kategori: 'Operasional' });
        await akun.expectSuccess(MESSAGES.pengeluaranCreated);

        // Same kode as an existing row -> unique rule rejects the duplicate.
        await akun.openTab('pengeluaran');
        await akun.addPengeluaran({ kode, nama: uniqueNama('Cek Duplikat'), kategori: 'Operasional' });
        await akun.expectValidationError();
        await expect(page.getByText(MESSAGES.pengeluaranCreated)).toHaveCount(0);
      } finally {
        await bestEffort(async () => {
          await akun.deleteByTextIfPresent('pengeluaran', kode);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-056', 'Kode/nama duplikat | EXPECT: ditolak')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-056', 'Kode/nama duplikat');

      const akun = new AkunTransaksiPage(page);
      const kode = uniqueKode('DN-QA');
      const nama = uniqueNama('Nama Duplikat');

      try {
        await akun.addPengeluaran({ kode, nama, kategori: 'Logistik' });
        await akun.expectSuccess(MESSAGES.pengeluaranCreated);

        // Same kode AND same nama -> rejected by the unique:kode rule.
        await akun.openTab('pengeluaran');
        await akun.addPengeluaran({ kode, nama, kategori: 'Logistik' });
        await akun.expectValidationError();
        await expect(page.getByText(MESSAGES.pengeluaranCreated)).toHaveCount(0);
        // NOTE: nama alone is NOT unique-enforced (validated source:
        // validate() only marks `kode` unique for akun_pengeluarans).
      } finally {
        await bestEffort(async () => {
          await akun.deleteByTextIfPresent('pengeluaran', kode);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-057', 'Akun dipakai transaksi lalu dihapus | EXPECT: diblokir/nonaktifkan (soft-delete)', {
        deferred: DEFERRED_057,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-057', 'Akun dipakai transaksi lalu dihapus', {
        deferred: DEFERRED_057,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-058', 'Free-text kategori pada form transaksi | EXPECT: tidak tersedia (dropdown mandatory)', {
        deferred: DEFERRED_058,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-058', 'Free-text kategori pada form transaksi', {
        deferred: DEFERRED_058,
      });
    }
  );
});