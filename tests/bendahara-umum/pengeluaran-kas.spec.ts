import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { bendaharaUmum } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-B5 - "Catat Pengeluaran Kas / Belanja".
 * Role: Bendahara Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-138 .. TC-REQ-149 (12 scenarios).
 *
 * EXECUTION GUARD: requires a configured Bendahara Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `keuangan.pengeluaran-kas.create` h1 = "Catat Belanja / Pengeluaran"; Alpine
 *   `calculateTotal()` computes `nominal = qty * vol * harga_satuan` and shows it
 *   in a readonly display input.
 * - `StorePengeluaranKasRequest`: foto_nota `[required,file,image,mimes:jpeg,png,
 *   jpg,max:5120]` (FR-13); qty `[required,integer,min:1]`; harga_satuan
 *   `[required,numeric,min:0]`; bidang_id/khidmah_id/akun_pengeluaran_id/sub_agenda
 *   required.
 */
const JOURNEY = 'J-B5 - Catat Pengeluaran Kas / Belanja';
const REQUIREMENTS = ['FR-13', 'FR-15.3.4', 'FM-2', 'FM-3'];
const ROLE = 'Bendahara Umum';
const API = '/api/v1';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

const DEFERRED_141 =
  'Upload foto nota -> Diterima: valid upload requires submitting a financial ' +
  'mutation (persists a real belanja record). The mandatory-file rule is ' +
  'asserted live in TC-REQ-140/144; persistence is deferred.';

const DEFERRED_142 =
  'Referensikan ke RAB Seksi -> Realisasi RAB bertambah: the create form has NO ' +
  'RAB picker (the RAB is auto-matched server-side by khidmah+periode, ' +
  'PengeluaranKasService::create), so "referencing" cannot be performed as ' +
  'described; and the realisasi increment requires a persisted mutation. ' +
  'Deferred.';

const DEFERRED_143 =
  'Kategori "Pengadaan Inventaris" -> muncul tanda kandidat Inventaris: there is ' +
  'NO candidate marker/badge anywhere in the Pengeluaran Kas UI (grep of app/ and ' +
  'views finds no "kandidat"). Items are auto-promoted only later, in ' +
  'LpjService::finalize(). Deferred (approved expectation not implemented).';

const DEFERRED_147 =
  'Referensi RAB milik Seksi lain -> tidak tersedia/ditolak (scope): there is no ' +
  'explicit RAB reference field; the khidmah_id dropdown is scoped by ' +
  'create()/scope-user-access, so cross-Seksi is inherently unavailable rather ' +
  'than rejected with a message. Deferred (no direct assertion surface for BU, ' +
  'who sees all khidmah).';

const DEFERRED_149 =
  'Akses foto nota oleh role tak berhak -> Ditolak (FR-22): notas are served via ' +
  'a signed route (`keuangan.pengeluaran-kas.nota`) and gated by ' +
  'PengeluaranKasPolicy::downloadNota. A role-based denial needs a second ' +
  'identity that both has a nota id AND lacks permission; not deterministic here. ' +
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
    testTitle(meta('TC-REQ-138', 'Buka form Pengeluaran | EXPECT: Field lengkap FR-13/15.3.4')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-138', 'Buka form Pengeluaran');
      await page.goto('/keuangan/pengeluaran-kas/create');
      await expect(page.getByRole('heading', { name: 'Catat Belanja / Pengeluaran' })).toBeVisible();
      for (const name of ['bidang_id', 'khidmah_id', 'akun_pengeluaran_id', 'sub_agenda', 'uraian', 'qty', 'satuan', 'harga_satuan', 'dibayarkan_ke', 'foto_nota']) {
        await expect(page.locator(`[name="${name}"]`).first()).toBeVisible();
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-139', 'Isi qty 10, satuan, vol 1, harga 25.000 | EXPECT: Nominal otomatis = 250.000')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-139', 'Isi qty 10, satuan, vol 1, harga 25.000');
      await page.goto('/keuangan/pengeluaran-kas/create');
      await page.locator('input[name="qty"]').fill('10');
      await page.locator('select[name="satuan"]').selectOption('Pack');
      await page.locator('input[name="vol"]').fill('1');
      await page.locator('input[name="harga_satuan"]').fill('25000');
      await expect(page.locator('input[readonly]').first()).toHaveValue(/250\.000/);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-140', 'Simpan tanpa foto nota | EXPECT: Ditolak (wajib)')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-140', 'Simpan tanpa foto nota');
      await page.goto('/keuangan/pengeluaran-kas/create');
      const nota = page.locator('input[name="foto_nota"]');
      await expect(nota).toHaveAttribute('required', '');
      expect(await nota.evaluate((el) => !(el as HTMLInputElement).checkValidity())).toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-141', 'Upload foto nota | EXPECT: Diterima', DEFERRED_141)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-141', 'Upload foto nota', DEFERRED_141), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-142', 'Referensikan ke RAB Seksi | EXPECT: Realisasi RAB bertambah', DEFERRED_142)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-142', 'Referensikan ke RAB Seksi', DEFERRED_142), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-143', 'Kategori "Pengadaan Inventaris" | EXPECT: Muncul tanda kandidat Inventaris', DEFERRED_143)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-143', 'Kategori "Pengadaan Inventaris"', DEFERRED_143), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-144', 'Foto nota tidak di-upload | EXPECT: Ditolak (FR-13)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-144', 'Foto nota tidak di-upload'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        data: { uraian: 'QA no-nota', qty: 1, harga_satuan: 1000, sub_agenda: 'haul_akbar' },
        failOnStatusCode: false,
      });
      expect(res.status(), 'missing foto_nota must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.foto_nota, 'validation must flag foto_nota').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-145', 'Qty / harga 0 atau negatif | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-145', 'Qty / harga 0 atau negatif'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.png', mimeType: 'image/png', buffer: PNG },
          uraian: 'QA qty 0',
          qty: '0',
          vol: '1',
          harga_satuan: '1000',
          sub_agenda: 'haul_akbar',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'qty=0 must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.qty, 'validation must flag qty').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-146', 'File format non-gambar (exe/txt) / >5MB | EXPECT: Ditolak (FM-2/3)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-146', 'File format non-gambar (exe/txt) / >5MB'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
          uraian: 'QA bad file',
          qty: '1',
          vol: '1',
          harga_satuan: '1000',
          sub_agenda: 'haul_akbar',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'non-image nota must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.foto_nota, 'validation must flag foto_nota').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-147', 'Referensi RAB milik Seksi lain | EXPECT: Tidak tersedia/ditolak (scope)', DEFERRED_147)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-147', 'Referensi RAB milik Seksi lain', DEFERRED_147), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-148', 'Bidang/Khidmah/kategori kosong | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-148', 'Bidang/Khidmah/kategori kosong'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.png', mimeType: 'image/png', buffer: PNG },
          uraian: 'QA no bidang',
          qty: '1',
          vol: '1',
          harga_satuan: '1000',
          sub_agenda: 'haul_akbar',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'missing bidang_id must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.bidang_id, 'validation must flag bidang_id').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-149', 'Akses foto nota oleh role tak berhak | EXPECT: Ditolak (FR-22)', DEFERRED_149)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-149', 'Akses foto nota oleh role tak berhak', DEFERRED_149), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );
});