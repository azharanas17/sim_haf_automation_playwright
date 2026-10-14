import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../pages/DashboardPage';
import { LaporanPage } from '../../pages/LaporanPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { ketuaUmum } from '../../test-data/users';

/**
 * Approved journey J-K1 - "Lihat Dashboard & Laporan (UC-19, FR-21)".
 *
 * Role: Ketua Umum. Approved source:
 * SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-066 .. TC-REQ-073 (8 scenarios).
 *
 * EXECUTION GUARD: requires a configured Ketua Umum identity (env
 * UAT_EMAIL_KETUA_UMUM / UAT_PASSWORD_KETUA_UMUM); the seeder defines
 * `uat.ketua@simhaf.id`. Until credentials are configured every scenario skips
 * (see declareScenario). No credentials are hardcoded.
 *
 * VERIFIED READINESS (source-grounded):
 * - The dashboard (`resources/views/dashboard/index.blade.php`) renders the 5
 *   financial cards (Pemasukan, Pengeluaran, Saldo Kas, Total RAB, LPJ Pending)
 *   AND an "Akses Cepat" panel with create links (Tambah Penerimaan,
 *   Tambah Pengeluaran, Ajukan RAB, Tambah Kegiatan) for ALL roles - there is no
 *   role gate on that panel. TC-REQ-073 expects a READ-ONLY dashboard with no
 *   add/edit action buttons; the current UI contradicts that. Recorded as a
 *   discrepancy and deferred for product/dev confirmation (see DEFERRED_073).
 * - LaporanPolicy::viewAny = true for every authenticated user; generate for
 *   rp2/rp3 (Rekap Penerimaan / Detail Transaksi) requires canViewAllData,
 *   which Ketua Umum satisfies.
 */

const JOURNEY = 'J-K1 - Lihat Dashboard & Laporan (UC-19, FR-21)';
const REQUIREMENTS = ['UC-19', 'FR-21'];
const ROLE = 'Ketua Umum';

const DEFERRED_067 =
  'Bandingkan angka Saldo (perhitungan otomatis): the dashboard shows an ' +
  'aggregated Saldo Kas value but the UI exposes no independent source of truth ' +
  '(no transaction ledger total on the same screen) to compare against, and no ' +
  'seeded fixture amounts are guaranteed. A deterministic reconciliation test ' +
  'needs known fixture data; deferred per Phase 3 instruction.';

const DEFERRED_071 =
  'Saldo/agregat tidak sesuai transaksi (real-time): this is a NEGATIVE ' +
  'investigative case with no UI trigger - it asserts the app should be ' +
  'real-time/not stale. Without controlled transaction injection + refresh ' +
  'orchestration it cannot be produced deterministically; deferred.';

const DEFERRED_072 =
  'Export gagal / format salah (pesan error ramah): `LaporanController::generate` ' +
  'validates `format` with in:pdf,excel and `jenis_laporan` via Rule::enum, but ' +
  'there is no UI path that forces an export/generation failure, and the ' +
  'controller has no friendly failure message for generation errors (it logs ' +
  'server-side). Cannot be triggered through the UI; deferred pending a way to ' +
  'force a worker/generation failure.';

const DEFERRED_073 =
  'DISCREPANCY vs approval: the dashboard is expected to be READ-ONLY (no ' +
  'tambah/edit/action buttons), but `resources/views/dashboard/index.blade.php` ' +
  'renders an "Akses Cepat" panel with create links (Tambah Penerimaan, Tambah ' +
  'Pengeluaran, Ajukan RAB, Tambah Kegiatan) unconditionally for every role. The ' +
  'observed UI does not meet the scenario expectation; deferred for product/dev ' +
  'confirmation (implementation vs requirement).';

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

/** Declare the scenario (session-guarded) and sign in as Ketua Umum. */
const beginSession = async (
  loginPage: Parameters<typeof signIn>[0],
  id: string,
  scenario: string,
  extra: Partial<ScenarioMeta> = {}
): Promise<void> => {
  declareScenario(meta(id, scenario, extra), {
    requiresSession: true,
    user: ketuaUmum(),
  });
  await signIn(loginPage, ketuaUmum());
};

