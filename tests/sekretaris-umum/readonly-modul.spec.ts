import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { sekretarisUmum } from '../../test-data/users';
import {
  apiLogin,
  jsonHeaders,
  resolvePenerimaanKasDenialPayload,
  resolvePengeluaranKasDenialPayload,
  ONE_BY_ONE_PNG,
} from '../../utils/api';

/**
 * Approved journey J-SU3 - "Verifikasi Read-Only Modul Lain (Bg. 8.3)".
 * Role: Sekretaris Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-100 .. TC-REQ-105 (6 scenarios).
 *
 * EXECUTION GUARD: requires a configured Sekretaris Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - UserPolicy::viewAny/create = isSuperadmin() -> web `/pengaturan/user` and API
 *   `POST /api/v1/pengaturan/users` are 403 for the Sekum (TC-REQ-101, 105).
 * - PenerimaanKasPolicy::create and PengeluaranKasPolicy::create both EXCLUDE
 *   SEKRETARIS_UMUM -> API POST of penerimaan/pengeluaran is 403 (103, 104).
 * - DISCREPANCY: AkunTransaksiController (web `/pengaturan/keuangan/akun-transaksi`)
 *   has NO authorize()/policy and the route carries no role gate, so a Sekum can
 *   READ the master accounts. TC-REQ-102 expects rejection -> deferred.
 * - DISCREPANCY: PenerimaanKasPolicy::viewAny = true for all roles, so the Sekum
 *   can open the Keuangan list pages. TC-REQ-100 expects "tidak tampil / 403" ->
 *   deferred.
 */

const JOURNEY = 'J-SU3 - Verifikasi Read-Only Modul Lain (Bg. 8.3)';
const REQUIREMENTS = ['FR-06', 'N-1', 'N-10', 'UC-20'];
const ROLE = 'Sekretaris Umum';

const DEFERRED_100 =
  'DISCREPANCY vs approval: TC-REQ-100 expects the Sekretaris Umum to be DENIED ' +
  'access to Keuangan > Penerimaan/Pengeluaran. However ' +
  'PenerimaanKasPolicy::viewAny and PengeluaranKasPolicy::viewAny both return ' +
  'true for every authenticated user (scoping happens in the repository, not the ' +
  'policy), so the Sekum CAN open the lists. Deferred for product/dev confirmation.';

const DEFERRED_102 =
  'DISCREPANCY vs approval: TC-REQ-102 expects Master Akun access to be denied ' +
  'for the Sekretaris Umum. However AkunTransaksiController declares only ' +
  '`$this->middleware(\'auth\')` and none of its actions call authorize()/Gate, ' +
  'and the routes carry no role gate; ScopeToUserAccess performs no role denial. ' +
  'A Sekum can therefore read the master accounts. Deferred for product/dev ' +
  'confirmation (missing authorization).';

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
    testTitle(meta('TC-REQ-100', 'Coba akses menu Keuangan Penerimaan/Pengeluaran | EXPECT: tidak tampil / 403', DEFERRED_100)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-100', 'Coba akses menu Keuangan Penerimaan/Pengeluaran', DEFERRED_100), {
        requiresSession: true,
        user: sekretarisUmum(),
      });
      await signIn(loginPage, sekretarisUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-101', 'Coba akses menu Users & Role | EXPECT: ditolak (hanya Superadmin)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-101', 'Coba akses menu Users & Role'), {
        requiresSession: true,
        user: sekretarisUmum(),
      });
      await signIn(loginPage, sekretarisUmum());
      const resp = await page.goto('/pengaturan/user');
      expect(resp?.status(), 'User management must be 403 for the Sekretaris Umum').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-102', 'Coba akses Master Akun | EXPECT: ditolak', DEFERRED_102)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-102', 'Coba akses Master Akun', DEFERRED_102), {
        requiresSession: true,
        user: sekretarisUmum(),
      });
      await signIn(loginPage, sekretarisUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-103', 'Coba POST transaksi via API | EXPECT: ditolak (policy)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-103', 'Coba POST transaksi via API'), {
        requiresCredentials: true,
        user: sekretarisUmum(),
      });
      const token = await apiLogin(request, sekretarisUmum());
      const payload = await resolvePenerimaanKasDenialPayload(request, token);
      authTest.skip(
        !payload,
        'No master data (periode/akun penerimaan) to build a schema-valid payload; the policy denial cannot be reached.'
      );
      const res = await request.post('/api/v1/keuangan/penerimaan-kas', {
        headers: jsonHeaders(token),
        data: payload,
        failOnStatusCode: false,
      });
      expect(res.status(), 'Sekretaris Umum POST penerimaan-kas must be 403').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-104', 'SU bisa input transaksi/ubah data keuangan | EXPECT: ditolak (defect)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-104', 'SU bisa input transaksi/ubah data keuangan'), {
        requiresCredentials: true,
        user: sekretarisUmum(),
      });
      const token = await apiLogin(request, sekretarisUmum());
      const payload = await resolvePengeluaranKasDenialPayload(request, token);
      authTest.skip(
        !payload,
        'No master data (periode/bidang/khidmah/akun) to build a schema-valid payload; the policy denial cannot be reached.'
      );
      const probe = payload!;
      const res = await request.post('/api/v1/keuangan/pengeluaran-kas', {
        headers: jsonHeaders(token),
        multipart: {
          periode_haul_akbar_id: String(probe.periode_haul_akbar_id),
          tanggal_transaksi: probe.tanggal_transaksi,
          bidang_id: String(probe.bidang_id),
          khidmah_id: String(probe.khidmah_id),
          akun_pengeluaran_id: String(probe.akun_pengeluaran_id),
          sub_agenda: probe.sub_agenda,
          uraian: probe.uraian,
          qty: String(probe.qty),
          satuan: probe.satuan,
          harga_satuan: String(probe.harga_satuan),
          dibayarkan_ke: probe.dibayarkan_ke,
          foto_nota: {
            name: 'qa-denial-probe.png',
            mimeType: 'image/png',
            buffer: ONE_BY_ONE_PNG,
          },
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'Sekretaris Umum POST pengeluaran-kas must be 403').toBe(403);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-105', 'SU bisa kelola Users & Role | EXPECT: ditolak (defect)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-105', 'SU bisa kelola Users & Role'), {
        requiresCredentials: true,
        user: sekretarisUmum(),
      });
      const token = await apiLogin(request, sekretarisUmum());
      const res = await request.post('/api/v1/pengaturan/users', {
        headers: jsonHeaders(token),
        data: { nama: 'x', email: 'x@x.test', password: 'Password123' },
        failOnStatusCode: false,
      });
      expect(res.status(), 'Sekretaris Umum POST users must be 403').toBe(403);
    }
  );
});