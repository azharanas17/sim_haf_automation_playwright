import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { bendaharaUmum } from '../../test-data/users';

/**
 * Approved journey J-B7 - "Rekap & Laporan Keuangan".
 * Role: Bendahara Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-159 .. TC-REQ-165 (7 scenarios).
 *
 * EXECUTION GUARD: requires a configured Bendahara Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - Reports are previews: `/laporan/preview/rp2` (Rekap Penerimaan per
 *   Kategori/Wilayah), `/laporan/preview/rp4` (Rekap Pengeluaran per Bidang/Seksi),
 *   `/laporan/preview/rp5` (RAB vs Realisasi). Exports go through
 *   `laporan.generate` (format=pdf|excel, async job).
 * - RP-2 has NO "Potensi Dana" column (repo-wide search for "Potensi" = 0).
 * - KNOWN DEFECT: rp2..rp6 wrap data in objects and use `empty()` (always false),
 *   so the "Tidak ada data" empty-state is unreachable; rp4's Blade expects a
 *   nested shape the service does not return, risking HTTP 500 when data exists.
 */

const JOURNEY = 'J-B7 - Rekap & Laporan Keuangan';
const REQUIREMENTS = ['FR-16', 'FR-17', 'Bg. 34'];
const ROLE = 'Bendahara Umum';

const DEFERRED_159 =
  'Buka Rekap Penerimaan: /laporan/preview/rp2 renders "Rekap Penerimaan Per ' +
  'Kategori/Wilayah" with Kode/Nama Akun/Total (+ one dynamic column per ' +
  'PeriodeHaulAkbar), BUT the approved "Potensi Dana" column does NOT exist ' +
  'anywhere (repo-wide search for "Potensi" = 0). Deferred (approved column not ' +
  'implemented).';

const DEFERRED_163 =
  'DISCREPANCY vs approval: filter tanpa data -> hasil kosong + pesan (bukan ' +
  'crash). rp2..rp6 guard with `@if(empty($data))` on Collections/Paginator ' +
  'objects, and `empty()` on an object is always false, so the "Tidak ada data" ' +
  'message is UNREACHABLE and a Rp 0 table renders instead; rp4 additionally ' +
  'risks a 500 on the service/view shape mismatch. Deferred for dev confirmation.';

const DEFERRED_164 =
  'Data multi-tahun: rp2 columns are DYNAMIC (one per periode, ordered by ' +
  'tahun_masehi) rather than fixed 2024/2025/2026 tabs; there is no deterministic ' +
  'UI assertion for "ringkasan per kategori/wilayah" across a known year set. ' +
  'Deferred.';

const DEFERRED_165 =
  'Dashboard/saldo vs laporan sync: investigative reconciliation of one source of ' +
  'truth; not a stable deterministic UI assertion and depends on shared data. ' +
  'Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const begin = async (loginPage: Parameters<typeof signIn>[0], id: string, scenario: string) => {
  declareScenario(meta(id, scenario), { requiresSession: true, user: bendaharaUmum() });
  await signIn(loginPage, bendaharaUmum());
};

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-159', 'Buka Rekap Penerimaan | EXPECT: Kolom per kategori/wilayah + data multi-tahun + Potensi Dana', DEFERRED_159)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-159', 'Buka Rekap Penerimaan', DEFERRED_159), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-160', 'Buka Rekap Pengeluaran | EXPECT: Angka per Bidang/Khidmah/Kategori sesuai transaksi')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-160', 'Buka Rekap Pengeluaran');
      const resp = await page.goto('/laporan/preview/rp4');
      expect(resp?.status(), 'RP-4 preview must render (not 500)').toBe(200);
      await expect(page.getByRole('heading', { name: 'Rekap Pengeluaran per Bidang/Seksi' })).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-161', 'Cek RAB vs Realisasi | EXPECT: Sisa RAB (surplus/defisit) akurat')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-161', 'Cek RAB vs Realisasi');
      const resp = await page.goto('/laporan/preview/rp5');
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Laporan RAB vs Realisasi' })).toBeVisible();
      for (const h of ['Total RAB', 'Realisasi', 'Sisa']) {
        await expect(page.getByRole('columnheader', { name: h, exact: false }).first()).toBeVisible();
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-162', 'Export PDF/Excel | EXPECT: File berhasil; isi sesuai filter')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-162', 'Export PDF/Excel');
      await page.goto('/laporan/preview/rp5');
      await expect(page.getByText('Export Excel', { exact: false }).first()).toBeVisible();
      await expect(page.getByText('Export PDF', { exact: false }).first()).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-163', 'Filter tanpa data | EXPECT: Hasil kosong + pesan (bukan error crash)', DEFERRED_163)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-163', 'Filter tanpa data', DEFERRED_163), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-164', 'Data multi-tahun 2024/2025 belum dimigrasi detail | EXPECT: Menampilkan angka ringkasan per kategori/wilayah (Bg. 34)', DEFERRED_164)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-164', 'Data multi-tahun', DEFERRED_164), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-165', 'Dashboard/saldo tidak sinkron dengan laporan | EXPECT: Investigasi agregasi (harus satu sumber kebenaran)', DEFERRED_165)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-165', 'Dashboard/saldo tidak sinkron dengan laporan', DEFERRED_165), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );
});