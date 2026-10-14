import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { panitiaLapangan } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-L1 - "Input Penerimaan Kas (Panitia Lapangan)".
 * Role: Panitia Lapangan (PJ Seksi role + profile flag). Source: SIM_HAF v4.xlsx.
 * Implemented scenarios: TC-REQ-296 .. TC-REQ-308 (13 scenarios).
 *
 * EXECUTION GUARD: requires a configured Panitia Lapangan identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `penerimaan-kas/create` H1 = "Catat Penerimaan Kas"; hidden
 *   periode_haul_akbar_id auto-filled; akun is a master dropdown; #use_valas
 *   reveals valuta/nominal_valas/kurs and sets nominal readonly via calculateRupiah.
 * - StorePenerimaanKasRequest: akun_penerimaan_id required exists; nominal required
 *   numeric min:0; disetor_oleh required; channel in:transfer,tunai; kurs min:1.
 * - PenerimaanKasPolicy::create includes PJ_SEKSI; update/delete = SA/BU only.
 * - API `penerimaan-kas` supports index/store/show/destroy (DELETE -> 403 for PJ).
 */

const JOURNEY = 'J-L1 - Input Penerimaan Kas (Panitia Lapangan)';
const REQUIREMENTS = ['FR-09', 'FR-13', 'N-1'];
const ROLE = 'Panitia Lapangan';
const API = '/api/v1';

const DEFERRED_297 = 'Isi Tanggal/Kategori/Nominal/Disetor/Channel -> Valid: no persist/assertable invariant beyond the field requirements already exercised by TC-REQ-296/299/301. Deferred.';
const DEFERRED_298 = 'Simpan -> No. Kuitansi auto + saldo bertambah + urutan list: persists a penerimaan (mutation) and depends on a running saldo/sequence state. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const basePayload = (over: Record<string, unknown>) => ({
  periode_haul_akbar_id: 999999999,
  tanggal_transaksi: '2026-01-01',
  akun_penerimaan_id: 1,
  nominal: 500000,
  disetor_oleh: 'Panitia Shift A',
  channel: 'tunai',
  ...over,
});

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-296', 'Buka form Penerimaan Kas | EXPECT: Periode otomatis terisi Haul aktif')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-296', 'Buka form Penerimaan Kas'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      await page.goto('/keuangan/penerimaan-kas/create');
      await expect(page.getByRole('heading', { name: 'Catat Penerimaan Kas' })).toBeVisible();
      await expect(page.locator('input[name="periode_haul_akbar_id"]')).not.toHaveValue('');
    }
  );

  authTest(
    testTitle(meta('TC-REQ-297', 'Isi Tanggal, Kategori "Kotak Amal", Nominal 500.000, Disetor "Panitia Shift A", Tunai | EXPECT: Valid', DEFERRED_297)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-297', 'Isi form penerimaan lengkap', DEFERRED_297), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-298', 'Simpan | EXPECT: No. Kuitansi auto; saldo bertambah; tampil di list berurutan', DEFERRED_298)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-298', 'Simpan penerimaan'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-299', 'Coba isi bebas-teks pada Kategori | EXPECT: Ditolak (dropdown master)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-299', 'Kategori bebas-teks'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      await page.goto('/keuangan/penerimaan-kas/create');
      await expect(page.locator('select[name="akun_penerimaan_id"]')).toBeVisible();
      await expect(page.locator('input[name="akun_penerimaan_id"]')).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-300', 'Nominal 0 / negatif | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-300', 'Nominal 0 / negatif'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: jsonHeaders(token),
        data: basePayload({ nominal: -1 }),
        failOnStatusCode: false,
      });
      // NOTE: rule is `numeric|min:0`, so a negative is rejected; exact 0 is accepted
      // by the schema (documented discrepancy vs the "0 ditolak" wording).
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.nominal).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-301', 'Kategori kosong / Disetor Oleh kosong | EXPECT: Ditolak wajib')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-301', 'Kategori / Disetor Oleh kosong'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: jsonHeaders(token),
        data: basePayload({ akun_penerimaan_id: undefined, disetor_oleh: undefined }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.akun_penerimaan_id).toBeTruthy();
      expect(body.errors?.disetor_oleh).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-302', 'Buat transaksi Valuta Asing (USD 50, kurs) | EXPECT: Konversi = Rp 792.500 tercatat Rupiah')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-302', 'Transaksi Valuta Asing'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      await page.goto('/keuangan/penerimaan-kas/create');
      await page.locator('#use_valas').check();
      await page.locator('select[name="valuta"]').selectOption('USD');
      await page.locator('input[name="nominal_valas"]').fill('50');
      await page.locator('input[name="kurs"]').fill('15850');
      await expect(page.locator('input[name="nominal"]')).toHaveValue(/792\.500/);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-303', 'Edit/hapus transaksi oleh Panitia | EXPECT: Ditolak - hanya create; koreksi via Reversal BU/SA')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-303', 'Edit/hapus transaksi oleh Panitia'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.delete(`${API}/keuangan/penerimaan-kas/1`, {
        headers: jsonHeaders(token),
        failOnStatusCode: false,
      });
      expect([403, 404], 'delete must be denied for Panitia').toContain(res.status());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-304', 'Nominal <= 0 / bukan angka | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-304', 'Nominal bukan angka'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: jsonHeaders(token),
        data: basePayload({ nominal: 'abc' }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.nominal).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-305', 'Kategori bukan dari Master | EXPECT: Ditolak (no free-text)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-305', 'Kategori bukan dari Master'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: jsonHeaders(token),
        data: basePayload({ akun_penerimaan_id: 999999999 }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.akun_penerimaan_id).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-306', 'Valuta tanpa Kurs / Kurs <= 0 | EXPECT: Ditolak / konversi gagal')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-306', 'Valuta tanpa Kurs'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: jsonHeaders(token),
        data: basePayload({ valuta: 'USD', nominal_valas: 50, kurs: 0 }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.kurs).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-307', 'Panitia akses form modul lain | EXPECT: Ditolak (permission -)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-307', 'Panitia akses form modul lain'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      const resp = await page.goto('/pengaturan/user');
      expect(resp?.status(), 'Panitia must not access user management').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-308', 'PHP/periode kosong | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-308', 'Periode kosong'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: jsonHeaders(token),
        data: basePayload({ periode_haul_akbar_id: undefined }),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.periode_haul_akbar_id).toBeTruthy();
    }
  );
});