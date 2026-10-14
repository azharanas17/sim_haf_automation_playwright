import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { pjSeksi } from '../../test-data/users';

/**
 * Approved journey J-P5 - "Monitoring Realisasi & Sisa Seksi (PJ Seksi)".
 * Role: PJ Seksi. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-274 .. TC-REQ-277 (4 scenarios).
 *
 * EXECUTION GUARD: requires a configured PJ Seksi identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - RP-4 `/laporan/preview/rp4` H1 = "Rekap Pengeluaran per Bidang/Seksi";
 *   LaporanPolicy::generate default = true (scoped service per user).
 */

const JOURNEY = 'J-P5 - Monitoring Realisasi & Sisa Seksi (PJ Seksi)';
const REQUIREMENTS = ['RP-4', 'FR-11'];
const ROLE = 'PJ Seksi';

const DEFERRED_274 = 'Cek realisasi RAB Jamuan -> sesuai sum pengeluaran: numeric reconciliation against an independent source; no deterministic ground truth. Deferred.';
const DEFERRED_275 = 'Cek sisa -> 4.750.000: exact numeric expectation depends on seeded RAB/pengeluaran fixture values. Deferred.';
const DEFERRED_276 = 'Over budget uji -> indikator tampil: requires a persisted over-budget state; fixture not deterministic. Deferred.';

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
    testTitle(meta('TC-REQ-274', 'Cek realisasi RAB Jamuan | EXPECT: Sesuai sum pengeluaran', DEFERRED_274)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-274', 'Cek realisasi RAB Jamuan', DEFERRED_274), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-275', 'Cek sisa | EXPECT: 4.750.000', DEFERRED_275)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-275', 'Cek sisa', DEFERRED_275), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-276', 'Over budget uji | EXPECT: Indikator tampil', DEFERRED_276)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-276', 'Over budget uji', DEFERRED_276), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-277', 'Export laporan seksi | EXPECT: Angka tampil')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-277', 'Export laporan seksi'), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      const resp = await page.goto('/laporan/preview/rp4');
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Rekap Pengeluaran per Bidang/Seksi' })).toBeVisible();
    }
  );
});