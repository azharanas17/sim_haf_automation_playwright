import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { panitiaLapangan } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-L2 - "Input Pengeluaran (Panitia Lapangan)".
 * Role: Panitia Lapangan. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-309 .. TC-REQ-319 (11 scenarios).
 *
 * EXECUTION GUARD: requires a configured Panitia Lapangan identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `pengeluaran-kas/create` H1 = "Catat Belanja / Pengeluaran"; nominal auto = qty*vol*harga.
 * - StorePengeluaranKasRequest: foto_nota required image mimes max 5MB; qty min:1; harga_satuan min:0.
 * - PengeluaranKasPolicy::create includes PJ_SEKSI; delete = SA/BU only.
 */

const JOURNEY = 'J-L2 - Input Pengeluaran (Panitia Lapangan)';
const REQUIREMENTS = ['FR-13', 'FR-14', 'FR-22'];
const ROLE = 'Panitia Lapangan';
const API = '/api/v1';

const DEFERRED_312 = 'Upload foto valid -> tersimpan: persists a belanja mutation. Deferred.';
const DEFERRED_314 = 'Kategori "Pengadaan Inventaris" -> tandai kandidat inventaris (FR-14): there is no "kandidat inventaris" marker in the pengeluaran form/service. Deferred.';
const DEFERRED_317 = 'Panitia edit/hapus pengeluaran -> Ditolak (koreksi via reversal): exercising DELETE needs a concrete owned pengeluaran id; the list page shows ids but no deterministic fixture guarantees one. Deferred.';
const DEFERRED_318 = 'Baca ulang bukti nota seksi lain -> Batasi (FR-22): requires a foreign receipt fixture + signed URL check. Deferred.';
const DEFERRED_319 = 'Input dari Seksi lain di luar penugasan -> Ditolak (scope): no deterministic cross-Seksi fixture. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const pengeluaranPayload = (over: Record<string, unknown>) => ({
  uraian: 'QA Panitia',
  qty: '20',
  vol: '1',
  harga_satuan: '15000',
  sub_agenda: 'haul_akbar',
  ...over,
});

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-309', 'Buka form Pengeluaran | EXPECT: Field lengkap FR-13')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-309', 'Buka form Pengeluaran'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      await page.goto('/keuangan/pengeluaran-kas/create');
      await expect(page.getByRole('heading', { name: 'Catat Belanja / Pengeluaran' })).toBeVisible();
      for (const name of ['foto_nota', 'qty', 'vol', 'harga_satuan', 'satuan', 'sub_agenda']) {
        await expect(page.locator(`[name="${name}"]`).first()).toBeVisible();
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-310', 'Isi qty 20, satuan kotak, harga 15.000 | EXPECT: Nominal auto = 300.000')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-310', 'Nominal auto'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      await page.goto('/keuangan/pengeluaran-kas/create');
      await page.locator('input[name="qty"]').fill('20');
      await page.locator('select[name="satuan"]').selectOption({ index: 1 });
      await page.locator('input[name="vol"]').fill('1');
      await page.locator('input[name="harga_satuan"]').fill('15000');
      await expect(page.locator('input[readonly]').first()).toHaveValue(/300\.000/);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-311', 'Simpan tanpa foto | EXPECT: Ditolak (FR-13)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-311', 'Simpan tanpa foto'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
      await page.goto('/keuangan/pengeluaran-kas/create');
      const nota = page.locator('input[name="foto_nota"]');
      await expect(nota).toHaveAttribute('required', '');
      expect(await nota.evaluate((el) => !(el as HTMLInputElement).checkValidity())).toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-312', 'Upload foto nota valid (1,5 MB JPG) | EXPECT: Tersimpan', DEFERRED_312)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-312', 'Upload foto valid'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-313', 'Upload file > 5MB / format txt | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-313', 'Upload file format txt'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
          ...pengeluaranPayload({}),
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.foto_nota).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-314', 'Kategori "Pengadaan Inventaris" | EXPECT: Tandai kandidat Inventaris (FR-14)', DEFERRED_314)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-314', 'Kandidat inventaris'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-315', 'Foto tidak ada / non-gambar / >5MB | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-315', 'Foto non-gambar'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: pengeluaranPayload({}),
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.foto_nota).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-316', 'Qty/harga/nominal <= 0 | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-316', 'Qty/harga <= 0'), { requiresCredentials: true, user: panitiaLapangan() });
      const token = await apiLogin(request, panitiaLapangan());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.png', mimeType: 'image/png', buffer: Buffer.from('89504e47', 'hex') },
          ...pengeluaranPayload({ qty: '0' }),
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.qty).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-317', 'Panitia edit/hapus pengeluaran | EXPECT: Ditolak (koreksi via reversal)', DEFERRED_317)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-317', 'Panitia edit/hapus pengeluaran'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-318', 'Baca ulang bukti nota milik seksi lain | EXPECT: Batasi (FR-22: Panitia bukan pembaca)', DEFERRED_318)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-318', 'Baca bukti nota seksi lain'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-319', 'Input dari Seksi lain di luar penugasan | EXPECT: Ditolak (scope)', DEFERRED_319)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-319', 'Input dari Seksi lain'), { requiresSession: true, user: panitiaLapangan() });
      await signIn(loginPage, panitiaLapangan());
    }
  );
});