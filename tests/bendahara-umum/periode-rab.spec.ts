import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { bendaharaUmum, pjSeksi } from '../../test-data/users';

/**
 * Approved journey J-B1 - "Kelola Periode RAB (Buka/Tutup)".
 * Role: Bendahara Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-106 .. TC-REQ-114 (9 scenarios).
 *
 * EXECUTION GUARD: requires a configured Bendahara Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `keuangan.rab.index` renders the active periode's RAB status badge using
 *   `PeriodeStatus::displayName()` => "Belum Dibuka" / "Terbuka" / "Ditutup".
 * - Buka/Tutup controls post to `keuangan.rab.periode.status` and are wrapped in
 *   `@can('buka-tutup-periode')`; the gate is BU/Superadmin only, so a PJ does
 *   NOT see them (TC-REQ-112).
 * - `StoreRabRequest` requires the periode to satisfy
 *   `Rule::exists('periode_haul_akbars','id')->where('status_periode_rab','dibuka')`
 *   => input when the periode is closed fails validation server-side (110/114).
 */

const JOURNEY = 'J-B1 - Kelola Periode RAB (Buka/Tutup)';
const REQUIREMENTS = ['FR-10', 'Bg. 12'];
const ROLE = 'Bendahara Umum';

const DEFERRED_107 =
  'Klik Buka Periode RAB -> status Dibuka + notifikasi N-1: opening the ACTIVE ' +
  'periode mutates shared operational state (PeriodeService::updateStatus) that ' +
  'affects every other actor and cross-journey data; the boundary forbids ' +
  'mutating shared operational data, and the N-1 notification dispatch is not ' +
  'observable from the UI. Deferred.';

const DEFERRED_108 =
  'Input RAB saat Dibuka (dari akun PJ) -> Diterima: requires (a) the active ' +
  'periode to be OPEN (shared-state mutation we must not perform) AND (b) a PJ ' +
  'web session submitting a full RAB. Deferred - precondition not controllable ' +
  'without mutating shared periode state.';

const DEFERRED_109 =
  'Klik Tutup Periode RAB -> status Ditutup + notif N-7: same shared-state ' +
  'mutation constraint as TC-REQ-107 (closing the active periode). Deferred.';

const DEFERRED_110 =
  'Input/ajukan RAB saat Ditutup -> Ditolak (FR-10): needs the active periode to ' +
  'be in DITUTUP state, which we cannot force without mutating shared state. The ' +
  'rule IS enforced server-side (StoreRabRequest exists ... status_periode_rab ' +
  '= dibuka; RabController::create redirects with "Pengajuan RAB tidak dapat ' +
  'dilakukan karena Periode RAB belum dibuka atau sudah ditutup."). Deferred.';

const DEFERRED_111 =
  'Verifikasi periode lain tidak terpengaruh -> status tidak berubah: requires a ' +
  'second periode plus a mutation of the first; cannot be asserted read-only. ' +
  'Deferred.';

const DEFERRED_113 =
  'Tutup periode yang belum dibuka -> Ditolak / status invalid: the transition ' +
  'legality depends on the current DB status of the ACTIVE periode, which is not ' +
  'deterministic for us (and testing it would require mutating it). Deferred.';

const DEFERRED_114 =
  'Input RAB saat periode Belum Dibuka / Ditutup -> Ditolak server-side: same ' +
  'precondition/enforcement as TC-REQ-110 (StoreRabRequest + RabController::' +
  'create guard). Deferred for the same reason.';

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
    testTitle(meta('TC-REQ-106', 'Buka list Periode | EXPECT: Status saat ini tampil (Belum Dibuka/Dibuka/Ditutup)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-106', 'Buka list Periode'), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
      await page.goto('/keuangan/rab');
      await expect(
        page.getByText(/Belum Dibuka|Terbuka|Ditutup/).first()
      ).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-107', 'Klik Buka Periode RAB | EXPECT: Status -> Dibuka; notifikasi N-1 ke PJ & Sekretaris Bidang', DEFERRED_107)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-107', 'Klik Buka Periode RAB', DEFERRED_107), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-108', 'Coba input RAB saat Dibuka (dari akun PJ) | EXPECT: Diterima', DEFERRED_108)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-108', 'Coba input RAB saat Dibuka (dari akun PJ)', DEFERRED_108), {
        requiresSession: true,
        user: pjSeksi(),
      });
      await signIn(loginPage, pjSeksi());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-109', 'Klik Tutup Periode RAB | EXPECT: Status -> Ditutup; notif N-7', DEFERRED_109)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-109', 'Klik Tutup Periode RAB', DEFERRED_109), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-110', 'Coba input/ajukan RAB saat Ditutup | EXPECT: Ditolak (FR-10)', DEFERRED_110)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-110', 'Coba input/ajukan RAB saat Ditutup', DEFERRED_110), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-111', 'Verifikasi periode lain tidak terpengaruh | EXPECT: Status tidak berubah', DEFERRED_111)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-111', 'Verifikasi periode lain tidak terpengaruh', DEFERRED_111), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-112', 'Memastikan sistem menangani kondisi: Buka/tutup oleh non-BU (PJ/Kabid) | EXPECT: Ditolak (hanya BU/Superadmin)')),
    async ({ page, loginPage }) => {
      declareScenario(meta('TC-REQ-112', 'Buka/tutup oleh non-BU (PJ/Kabid)'), {
        requiresSession: true,
        user: pjSeksi(),
      });
      await signIn(loginPage, pjSeksi());
      await page.goto('/keuangan/rab');
      // The buka/tutup controls are gated by @can('buka-tutup-periode'); a PJ must
      // not be offered them.
      await expect(page.getByText('Buka Periode RAB', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Tutup Periode RAB', { exact: true })).toHaveCount(0);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-113', 'Memastikan sistem menangani kondisi: Tutup periode yang belum dibuka | EXPECT: Ditolak / status invalid', DEFERRED_113)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-113', 'Tutup periode yang belum dibuka', DEFERRED_113), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
    }
  );

  authTest(
    testTitle(meta('TC-REQ-114', 'Memastikan sistem menangani kondisi: Input RAB saat periode Belum Dibuka / Ditutup | EXPECT: Ditolak server-side', DEFERRED_114)),
    async ({ loginPage }) => {
      declareScenario(meta('TC-REQ-114', 'Input RAB saat periode Belum Dibuka / Ditutup', DEFERRED_114), {
        requiresSession: true,
        user: bendaharaUmum(),
      });
      await signIn(loginPage, bendaharaUmum());
    }
  );
});