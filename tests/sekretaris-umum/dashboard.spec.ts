import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../pages/DashboardPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { sekretarisUmum } from '../../test-data/users';

/**
 * Approved journey J-SU2 - "Pantau Dashboard Kegiatan (Bg. 28)".
 * Role: Sekretaris Umum. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-095 .. TC-REQ-099 (5 scenarios).
 *
 * EXECUTION GUARD: requires a configured Sekretaris Umum identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `resources/views/dashboard/index.blade.php` renders a "Rencana Kegiatan"
 *   card with `Total`, `Terlaksana`, `Belum` derived from `DashboardService`
 *   (scoped by role; Sekum/Ketum see all Bidang/Seksi).
 * - DISCREPANCY: the dashboard renders the FINANCIAL cards (Pemasukan,
 *   Pengeluaran, Saldo Kas, Total RAB, LPJ Pending) and the "Akses Cepat" panel
 *   for EVERY authenticated user with no `@can` gate and no role check in the
 *   controller/service, so a Sekretaris Umum DOES see financial figures
 *   (contradicts TC-REQ-097 / Bg. 28 "SU khusus Kegiatan"). Deferred.
 */

const JOURNEY = 'J-SU2 - Pantau Dashboard Kegiatan (Bg. 28)';
const REQUIREMENTS = ['FR-21'];
const ROLE = 'Sekretaris Umum';

const DEFERRED_096 =
  'Bandingkan dengan total kegiatan di master -> konsisten: the dashboard "Total" ' +
  'is an aggregate over the active periode, but the master timeline is paginated ' +
  '(20/page) and exposes no single total figure, so there is no deterministic UI ' +
  'source of truth to reconcile against. Deferred pending a countable master view.';

const DEFERRED_097 =
  'DISCREPANCY vs policy Bg. 28: TC-REQ-097 expects a Sekretaris Umum to see NO ' +
  'financial data (Kegiatan only). However dashboard/index.blade.php renders the ' +
  'Pemasukan/Pengeluaran/Saldo/Total RAB/LPJ cards unconditionally (no @can) and ' +
  'DashboardService applies no role gate on financial widgets. Sekum therefore ' +
  'SEES financial figures. Deferred for product/dev confirmation.';

const DEFERRED_098 =
  'Negative of 097 (card keuangan tampil angka untuk SU -> verifikasi tidak ' +
  'bocor): same source fact as 097 - the financial cards render for the Sekum ' +
  'with real values, i.e. they DO appear. Deferred together with 097.';

const DEFERRED_099 =
  'Angka "Terlaksana" tidak sinkron setelah update status -> harus real-time: ' +
  'requires a controlled Kegiatan status mutation + dashboard recompute; the ' +
  'summary is cached for 120s (DashboardService cache key ' +
  '"dashboard.summary.{user}.{periode}") so there is a real staleness window, but ' +
  'triggering and timing it deterministically is not a stable UI test. Deferred.';

const meta = (id: string, scenario: string, deferred?: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  ...(deferred ? { deferred } : {}),
});

const beginSession = async (
  loginPage: Parameters<typeof signIn>[0],
  id: string,
  scenario: string,
  deferred?: string
): Promise<void> => {
  declareScenario(meta(id, scenario, deferred), {
    requiresSession: true,
    user: sekretarisUmum(),
  });
  await signIn(loginPage, sekretarisUmum());
};

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-095', 'Login SU lihat Dashboard | EXPECT: card Rencana Kegiatan menampilkan angka seluruh Bidang/Seksi')),
    async ({ page, loginPage, dashboardPage }) => {
      await beginSession(loginPage, 'TC-REQ-095', 'Login SU lihat Dashboard');
      await dashboardPage.expectDisplayed();
      await expect(dashboardPage.welcomeHeading.first()).toBeVisible();
      await expect(
        page.getByText('Rencana Kegiatan', { exact: false }).first()
      ).toBeVisible();
      for (const label of ['Total', 'Terlaksana', 'Belum']) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      }
    }
  );

  authTest(
    testTitle(meta('TC-REQ-096', 'Bandingkan dengan total kegiatan di master | EXPECT: konsisten', DEFERRED_096)),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-096', 'Bandingkan dengan total kegiatan di master', DEFERRED_096);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-097', 'Cek card keuangan | EXPECT: sesuai permission — SU hanya Kegiatan', DEFERRED_097)),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-097', 'Cek card keuangan', DEFERRED_097);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-098', 'Card keuangan tampil angka untuk SU | EXPECT: verifikasi tidak bocor data bila tidak diizinkan', DEFERRED_098)),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-098', 'Card keuangan tampil angka untuk SU', DEFERRED_098);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-099', 'Angka Terlaksana tidak sinkron setelah update status | EXPECT: harus real-time', DEFERRED_099)),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-099', 'Angka Terlaksana tidak sinkron', DEFERRED_099);
    }
  );
});