authTest.describe(() => {
  authTest(
    testTitle(
      meta('TC-REQ-066', 'Login & buka Dashboard | EXPECT: 5 card inti tampil dengan angka konsisten')
    ),
    async ({ page, loginPage, dashboardPage }) => {
      await beginSession(loginPage, 'TC-REQ-066', 'Login & buka Dashboard');

      await dashboardPage.expectDisplayed();
      await expect(dashboardPage.welcomeHeading.first()).toBeVisible();
      for (const label of [
        'Pemasukan',
        'Pengeluaran',
        'Saldo Kas',
        'Total RAB',
        'LPJ Pending',
      ]) {
        await expect(dashboardPage.card(label).first()).toBeVisible();
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-067', 'Bandingkan angka Saldo | EXPECT: sesuai (perhitungan otomatis)', {
        deferred: DEFERRED_067,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-067', 'Bandingkan angka Saldo', {
        deferred: DEFERRED_067,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-068', 'Klik menu laporan (Rekap, Detail Transaksi) | EXPECT: data lengkap seluruh Bidang/Seksi')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-068', 'Klik menu laporan');

      const laporan = new LaporanPage(page);
      await laporan.goto();
      // Rekap Penerimaan (rp2) + Detail Transaksi (rp3) must be selectable.
      await expect(
        laporan.jenisSelect.locator('option[value="rp2"]')
      ).toHaveCount(1);
      await expect(
        laporan.jenisSelect.locator('option[value="rp3"]')
      ).toHaveCount(1);
      // Default scope is unrestricted across Bidang/Seksi ("— Semua Bidang —").
      await expect(
        laporan.bidangSelect.locator('option[value=""]')
      ).toContainText(/Semua Bidang/i);
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-069', 'Export laporan | EXPECT: file ter-export')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-069', 'Export laporan');

      const laporan = new LaporanPage(page);
      await laporan.goto();
      // Generate Detail Transaksi (rp3) as Excel; on success the export record
      // appears in "Riwayat Export Saya" with a working Unduh link.
      await laporan.generate({ jenis: 'rp3', format: 'excel' });
      await laporan.expectSuccess('Laporan berhasil diproses dan siap diunduh.');
      await expect(laporan.historyHeading.first()).toBeVisible();
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-070', 'Buka laporan/transaksi lintas Bidang & Seksi | EXPECT: data terlihat penuh tanpa pembatasan')
    ),
    async ({ page, loginPage }) => {
      await beginSession(
        loginPage,
        'TC-REQ-070',
        'Buka laporan/transaksi lintas Bidang & Seksi'
      );

      const laporan = new LaporanPage(page);
      await laporan.goto();
      // Ketua Umum sees the "Semua Bidang" (unrestricted) option; rp2/rp3 are
      // authorized for canViewAllData. Generation then succeeds across scopes.
      await laporan.generate({ jenis: 'rp2', format: 'pdf' });
      await laporan.expectSuccess('Laporan berhasil diproses dan siap diunduh.');
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-071', 'Data saldo/agregat tidak sesuai transaksi | EXPECT: investigasi; seharusnya real-time (tanpa rekap manual)', {
        deferred: DEFERRED_071,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-071', 'Data saldo/agregat tidak sesuai transaksi', {
        deferred: DEFERRED_071,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-072', 'Export gagal / format salah | EXPECT: file tidak ter-generate; pesan error ramah', {
        deferred: DEFERRED_072,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-072', 'Export gagal / format salah', {
        deferred: DEFERRED_072,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-073', 'Dashboard menampilkan tombol tambah/edit/aksi | EXPECT: tidak boleh — Dashboard read-only', {
        deferred: DEFERRED_073,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-073', 'Dashboard menampilkan tombol tambah/edit/aksi', {
        deferred: DEFERRED_073,
      });
    }
  );
});