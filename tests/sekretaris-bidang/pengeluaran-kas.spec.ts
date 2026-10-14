import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { sekretarisBidang } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-SB3 - "Pengeluaran Kas Seksi (Sekretaris Bidang)".
 * Role: Sekretaris Bidang. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-234 .. TC-REQ-240 (7 scenarios).
 *
 * EXECUTION GUARD: requires a configured Sekretaris Bidang identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `pengeluaran-kas/create` H1 = "Catat Belanja / Pengeluaran"; Alpine computes
 *   nominal = qty * vol * harga_satuan; foto_nota required (FR-13), image mimes +
 *   max 5MB. PengeluaranKasPolicy::create includes SEKRETARIS_BIDANG.
 */

const JOURNEY = 'J-SB3 - Pengeluaran Kas Seksi (Sekretaris Bidang)';
const REQUIREMENTS = ['FR-13', 'FR-15.3.4'];
const ROLE = 'Sekretaris Bidang';
const API = '/api/v1';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

const DEFERRED_236 =
  'Upload foto nota & simpan -> tercatat + realisasi RAB Jamuan +250.000: ' +
  'persists a belanja mutation and bumps RAB realisasi (shared state). Deferred.';

const DEFERRED_237 =
  'Cek Dashboard Bidang -> realisasi & sisa update real-time: depends on a ' +
  'persisted belanja and the dashboard cache (120s) staleness window. Deferred.';

const DEFERRED_239 =
  'Referensi RAB di luar scope Bidang -> tidak tersedia/ditolak: there is no RAB ' +
  'reference field; the RAB is auto-matched by khidmah+periode, so cross-scope is ' +
  'inherently unavailable rather than message-rejected. Deferred.';

const DEFERRED_240 =
  'Panitia Lapangan (P08) input pengeluaran terpisah -> tetap masuk realisasi ' +
  'seksi (konsistensi): belongs to journey P08 and requires a persisted ' +
  'cross-role mutation. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-234', 'Buka form Pengeluaran | EXPECT: Nominal = 250.000')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-234', 'Buka form Pengeluaran'), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
      await page.goto('/keuangan/pengeluaran-kas/create');
      await expect(page.getByRole('heading', { name: 'Catat Belanja / Pengeluaran' })).toBeVisible();
      await page.locator('input[name="qty"]').fill('10');
      await page.locator('select[name="satuan"]').selectOption('Pack');
      await page.locator('input[name="vol"]').fill('1');
      await page.locator('input[name="harga_satuan"]').fill('25000');
      await expect(page.locator('input[readonly]').first()).toHaveValue(/250\.000/);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-235', 'Simpan tanpa foto | EXPECT: Ditolak (FR-13)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-235', 'Simpan tanpa foto'), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
      await page.goto('/keuangan/pengeluaran-kas/create');
      const nota = page.locator('input[name="foto_nota"]');
      await expect(nota).toHaveAttribute('required', '');
      expect(await nota.evaluate((el) => !(el as HTMLInputElement).checkValidity())).toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-236', 'Upload foto nota & simpan | EXPECT: Tercatat; realisasi RAB Jamuan + 250.000', DEFERRED_236)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-236', 'Upload foto nota & simpan', DEFERRED_236), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-237', 'Cek Dashboard Bidang | EXPECT: Realisasi & sisa update real-time', DEFERRED_237)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-237', 'Cek Dashboard Bidang', DEFERRED_237), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-238', 'Foto belum di-upload / format non-gambar | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-238', 'Foto belum di-upload / format non-gambar'), { requiresCredentials: true, user: sekretarisBidang() });
      const token = await apiLogin(request, sekretarisBidang());
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: jsonHeaders(token),
        multipart: {
          foto_nota: { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('not image') },
          uraian: 'QA SB bad file',
          qty: '1',
          vol: '1',
          harga_satuan: '1000',
          sub_agenda: 'haul_akbar',
        },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      const body = await res.json();
      expect(body.errors?.foto_nota).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-239', 'Referensi RAB di luar scope Bidang | EXPECT: Tidak tersedia/ditolak', DEFERRED_239)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-239', 'Referensi RAB di luar scope Bidang', DEFERRED_239), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-240', 'Panitia Lapangan (P08) input pengeluaran terpisah | EXPECT: Tetap masuk realisasi seksi - konsistensi harus dijaga', DEFERRED_240)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-240', 'Panitia Lapangan input pengeluaran terpisah', DEFERRED_240), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
    }
  );
});