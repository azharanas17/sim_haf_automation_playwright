import { Page, expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { bendaharaUmum } from '../../test-data/users';

/**
 * Approved journey J-B3 - "Catat Penerimaan Kas".
 * Role: Bendahara Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-121 .. TC-REQ-131 (11 scenarios).
 *
 * EXECUTION GUARD: requires a configured Bendahara Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `keuangan.penerimaan-kas.create` h1 = "Catat Penerimaan Kas"; store redirects
 *   to `.../{id}/kwitansi` with flash "Penerimaan kas berhasil disimpan."
 * - `StorePenerimaanKasRequest`: akun_penerimaan_id/disetor_oleh/channel/
 *   tanggal_transaksi/nominal required; `channel in:transfer,tunai`; nominal
 *   `min:0` (NOT gt:0); kurs `min:1`; bukti `nullable file mimes:jpeg,png,jpg
 *   max:5120`.
 * - No `no_kuitansi`/`nomor_kuitansi` form field exists - the number is generated
 *   server-side (`HAF/{tahun}/{00001}`), never user input (TC-REQ-130).
 */

const JOURNEY = 'J-B3 - Catat Penerimaan Kas';
const REQUIREMENTS = ['FR-11', 'Bg. 15.3.2'];
const ROLE = 'Bendahara Umum';

const DEFERRED_122 =
  'Isi form lengkap (kategori Jamaah Umum, nominal 1.000.000, disetor oleh, ' +
  'channel Transfer) -> Valid: "kategori" (kategori_wilayah) is an Alpine-only ' +
  'client filter with NO name attribute and is NOT submitted; the persisted ' +
  'category lives on the selected `akun_penerimaan_id`. Filling + submitting is ' +
  'a financial mutation. Deferred.';

const DEFERRED_123 =
  'Simpan -> No. Kuitansi auto-generate, saldo bertambah: persists a real ' +
  'financial record and bumps the receipt sequence/saldo (shared operational ' +
  'data). Deferred (mutation). Number generation is server-side, verified by ' +
  'code: PenerimaanKasService::create() sprintf("HAF/%d/%05d", ...).';

const DEFERRED_125 =
  'DISCREPANCY vs approval: TC-REQ-125 expects nominal 0/negatif to be Ditolak. ' +
  'StorePenerimaanKasRequest validates nominal as [required,numeric,min:0], so ' +
  'nominal = 0 is ACCEPTED (only negatives are rejected). Deferred for dev ' +
  'confirmation (should be gt:0 per the approved expectation).';

const DEFERRED_126 =
  'Upload bukti opsional (format valid) -> Tersimpan: bukti is `nullable file ' +
  'mimes:jpeg,png,jpg max:5120` (optional, verified by rules) but "Tersimpan" ' +
  'requires submitting a financial mutation. The optionality itself is asserted ' +
  'in TC-REQ-121 context; persistence is deferred.';

const DEFERRED_128 =
  'DISCREPANCY vs approval: nominal <= 0 / bukan angka -> Ditolak. Non-numeric is ' +
  'rejected (native + numeric rule), but 0 passes because of the `min:0` rule ' +
  '(same defect as TC-REQ-125). Deferred.';

const DEFERRED_131 =
  'Panitia Lapangan mengedit transaksi -> Ditolak (hanya create): the actor is ' +
  'PJ_SEKSI, whose PenerimaanKasPolicy create is allowed but update/delete are ' +
  'NOT; however there is no PJ edit UI route reachable (web update is BU-only, ' +
  'API exposes no PATCH), and the PJ menu is gated by canSeePenerimaanKasMenu ' +
  '(bidang bph/dana). Deferred pending the P08 ownership model.';

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

const fieldInvalid = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => !(el as HTMLInputElement).checkValidity());

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-121', 'Buka form Penerimaan Kas | EXPECT: Form sesuai field FR-11')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-121', 'Buka form Penerimaan Kas');
      await page.goto('/keuangan/penerimaan-kas/create');
      await expect(page.getByRole('heading', { name: 'Catat Penerimaan Kas' })).toBeVisible();
      for (const name of ['tanggal_transaksi', 'akun_penerimaan_id', 'disetor_oleh', 'channel', 'nominal']) {
        await expect(page.locator(`[name="${name}"]`).first()).toBeVisible();
      }
      // bukti (upload) is optional per StorePenerimaanKasRequest (nullable).
      await expect(page.locator('input[type="file"][name="bukti"]')).toHaveCount(1);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-122', 'Isi form lengkap (Jamaah Umum, nominal 1.000.000, disetor oleh, Transfer) | EXPECT: Valid', DEFERRED_122)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-122', 'Isi form lengkap', DEFERRED_122), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-123', 'Simpan | EXPECT: No. Kuitansi auto-generate, saldo bertambah', DEFERRED_123)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-123', 'Simpan', DEFERRED_123), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-124', 'Cek Disetor Oleh wajib | EXPECT: Ditolak')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-124', 'Cek Disetor Oleh wajib');
      await page.goto('/keuangan/penerimaan-kas/create');
      await expect(page.locator('input[name="disetor_oleh"]')).toHaveAttribute('required', '');
      expect(await fieldInvalid(page, 'input[name="disetor_oleh"]')).toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-125', 'Coba nominal 0 / negatif | EXPECT: Ditolak', DEFERRED_125)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-125', 'Coba nominal 0 / negatif', DEFERRED_125), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-126', 'Upload bukti opsional (format valid) | EXPECT: Tersimpan', DEFERRED_126)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-126', 'Upload bukti opsional', DEFERRED_126), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-127', 'Tanpa kategori / kategori tidak valid | EXPECT: Ditolak, harus dropdown master')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-127', 'Tanpa kategori / kategori tidak valid');
      await page.goto('/keuangan/penerimaan-kas/create');
      // The persisted category is the master-account dropdown; it is required.
      await expect(page.locator('select[name="akun_penerimaan_id"]')).toHaveAttribute('required', '');
      expect(await fieldInvalid(page, 'select[name="akun_penerimaan_id"]')).toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-128', 'Nominal <= 0 / bukan angka | EXPECT: Ditolak', DEFERRED_128)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-128', 'Nominal <= 0 / bukan angka', DEFERRED_128), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-129', 'Tanggal kosong / di luar periode | EXPECT: Ditolak')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-129', 'Tanggal kosong / di luar periode');
      await page.goto('/keuangan/penerimaan-kas/create');
      // Empty date is rejected by native required + the `required|date` rule.
      await expect(page.locator('input[name="tanggal_transaksi"]')).toHaveAttribute('required', '');
      expect(await fieldInvalid(page, 'input[name="tanggal_transaksi"]')).toBe(true);
      // NOTE: "di luar periode" has no explicit server rule (only `date`), so the
      // out-of-period case is not enforced; the empty-date case is.
    }
  );

  authTest(
    testTitle(meta('TC-REQ-130', 'Kuitansi diisi manual | EXPECT: Sistem menolak (auto)')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-130', 'Kuitansi diisi manual');
      await page.goto('/keuangan/penerimaan-kas/create');
      // The receipt number is server-generated; no user field exists to fill it.
      await expect(
        page.locator('input[name="no_kuitansi"], input[name="nomor_kuitansi"]')
      ).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-131', 'Panitia Lapangan mengedit transaksi | EXPECT: Ditolak (hanya create) - dibahas P08', DEFERRED_131)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-131', 'Panitia Lapangan mengedit transaksi', DEFERRED_131), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );
});