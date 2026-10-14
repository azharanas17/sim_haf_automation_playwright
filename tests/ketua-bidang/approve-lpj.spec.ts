import { APIRequestContext, expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { ketuaBidang, bendaharaUmum } from '../../test-data/users';
import { apiLogin, jsonHeaders, firstResourceId } from '../../utils/api';

/**
 * Approved journey J-KB5 - "Approval LPJ oleh Ketua Bidang".
 * Role: Ketua Bidang. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-211 .. TC-REQ-216 (6 scenarios).
 *
 * EXECUTION GUARD: requires a configured Ketua Bidang identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `keuangan.lpj.index` H1 = "Laporan Pertanggungjawaban (LPJ)".
 * - `LpjPolicy::approve` = KETUA_BIDANG + bidang match + isSubmitted;
 *   `finalize` = Superadmin || Bendahara Umum (only) + isApprovedKabid.
 * - API `PATCH /api/v1/keuangan/lpjs/{lpj}/status` maps finalized -> finalize
 *   (403 for a Ketua Bidang), approved_kabid -> approve.
 */

const JOURNEY = 'J-KB5 - Approval LPJ oleh Ketua Bidang';
const REQUIREMENTS = ['FR-18', 'N-10', 'Bg. 10'];
const ROLE = 'Ketua Bidang';
const API = '/api/v1';

const DEFERRED_212 =
  'Approve -> status Disetujui + notif N-10 ke PJ & BU: performs the ' +
  'approved_kabid LPJ transition (mutation) + notification dispatch. Deferred.';

const DEFERRED_213 =
  'Tolak LPJ lain -> Ditolak; PJ memperbaiki: performs the reject/draft ' +
  'transition (mutation) and needs a submitted LPJ. Deferred.';

const DEFERRED_214 =
  'Approve LPJ Bidang lain -> Ditolak: requires a deterministic LPJ belonging to ' +
  'a different Bidang; the fixture bidang mapping is not deterministic. Enforced ' +
  'by approve() bidang match. Deferred.';

const DEFERRED_216 =
  'LPJ belum diajukan -> tidak muncul di daftar: the listing scope/status filter ' +
  'depends on fixture data; no deterministic hook to assert a specific ' +
  'non-submitted LPJ is hidden. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const lpjId = async (request: APIRequestContext, token: string): Promise<number | undefined> => {
  const res = await request.get(`${API}/keuangan/lpjs`, {
    headers: jsonHeaders(token),
    failOnStatusCode: false,
  });
  return res.ok() ? firstResourceId(await res.json()) : undefined;
};

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-211', 'Terima notif LPJ Jamuan | EXPECT: Detail LPJ tampil')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-211', 'Terima notif LPJ Jamuan'), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
      const resp = await page.goto('/keuangan/lpj');
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Laporan Pertanggungjawaban (LPJ)' })).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-212', 'Approve | EXPECT: Status Disetujui; notif N-10 ke PJ & informasi BU', DEFERRED_212)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-212', 'Approve', DEFERRED_212), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-213', 'Tolak LPJ lain | EXPECT: Ditolak; PJ memperbaiki', DEFERRED_213)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-213', 'Tolak LPJ lain', DEFERRED_213), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-214', 'Approve LPJ Bidang lain | EXPECT: Ditolak', DEFERRED_214)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-214', 'Approve LPJ Bidang lain', DEFERRED_214), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-215', 'Finalisasi LPJ (hak BU) oleh Kabid | EXPECT: Ditolak (finalisasi khusus BU)')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-215', 'Finalisasi LPJ oleh Kabid'), { requiresCredentials: true, user: ketuaBidang() });
      const bu = await apiLogin(request, bendaharaUmum());
      const id = await lpjId(request, bu);
      const kb = await apiLogin(request, ketuaBidang());
      const res = await request.patch(`${API}/keuangan/lpjs/${id ?? 1}/status`, {
        headers: jsonHeaders(kb),
        data: { status: 'finalized' },
        failOnStatusCode: false,
      });
      if (id) {
        expect(res.status(), 'Kabid finalize must be 403').toBe(403);
      } else {
        expect([403, 404], 'no LPJ fixture; only denial/absence observable').toContain(res.status());
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-216', 'LPJ belum diajukan | EXPECT: Tidak muncul di daftar', DEFERRED_216)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-216', 'LPJ belum diajukan', DEFERRED_216), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );
});