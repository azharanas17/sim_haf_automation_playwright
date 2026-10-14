import { APIRequestContext, expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { ketuaBidang, bendaharaUmum, pjSeksi } from '../../test-data/users';
import { apiLogin, jsonHeaders, firstResourceId } from '../../utils/api';

/**
 * Approved journey J-KB1 - "Approval RAB oleh Ketua Bidang".
 * Role: Ketua Bidang. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-187 .. TC-REQ-195 (9 scenarios).
 *
 * EXECUTION GUARD: requires a configured Ketua Bidang identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `keuangan.rab.index` H1 = "Rencana Anggaran Biaya (RAB)"; show H1 = "Detail RAB".
 * - `RabController::updateStatus`: approved_kabid / rejected_kabid ->
 *   `authorize('approveKabid')` (KETUA_BIDANG + bidang match + isSubmitted);
 *   disbursed / rejected_bu -> approveBU.
 * - `UpdateRabStatusRequest`: `catatan` requiredIf rejected_kabid/rejected_bu.
 */

const JOURNEY = 'J-KB1 - Approval RAB oleh Ketua Bidang';
const REQUIREMENTS = ['FR-12', 'Bg. 13'];
const ROLE = 'Ketua Bidang';
const API = '/api/v1';

const DEFERRED_189 =
  'Setujui -> status Disetujui + notif ke PJ & BU: performs the approved_kabid ' +
  'transition (mutation of shared RAB state) and dispatches notifications. ' +
  'Deferred.';

const DEFERRED_190 =
  'Tolak RAB lain -> status Ditolak + alasan; PJ notif & re-submit: performs the ' +
  'rejected_kabid transition (mutation). The reason requirement itself is ' +
  'asserted live in TC-REQ-194. Deferred.';

const DEFERRED_191 =
  'Coba approve RAB Bidang lain -> Ditolak (scope): requires a specific RAB that ' +
  'belongs to a DIFFERENT bidang than this Ketua Bidang; the fixture bidang ' +
  'mapping is not deterministic. Enforced by approveKabid bidang-match. Deferred.';

const DEFERRED_192 =
  'Approve RAB Bidang lain (negative) -> Ditolak (policy Bidang): same ' +
  'deterministic-id requirement as TC-REQ-191. Deferred.';

const DEFERRED_193 =
  'Approve tanpa status valid (sudah disetujui/ditolak) -> Ditolak (state guard): ' +
  'requires a RAB already in approved/rejected state; not deterministic and ' +
  'mutating to reach. Enforced by approveKabid isSubmitted(). Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const rabId = async (request: APIRequestContext, token: string): Promise<number | undefined> => {
  const res = await request.get(`${API}/keuangan/rabs`, {
    headers: jsonHeaders(token),
    failOnStatusCode: false,
  });
  return res.ok() ? firstResourceId(await res.json()) : undefined;
};

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-187', 'Buka list RAB Bidang "Konsumsi" | EXPECT: RAB Seksi Jamuan menunggu approval tampil')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-187', 'Buka list RAB Bidang'), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
      const resp = await page.goto('/keuangan/rab');
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Rencana Anggaran Biaya (RAB)' })).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-188', 'Tinjau detail | EXPECT: Detail tampil jelas')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-188', 'Tinjau detail'), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
      await page.goto('/keuangan/rab');
      const detail = page.locator('a[href*="/keuangan/rab/"]').first();
      authTest.skip((await detail.count()) === 0, 'No RAB available to inspect.');
      await detail.click();
      await expect(page).toHaveURL(/\/keuangan\/rab\/\d+/);
      await expect(page.getByRole('heading', { name: 'Detail RAB' })).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-189', 'Setujui | EXPECT: Status -> Disetujui; notif ke PJ & BU', DEFERRED_189)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-189', 'Setujui', DEFERRED_189), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-190', 'Tolak RAB lain | EXPECT: Status -> Ditolak + alasan; PJ mendapat notif & bisa ajukan ulang', DEFERRED_190)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-190', 'Tolak RAB lain', DEFERRED_190), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-191', 'Coba approve RAB Bidang lain | EXPECT: Ditolak (scope)', DEFERRED_191)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-191', 'Coba approve RAB Bidang lain', DEFERRED_191), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-192', 'Approve RAB Bidang lain | EXPECT: Ditolak (policy Bidang)', DEFERRED_192)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-192', 'Approve RAB Bidang lain', DEFERRED_192), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-193', 'Approve tanpa status valid (sudah disetujui/ditolak) | EXPECT: Ditolak (state guard)', DEFERRED_193)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-193', 'Approve tanpa status valid', DEFERRED_193), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-194', 'Penolakan tanpa alasan | EXPECT: Ditolak / wajib alasan')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-194', 'Penolakan tanpa alasan'), { requiresCredentials: true, user: bendaharaUmum() });
      const token = await apiLogin(request, bendaharaUmum());
      const res = await request.patch(`${API}/keuangan/rabs/1/status`, {
        headers: jsonHeaders(token),
        data: { status: 'rejected_kabid' },
        failOnStatusCode: false,
      });
      expect(res.status(), 'rejection without catatan must be rejected').toBe(422);
      const body = await res.json();
      expect(body.errors?.catatan, 'validation must flag catatan').toBeTruthy();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-195', 'PAPER-DI-F: RAB approval oleh non-Kabid | EXPECT: Ditolak')),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-195', 'RAB approval oleh non-Kabid'), { requiresCredentials: true, user: pjSeksi() });
      const bu = await apiLogin(request, bendaharaUmum());
      const id = await rabId(request, bu);
      const pj = await apiLogin(request, pjSeksi());
      const res = await request.patch(`${API}/keuangan/rabs/${id ?? 1}/status`, {
        headers: jsonHeaders(pj),
        data: { status: 'approved_kabid' },
        failOnStatusCode: false,
      });
      if (id) {
        expect(res.status(), 'non-Kabid approval must be 403').toBe(403);
      } else {
        expect([403, 404], 'no RAB fixture; only denial/absence observable').toContain(res.status());
      }
    }
  );
});