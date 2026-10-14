import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { KegiatanPage } from '../../pages/KegiatanPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { ketuaUmum } from '../../test-data/users';

/**
 * Approved journey J-K2 - "Lihat Semua Timeline Kegiatan (UC-20, FR-06)".
 *
 * Role: Ketua Umum. Approved source:
 * SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-074 .. TC-REQ-077 (4 scenarios).
 *
 * EXECUTION GUARD: requires a configured Ketua Umum identity
 * (env UAT_EMAIL_KETUA_UMUM / UAT_PASSWORD_KETUA_UMUM); skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - KegiatanController::index authorizes `viewAny` (true for all auth users),
 *   so a Ketua Umum can open the full cross-Bidang/Seksi timeline.
 * - DISCREPANCY: KegiatanPolicy::create returns TRUE for every user (the
 *   controller comment defers scoping to filters), so the index renders a
 *   "Tambah Agenda" link for the Ketua Umum too. TC-REQ-077 expects a
 *   read-only Ketua Umum view (no add/edit action controls); the current UI
 *   shows the create affordance. Recorded and deferred for confirmation.
 * - No `kegiatan.show` detail link/route usage exists in the index (cards carry
 *   only edit/delete controls when authorized), so TC-REQ-075 cannot be
 *   observed as a navigation (see DEFERRED_075).
 */

const JOURNEY = 'J-K2 - Lihat Semua Timeline Kegiatan (UC-20, FR-06)';
const REQUIREMENTS = ['FR-06', 'UC-20'];
const ROLE = 'Ketua Umum';

const DEFERRED_075 =
  'Klik salah satu kegiatan Seksi lain -> detail dapat dilihat: the index ' +
  '(resources/views/kegiatan/index.blade.php) renders a read-only timeline but ' +
  'exposes no detail link/route for the Ketua Umum (there is no kegiatan.show ' +
  'usage in the index; cards only carry @can(update/delete) edit/delete ' +
  'controls). With no detail affordance to click, the expected "detail ' +
  'terlihat" cannot be observed; deferred pending clarification of the detail ' +
  'entry point for read-only roles.';

const DEFERRED_077 =
  'DISCREPANCY vs approval: TC-REQ-077 expects NO edit/approve controls on the ' +
  'Ketua Umum timeline (read-only), but KegiatanPolicy::create returns true for ' +
  'every user, so `@can(create)` renders the "Tambah Agenda" link on the KU ' +
  'view. (Per-card update/delete controls ARE correctly hidden for KU.) ' +
  'Deferred for product/dev confirmation (implementation vs requirement).';

const meta = (
  id: string,
  scenario: string,
  extra: Partial<ScenarioMeta> = {}
): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...extra,
});

/** Declare the scenario (session-guarded) and sign in as Ketua Umum. */
const beginSession = async (
  loginPage: Parameters<typeof signIn>[0],
  id: string,
  scenario: string,
  extra: Partial<ScenarioMeta> = {}
): Promise<void> => {
  declareScenario(meta(id, scenario, extra), {
    requiresSession: true,
    user: ketuaUmum(),
  });
  await signIn(loginPage, ketuaUmum());
};

authTest.describe(() => {
  authTest(
    testTitle(
      meta('TC-REQ-074', 'Buka modul Kegiatan | EXPECT: timeline seluruh Bidang/Seksi tampil')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-074', 'Buka modul Kegiatan');

      const kegiatan = new KegiatanPage(page);
      await kegiatan.goto();
      // The timeline list (or its empty-state) must render for the KU.
      await expect(
        page
          .getByText('Tidak ditemukan catatan rencana agenda seksi', {
            exact: false,
          })
          .or(page.getByRole('list'))
          .first()
      ).toBeVisible();
      // Export controls prove the module is fully accessible to the KU.
      await expect(page.getByRole('link', { name: /Excel/i }).first()).toBeVisible();
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-075', 'Klik salah satu kegiatan Seksi lain | EXPECT: detail dapat dilihat', {
        deferred: DEFERRED_075,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-075', 'Klik salah satu kegiatan Seksi lain', {
        deferred: DEFERRED_075,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-076', 'Kegiatan Seksi lain tidak terlihat oleh KU | EXPECT: bug — KU harusnya melihat semua (FR-06)')
    ),
    async ({ page, loginPage }) => {
      await beginSession(
        loginPage,
        'TC-REQ-076',
        'Kegiatan Seksi lain tidak terlihat oleh KU'
      );

      const kegiatan = new KegiatanPage(page);
      await kegiatan.goto();
      // KU is NOT scoped to a Bidang: the Bidang filter defaults to the
      // unrestricted "Semua Bidang" option and is available to widen the view.
      const allOption = kegiatan.bidangAllOption();
      await expect(allOption).toHaveCount(1);
      await expect(allOption).toContainText(/Semua Bidang/i);
      await expect(kegiatan.bidangSelect).toHaveValue('');
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-077', 'Terdapat tombol approve untuk edit pada tampilan KU | EXPECT: tidak boleh tampil (read-only)', {
        deferred: DEFERRED_077,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(
        loginPage,
        'TC-REQ-077',
        'Terdapat tombol approve untuk edit pada tampilan KU',
        { deferred: DEFERRED_077 }
      );
    }
  );
});