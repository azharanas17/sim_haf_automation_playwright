import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { bendaharaUmum, pjSeksi } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-B6 - "Koreksi / Reversal Transaksi".
 * Role: Bendahara Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-150 .. TC-REQ-158 (9 scenarios).
 *
 * EXECUTION GUARD: requires a configured Bendahara Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - Routes: `keuangan.koreksi.{index,create,store,lookup}` only (no show/update/
 *   destroy). API: `koreksi-transaksi` only(index,store).
 * - `StoreKoreksiTransaksiRequest`: alasan_koreksi [required,min:5]; jenis_koreksi
 *   `in:ubah_kategori,reversal_penuh,ubah_nominal`.
 * - `KoreksiTransaksiPolicy` = Superadmin || Bendahara Umum (PJ/Sekretaris -> 403).
 * - Reversal sets `is_reversed = true` in-place; snapshots are append-only in
 *   `koreksi_transaksis` (no delete route/method anywhere).
 */

const JOURNEY = 'J-B6 - Koreksi / Reversal Transaksi';
const REQUIREMENTS = ['FR-19', 'Bg. 20'];
const ROLE = 'Bendahara Umum';
const API = '/api/v1';

const DEFERRED_151 =
  'Ubah Kategori -> kategori berubah; histori snapshot tersimpan: requires a ' +
  'resolved target transaction id and a persisted koreksi (mutation of shared ' +
  'financial data). Deferred.';

const DEFERRED_152 =
  'Reversal penuh penerimaan -> Transaksi terkoreksi (efek saldo dibatalkan): ' +
  'requires a real penerimaan id and persists `is_reversed = true` (mutation). ' +
  'Deferred.';

const DEFERRED_155 =
  'DISCREPANCY vs approval: TC-REQ-155 expects reversal/koreksi that would drive ' +
  'saldo negative to be rejected/warned. KoreksiTransaksiService has NO ' +
  'saldo-negative guard (grep of app/ finds no such check); reversal simply sets ' +
  'is_reversed = true. Deferred for dev confirmation.';

const DEFERRED_158 =
  'Transaksi final/dicairkan di-reversal: the service performs no state check, so ' +
  'it is allowed with an audit entry (matches the policy note). Executing it ' +
  'requires a finalized/disbursed target id and is a shared-data mutation; the ' +
  'allowed behavior is documented but not asserted live. Deferred.';

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
    testTitle(meta('TC-REQ-150', 'Buka form Koreksi | EXPECT: Pilih tipe koreksi')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-150', 'Buka form Koreksi');
      await page.goto('/keuangan/koreksi/create');
      await expect(page.locator('input[name="type"]').first()).toBeVisible();
      await expect(page.locator('input[name="type"]')).toHaveCount(2);
      await expect(page.locator('input[name="search"]')).toHaveAttribute('required', '');
    }
  );

  authTest(
    testTitle(meta('TC-REQ-151', 'Ubah Kategori | EXPECT: Kategori berubah; histori snapshot tersimpan', DEFERRED_151)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-151', 'Ubah Kategori', DEFERRED_151), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-152', 'Reversal penuh penerimaan | EXPECT: Transaksi terkoreksi (efek saldo dibatalkan)', DEFERRED_152)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-152', 'Reversal penuh penerimaan', DEFERRED_152), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-153', 'Cek audit trail koreksi | EXPECT: Siapa, kapan, sebelum/sesudah, alasan - tidak dapat dihapus')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-153', 'Cek audit trail koreksi');
      await page.goto('/keuangan/koreksi');
      await expect(page.getByRole('heading', { name: 'Koreksi / Reversal Transaksi' })).toBeVisible();
      await expect(page.getByText('Ajukan Koreksi Baru')).toBeVisible();
      // Append-only: no delete affordance for koreksi history.
      await expect(
        page.locator('a[href*="koreksi"][href*="delete"], a[href*="koreksi"][href*="destroy"]')
      ).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-154', 'Alasan kosong | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-154', 'Alasan kosong'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.post(`${API}/keuangan/koreksi-transaksi`, {
        headers: jsonHeaders(token),
        data: {
          transactionable_id: 1,
          transactionable_type: 'penerimaan',
          jenis_koreksi: 'reversal_penuh',
          alasan_koreksi: '',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'empty alasan must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.alasan_koreksi, 'validation must flag alasan_koreksi').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-155', 'Reversal / koreksi -> saldo negatif | EXPECT: Tolak / peringatan (integritas saldo)', DEFERRED_155)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-155', 'Reversal / koreksi -> saldo negatif', DEFERRED_155), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-156', 'PJ/Sekretaris (tanpa hak) coba koreksi | EXPECT: Ditolak (hanya BU/Superadmin)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-156', 'PJ/Sekretaris (tanpa hak) coba koreksi'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/koreksi-transaksi`, {
        headers: jsonHeaders(token),
        data: {
          transactionable_id: 1,
          transactionable_type: 'penerimaan',
          jenis_koreksi: 'reversal_penuh',
          alasan_koreksi: 'QA denial attempt',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'PJ koreksi must be forbidden').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-157', 'Menghapus riwayat koreksi | EXPECT: Tidak ada menu hapus (append-only)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-157', 'Menghapus riwayat koreksi'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.delete(`${API}/keuangan/koreksi-transaksi/1`, {
        headers: jsonHeaders(token),
        failOnStatusCode: false,
      });
      expect([404, 405], 'koreksi history must have no delete route').toContain(res.status());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-158', 'Transaksi final/dicairkan di-reversal | EXPECT: Diperbolehkan dengan audit trail (kebijakan) - dokumentasikan', DEFERRED_158)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-158', 'Transaksi final/dicairkan di-reversal', DEFERRED_158), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );
});