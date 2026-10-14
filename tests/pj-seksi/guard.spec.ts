import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { pjSeksi } from '../../test-data/users';
import { apiLogin, jsonHeaders } from '../../utils/api';

/**
 * Approved journey J-P8 - "Batasan Akses PJ Seksi".
 * Role: PJ Seksi. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-292 .. TC-REQ-295 (4 scenarios).
 *
 * EXECUTION GUARD: requires a configured PJ Seksi identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `POST /api/v1/pengaturan/users` is denied (UserPolicy create) -> 403.
 * - `POST /api/v1/keuangan/koreksi-transaksi` -> KoreksiTransaksiPolicy::create =
 *   Superadmin || Bendahara Umum -> 403 for a PJ Seksi. A VALID body is required so
 *   that FormRequest validation does not short-circuit with 422 before the gateway.
 */

const JOURNEY = 'J-P8 - Batasan Akses PJ Seksi';
const REQUIREMENTS = ['FR-06', 'FR-22', 'Bg. 19'];
const ROLE = 'PJ Seksi';
const API = '/api/v1';

const DEFERRED_292 = 'Akses data Bidang lain -> ditolak: no deterministic cross-Bidang fixture to prove the scope denial. Deferred.';
const DEFERRED_295 = 'Akses bukti nota -> Diizinkan (FR-22): requires an owned receipt fixture and a storage-signed URL check; not deterministically fixture-able. Deferred.';

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
    testTitle(meta('TC-REQ-292', 'Coba akses data Bidang lain | EXPECT: Ditolak', DEFERRED_292)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-292', 'Coba akses data Bidang lain', DEFERRED_292), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-293', 'Coba CRUD Pengaturan/Users/Role | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-293', 'Coba CRUD Pengaturan/Users/Role'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/pengaturan/users`, {
        headers: jsonHeaders(token),
        data: { nama: 'qa-pj', email: 'qa-pj-guard@uat.test', password: 'Password123' },
        failOnStatusCode: false,
      });
      expect(res.status(), 'PJ Seksi POST users must be 403').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-294', 'Coba buat koreksi (hak BU/SA) | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-294', 'Coba buat koreksi'), { requiresCredentials: true, user: pjSeksi() });
      const token = await apiLogin(request, pjSeksi());
      const res = await request.post(`${API}/keuangan/koreksi-transaksi`, {
        headers: jsonHeaders(token),
        data: {
          transactionable_id: 1,
          transactionable_type: 'pengeluaran',
          jenis_koreksi: 'reversal_penuh',
          alasan_koreksi: 'QA guard: PJ must not create corrections',
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'PJ Seksi POST koreksi must be 403').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-295', 'Akses bukti nota | EXPECT: Diizinkan (FR-22)', DEFERRED_295)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-295', 'Akses bukti nota', DEFERRED_295), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
    }
  );
});