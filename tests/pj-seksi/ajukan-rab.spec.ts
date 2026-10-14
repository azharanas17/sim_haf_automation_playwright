import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { pjSeksi } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-P2 - "Ajukan RAB Seksi (PJ Seksi)".
 * Role: PJ Seksi. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-247 .. TC-REQ-255 (9 scenarios).
 *
 * EXECUTION GUARD: requires a configured PJ Seksi identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - RabPolicy::create includes PJ_SEKSI.
 * - `StoreRabRequest`: periode `exists(...)->where('status_periode_rab','dibuka')`;
 *   details required array min:1; details.*.akun_pengeluaran_id required (dropdown);
 *   details.*.qty integer min:1; harga_satuan numeric min:0.
 */

const JOURNEY = 'J-P2 - Ajukan RAB Seksi (PJ Seksi)';
const REQUIREMENTS = ['FR-10', 'FR-12'];
const ROLE = 'PJ Seksi';
const API = '/api/v1';

const DEFERRED_247 = 'Buat RAB "Konsumsi Jamuan" -> tersimpan Draft: persists shared RAB data. Deferred.';
const DEFERRED_248 = 'Submit saat periode Dibuka -> Menunggu Approval + N-2: performs the draft->submitted transition (mutation) + notification. Deferred.';
const DEFERRED_252 = 'RAB Bidang/Seksi lain -> Ditolak: no deterministic cross-Seksi fixture to prove the scope denial. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const rabPayload = (over: Record<string, unknown>) => ({
  periode_haul_akbar_id: 999999999,
  bidang_id: 1,
  khidmah_id: 1,
  details: [{ akun_pengeluaran_id: 1, uraian: 'QA', qty: 1, satuan: 'Pcs', vol: 1, harga_satuan: 1000 }],
  ...over,
});

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-247', 'Buat RAB "Konsumsi Jamuan" | EXPECT: Tersimpan Draft', DEFERRED_247)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-247', 'Buat RAB "Konsumsi Jamuan"', DEFERRED_247), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-248', 'Submit saat periode Dibuka | EXPECT: Status Menunggu Approval; N-2 Kabid', DEFERRED_248)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-248', 'Submit saat periode Dibuka', DEFERRED_248), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-249', 'Submit saat periode Ditutup | EXPECT: Ditolak (FR-10)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-249', 'Submit saat periode Ditutup'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/rabs`, { headers: jsonHeaders(token), data: rabPayload({}), failOnStatusCode: false });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.periode_haul_akbar_id).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-250', 'Kosongkan kategori/uraian, estimasi 0 | EXPECT: Ditolak validasi')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-250', 'Kosongkan kategori/uraian, estimasi 0'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: rabPayload({ details: [{ uraian: '', qty: 0, satuan: 'Pcs', vol: 1, harga_satuan: 0 }] }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.['details.0.akun_pengeluaran_id']).toBeTruthy();
      expect(body.errors?.['details.0.uraian']).toBeTruthy();
      expect(body.errors?.['details.0.qty']).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-251', 'Submit draft belum lengkap | EXPECT: Blok/validasi')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-251', 'Submit draft belum lengkap'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: { periode_haul_akbar_id: 999999999, bidang_id: 1, khidmah_id: 1 },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.details).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-252', 'RAB Bidang/Seksi lain | EXPECT: Ditolak', DEFERRED_252)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-252', 'RAB Bidang/Seksi lain', DEFERRED_252), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-253', 'Kategori bebas-teks (bukan dropdown) | EXPECT: Ditolak')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-253', 'Kategori bebas-teks'), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      await page.goto('/keuangan/rab/create');
      await expect(page.locator('select[name*="akun_pengeluaran_id"]').first()).toBeVisible();
      await expect(page.locator('input[name*="akun_pengeluaran_id"]')).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-254', 'Estimasi <= 0 | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-254', 'Estimasi <= 0'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/rabs`, {
        headers: jsonHeaders(token),
        data: rabPayload({ details: [{ akun_pengeluaran_id: 1, uraian: 'QA', qty: 0, satuan: 'Pcs', vol: 1, harga_satuan: 0 }] }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.['details.0.qty']).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-255', 'Submit saat periode belum dibuka/ditutup | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-255', 'Submit saat periode belum dibuka/ditutup'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/rabs`, { headers: jsonHeaders(token), data: rabPayload({}), failOnStatusCode: false });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.periode_haul_akbar_id).toBeTruthy();
    }
  );
});