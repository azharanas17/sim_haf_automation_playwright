import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { bendaharaUmum } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-B4 - "Penerimaan Kas Multi-Valuta (Kurs)".
 * Role: Bendahara Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-132 .. TC-REQ-137 (6 scenarios).
 *
 * EXECUTION GUARD: requires a configured Bendahara Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `penerimaan-kas/create.blade.php` has a checkbox `#use_valas` (Alpine
 *   `useValas`) that reveals the `valuta`, `nominal_valas`, `kurs` group via
 *   `x-show`; `calculateRupiah()` writes `nominal = Math.round(nominal_valas *
 *   kurs)` and the `nominal` input is `:readonly="useValas"`.
 * - `StorePenerimaanKasRequest`: kurs => [nullable,numeric,min:1] (so 0 is
 *   rejected); valuta => [nullable,string].
 */
const JOURNEY = 'J-B4 - Penerimaan Kas Multi-Valuta (Kurs)';
const REQUIREMENTS = ['FR-11', 'Bg. 15.3.2'];
const ROLE = 'Bendahara Umum';

const DEFERRED_134 =
  'Simpan -> tersimpan dalam Rupiah; saldo sesuai: persists a financial mutation ' +
  '(shared operational data). The Rupiah conversion itself is asserted live in ' +
  'TC-REQ-133/137; persistence is deferred.';

const DEFERRED_135 =
  'DISCREPANCY / not enforced: valuta dipilih tanpa Kurs -> Ditolak/konversi ' +
  'gagal. The `kurs` rule is [nullable,numeric,min:1] and there is NO ' +
  'required_if:valuta, so selecting a valuta with an EMPTY kurs does not fail ' +
  'validation (and the service only treats it as valas when kurs > 1). Deferred ' +
  'for dev confirmation.';

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
    testTitle(meta('TC-REQ-132', 'Pilih Valuta Asing (USD) | EXPECT: Muncul field Kurs')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-132', 'Pilih Valuta Asing (USD)');
      await page.goto('/keuangan/penerimaan-kas/create');
      await expect(page.locator('input[name="kurs"]')).toBeHidden();
      await page.locator('#use_valas').check();
      await expect(page.locator('input[name="kurs"]')).toBeVisible();
      await expect(page.locator('select[name="valuta"]')).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-133', 'Isi Kurs (mis. 15.850) sebagai Rp / USD | EXPECT: Konversi = Rp 1.585.000')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-133', 'Isi Kurs (mis. 15.850) sebagai Rp / USD');
      await page.goto('/keuangan/penerimaan-kas/create');
      await page.locator('#use_valas').check();
      await page.locator('input[name="nominal_valas"]').fill('100');
      await page.locator('input[name="kurs"]').fill('15850');
      await expect(page.locator('input[name="nominal"]')).toHaveValue('1585000');
    }
  );

  authTest(
    testTitle(meta('TC-REQ-134', 'Simpan | EXPECT: Tersimpan dalam Rupiah; saldo sesuai', DEFERRED_134)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-134', 'Simpan', DEFERRED_134), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-135', 'Valuta dipilih tanpa Kurs | EXPECT: Ditolak / konversi gagal', DEFERRED_135)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-135', 'Valuta dipilih tanpa Kurs', DEFERRED_135), { requiresSession: true, user: bendaharaUmum() });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-136', 'Kurs <= 0 | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-136', 'Kurs <= 0'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.post('/api/v1/keuangan/penerimaan-kas', {
        headers: jsonHeaders(token),
        data: {
          valuta: 'USD',
          nominal_valas: 100,
          kurs: 0,
          nominal: 100,
          channel: 'transfer',
          tanggal_transaksi: '2026-01-01',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'kurs=0 must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.kurs, 'validation must flag kurs').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-137', 'Kurs tidak konsisten (input semi-manual) | EXPECT: Validasi; hasil konversi jelas ditampilkan sebelum simpan')),
    async ({ page, loginPage }) => {
      await begin(loginPage, 'TC-REQ-137', 'Kurs tidak konsisten (input semi-manual)');
      await page.goto('/keuangan/penerimaan-kas/create');
      await page.locator('#use_valas').check();
      await page.locator('input[name="nominal_valas"]').fill('7');
      await page.locator('input[name="kurs"]').fill('15850');
      const nominal = page.locator('input[name="nominal"]');
      // Conversion result is shown (and locked) before saving.
      await expect(nominal).toHaveValue('110950');
      await expect(nominal).toHaveAttribute('readonly', '');
    }
  );
});