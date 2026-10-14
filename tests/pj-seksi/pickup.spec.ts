import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { pjSeksi } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-P7 - "Pick Up Logistik Seksi (PJ Seksi)".
 * Role: PJ Seksi. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-287 .. TC-REQ-291 (5 scenarios).
 *
 * EXECUTION GUARD: requires a configured PJ Seksi identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `pickup.index` H1 = "Pick Up Logistik & Sumbangan"; `pickup.create` H1 =
 *   "Ajukan Permintaan Pick Up". StorePickUpRequest: alamat_penjemputan required;
 *   jenis_permintaan in:jemput_barang,sumbangan. PickUpPolicy::create = true.
 * - API base: /api/v1/pick-ups.
 */

const JOURNEY = 'J-P7 - Pick Up Logistik Seksi (PJ Seksi)';
const REQUIREMENTS = ['FR-20', 'Bg. 21'];
const ROLE = 'PJ Seksi';
const API = '/api/v1';

const DEFERRED_287 = 'Buat request pickup -> diajukan: persists a pickup request (mutation). Deferred.';
const DEFERRED_289 = 'Batalkan -> status Batal tercatat: performs a pickup cancel/status mutation. Deferred.';
const DEFERRED_291 = 'Tracking status kacau/duplikat -> Investigasi: investigative data-integrity check with no deterministic fixture. Deferred.';

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
    testTitle(meta('TC-REQ-287', 'Buat request pickup | EXPECT: Diajukan', DEFERRED_287)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-287', 'Buat request pickup', DEFERRED_287), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-288', 'Lihat tracking | EXPECT: Status tampil')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-288', 'Lihat tracking'), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      const resp = await page.goto('/pickup');
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Pick Up Logistik & Sumbangan' })).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-289', 'Batalkan | EXPECT: Status Batal tercatat', DEFERRED_289)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-289', 'Batalkan', DEFERRED_289), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-290', 'Request tanpa detail wajib | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-290', 'Request tanpa detail wajib'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/pick-ups`, {
        headers: jsonHeaders(token),
        data: { periode_haul_akbar_id: 999999999, jenis_permintaan: 'jemput_barang' },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).errors?.alamat_penjemputan).toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-291', 'Tracking status kacau/duplikat | EXPECT: Investigasi', DEFERRED_291)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-291', 'Tracking status kacau/duplikat', DEFERRED_291), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );
});