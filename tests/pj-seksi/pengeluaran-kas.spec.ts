import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { pjSeksi } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-P4 - "Input Pengeluaran Seksi (PJ Seksi)".
 * Role: PJ Seksi. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-262 .. TC-REQ-273 (12 scenarios).
 *
 * EXECUTION GUARD: requires a configured PJ Seksi identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `pengeluaran-kas/create` H1 = "Catat Belanja / Pengeluaran"; fields qty, satuan,
 *   vol, harga_satuan, foto_nota, sub_agenda; Alpine nominal = qty*vol*harga_satuan.
 * - StorePengeluaranKasRequest: foto_nota required file image mimes:jpeg,png,jpg
 *   max:5120; qty integer min:1; harga_satuan numeric min:0;
 *   akun_pengeluaran_id exists. PengeluaranKasPolicy::create includes PJ_SEKSI.
 */

const JOURNEY = 'J-P4 - Input Pengeluaran Seksi (PJ Seksi)';
const REQUIREMENTS = ['FR-13', 'FR-15.3.4'];
const ROLE = 'PJ Seksi';
const API = '/api/v1';

const DEFERRED_265 = 'Foto valid upload -> tersimpan: persists a belanja mutation. Deferred.';
const DEFERRED_266 = 'Referensi RAB Jamuan -> realisasi bertambah: depends on persisted belanja + RAB matching. Deferred.';
const DEFERRED_268 = 'Kategori Pengadaan Inventaris -> kandidat inventaris: there is no "kandidat inventaris" marker in the pengeluaran form/service. Deferred.';
const DEFERRED_270 = 'Pengeluaran Seksi lain / Bidang lain -> Ditolak: no deterministic cross-Seksi fixture to prove the scope denial. Deferred.';
const DEFERRED_271 = 'Referensi RAB belum disetujui/dicairkan -> tidak tersedia/ditolak: there is no RAB reference field; RAB is auto-matched by khidmah+periode. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const pengeluaranPayload = (over: Record<string, unknown>) => ({
  uraian: 'QA PJ',
  qty: '1',
  vol: '1',
  harga_satuan: '1000',
  sub_agenda: 'haul_akbar',
  ...over,
});

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-262', 'Buka form pengeluaran | EXPECT: Field sesuai FR-13')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-262', 'Buka form pengeluaran'), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      await page.goto('/keuangan/pengeluaran-kas/create');
      await expect(page.getByRole('heading', { name: 'Catat Belanja / Pengeluaran' })).toBeVisible();
      for (const name of ['foto_nota', 'qty', 'vol', 'harga_satuan', 'satuan', 'sub_agenda']) {
        await expect(page.locator(`[name="${name}"]`).first()).toBeVisible();
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-263', 'Isi qty 100, harga 2.500 | EXPECT: Nominal auto = 250.000')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-263', 'Isi qty 100, harga 2.500'), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      await page.goto('/keuangan/pengeluaran-kas/create');
      await page.locator('input[name="qty"]').fill('100');
      await page.locator('select[name="satuan"]').selectOption({ index: 1 });
      await page.locator('input[name="vol"]').fill('1');
      await page.locator('input[name="harga_satuan"]').fill('2500');
      await expect(page.locator('input[readonly]').first()).toHaveValue(/250\.000/);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-264', 'Simpan tanpa foto | EXPECT: Ditolak (FR-13)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-264', 'Simpan tanpa foto'), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      await page.goto('/keuangan/pengeluaran-kas/create');
      const nota = page.locator('input[name="foto_nota"]');
      await expect(nota).toHaveAttribute('required', '');
      expect(await nota.evaluate((el) => !(el as HTMLInputElement).checkValidity())).toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-265', 'Foto valid upload | EXPECT: Tersimpan', DEFERRED_265)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-265', 'Foto valid upload', DEFERRED_265), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-266', 'Referensi RAB Jamuan | EXPECT: Realisasi bertambah', DEFERRED_266)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-266', 'Referensi RAB Jamuan', DEFERRED_266), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-267', 'Foto > 5MB / format exe | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-267', 'Foto > 5MB / format exe'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ fake exe') },
          ...pengeluaranPayload({}),
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.foto_nota).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-268', 'Kategori Pengadaan Inventaris | EXPECT: Kandidat inventaris', DEFERRED_268)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-268', 'Kategori Pengadaan Inventaris', DEFERRED_268), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-269', 'Pengeluaran tanpa nota | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-269', 'Pengeluaran tanpa nota'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
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
    testTitle(meta('TC-REQ-270', 'Pengeluaran Seksi lain / Bidang lain | EXPECT: Ditolak', DEFERRED_270)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-270', 'Pengeluaran Seksi lain / Bidang lain', DEFERRED_270), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-271', 'Referensi RAB belum disetujui/dicairkan | EXPECT: Tidak tersedia/ditolak', DEFERRED_271)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-271', 'Referensi RAB belum disetujui/dicairkan', DEFERRED_271), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-272', 'Kategori non-master | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-272', 'Kategori non-master'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.png', mimeType: 'image/png', buffer: Buffer.from('89504e47', 'hex') },
          ...pengeluaranPayload({ akun_pengeluaran_id: '999999999' }),
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.akun_pengeluaran_id).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-273', 'Qty/harga 0 atau minus | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-273', 'Qty/harga 0 atau minus'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.png', mimeType: 'image/png', buffer: Buffer.from('89504e47', 'hex') },
          ...pengeluaranPayload({ qty: '0', harga_satuan: '-1' }),
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.qty).toBeTruthy();
      expect(body.errors?.harga_satuan).toBeTruthy();
    }
  );
});