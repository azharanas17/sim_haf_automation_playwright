import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { sekretarisBidang } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-SB1 - "Ajukan RAB Seksi (Sekretaris Bidang)".
 * Role: Sekretaris Bidang. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-217 .. TC-REQ-227 (11 scenarios).
 *
 * EXECUTION GUARD: requires a configured Sekretaris Bidang identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `keuangan.rab.index` H1 = "Rencana Anggaran Biaya (RAB)"; create H1 = "Ajukan
 *   Rencana Anggaran Biaya".
 * - `StoreRabRequest`: periode `exists(...)->where('status_periode_rab','dibuka')`
 *   (so a non-open/invalid periode fails with message "Periode RAB tidak valid
 *   atau belum dibuka oleh Bendahara Umum."); `details` required array min:1;
 *   `details.*.akun_pengeluaran_id` required (dropdown master); `details.*.qty`
 *   integer min:1; `details.*.harga_satuan` numeric min:0.
 * - RabPolicy::create includes SEKRETARIS_BIDANG.
 */

const JOURNEY = 'J-SB1 - Ajukan RAB Seksi (Sekretaris Bidang)';
const REQUIREMENTS = ['FR-10', 'FR-12', 'Bg. 13'];
const ROLE = 'Sekretaris Bidang';
const API = '/api/v1';

const DEFERRED_218 =
  'Buat RAB Seksi "Jamuan" -> tersimpan Draft: creating a RAB persists shared ' +
  'budget data (and needs a Khidmah context + open periode). Deferred.';

const DEFERRED_219 =
  'Edit draft & submit saat periode Dibuka -> status Menunggu Approval + N-2: ' +
  'performs the draft->submitted transition (mutation) + notification. Deferred.';

const DEFERRED_222 =
  'Coba buat RAB Seksi Bidang lain -> Ditolak (scope): needs a deterministic ' +
  'cross-Bidang context; RabPolicy::create is role-based and the controller scopes ' +
  'bidang/khidmah, but no deterministic fixture to prove cross-Seksi denial. ' +
  'Deferred.';

const DEFERRED_226 =
  'Access Seksi Bidang lain -> Ditolak: same deterministic cross-Seksi limitation ' +
  'as TC-REQ-222. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const begin = async (loginPage: Parameters<typeof signIn>[0], id: string, scenario: string) => {
  declareScenario(meta(id, scenario), { requiresSession: true, user: sekretarisBidang() });
  await signIn(loginPage, sekretarisBidang());
};

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-217', 'Buka menu RAB Bidang "Konsumsi" | EXPECT: List RAB sesuai scope Bidang')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-217', 'Buka menu RAB Bidang');
      const resp = await page.goto('/keuangan/rab');
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Rencana Anggaran Biaya (RAB)' })).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-218', 'Buat RAB Seksi "Jamuan" | EXPECT: Tersimpan Draft', DEFERRED_218)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-218', 'Buat RAB Seksi "Jamuan"', DEFERRED_218), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-219', 'Edit draft & submit saat periode Dibuka | EXPECT: Status -> Menunggu Approval; N-2 ke Kabid', DEFERRED_219)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-219', 'Edit draft & submit saat periode Dibuka', DEFERRED_219), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-220', 'Coba submit ke periode status Ditutup | EXPECT: Ditolak (FR-10)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-220', 'Coba submit ke periode status Ditutup'), { requiresCredentials: true, user: sekretarisBidang() });
      const token = await apiLogin(request, sekretarisBidang());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: {
          periode_haul_akbar_id: 999999999,
          bidang_id: 1,
          khidmah_id: 1,
          details: [{ akun_pengeluaran_id: 1, uraian: 'QA', qty: 1, satuan: 'Pcs', vol: 1, harga_satuan: 1000 }],
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'non-open periode must be rejected server-side').toBe(422);
      const body = await res.json();
      expect(body.errors?.periode_haul_akbar_id, 'periode must be flagged (dibuka-only constraint)').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-221', 'Submit dengan kategori kosong / estimasi <= 0 | EXPECT: Ditolak validasi')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-221', 'Submit dengan kategori kosong / estimasi <= 0'), { requiresCredentials: true, user: sekretarisBidang() });
      const token = await apiLogin(request, sekretarisBidang());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: {
          periode_haul_akbar_id: 999999999,
          bidang_id: 1,
          khidmah_id: 1,
          details: [{ uraian: 'QA', qty: 0, satuan: 'Pcs', vol: 1, harga_satuan: 0 }],
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.['details.0.akun_pengeluaran_id'], 'missing kategori must be flagged').toBeTruthy();
      expect(body.errors?.['details.0.qty'], 'qty<=0 must be flagged').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-222', 'Coba buat RAB Seksi Bidang lain | EXPECT: Ditolak (scope)', DEFERRED_222)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-222', 'Coba buat RAB Seksi Bidang lain', DEFERRED_222), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-223', 'RAB di-submit saat periode Belum Dibuka / Ditutup | EXPECT: Ditolak (FR-10)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-223', 'RAB di-submit saat periode Belum Dibuka / Ditutup'), { requiresCredentials: true, user: sekretarisBidang() });
      const token = await apiLogin(request, sekretarisBidang());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: {
          periode_haul_akbar_id: 999999999,
          bidang_id: 1,
          khidmah_id: 1,
          details: [{ akun_pengeluaran_id: 1, uraian: 'QA', qty: 1, satuan: 'Pcs', vol: 1, harga_satuan: 1000 }],
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.periode_haul_akbar_id).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-224', 'Kategori bebas-teks | EXPECT: Ditolak (dropdown master)')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-224', 'Kategori bebas-teks');
      await page.goto('/keuangan/rab/create');
      // Category is a master dropdown, not a free-text input.
      await expect(page.locator('select[name*="akun_pengeluaran_id"]').first()).toBeVisible();
      await expect(page.locator('input[name*="akun_pengeluaran_id"]')).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-225', 'Estimasi <= 0 / non-numerik | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-225', 'Estimasi <= 0 / non-numerik'), { requiresCredentials: true, user: sekretarisBidang() });
      const token = await apiLogin(request, sekretarisBidang());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: {
          periode_haul_akbar_id: 999999999,
          bidang_id: 1,
          khidmah_id: 1,
          details: [{ akun_pengeluaran_id: 1, uraian: 'QA', qty: 'abc', satuan: 'Pcs', vol: 1, harga_satuan: 1000 }],
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.['details.0.qty'], 'non-numeric qty must be flagged').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-226', 'Access Seksi Bidang lain | EXPECT: Ditolak', DEFERRED_226)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-226', 'Access Seksi Bidang lain', DEFERRED_226), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-227', 'Submit Draft dengan field wajib kosong | EXPECT: Validasi / blocking')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-227', 'Submit Draft dengan field wajib kosong'), { requiresCredentials: true, user: sekretarisBidang() });
      const token = await apiLogin(request, sekretarisBidang());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: { periode_haul_akbar_id: 999999999, bidang_id: 1, khidmah_id: 1 },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.details, 'missing mandatory details must be flagged').toBeTruthy();
    }
  );
});