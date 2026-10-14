import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { BackupPage } from '../../pages/BackupPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin } from '../../test-data/users';

/**
 * Approved journey J-S8 - "Pantau & Audit Sistem (LR-7, BK-6, SR-9)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-059 .. TC-REQ-065 (7 scenarios).
 *
 * VERIFIED READINESS (source-grounded here, differs from the assessment for
 * TC-REQ-062): the app has NO audit-log browser page. `ActivityLogService`
 * (`app/Application/Services/ActivityLogService.php`) only WRITES activity
 * rows via `spatie/laravel-activitylog`; there is no controller/view/routes for
 * listing activity, auth, or RAB-revision logs (no `AuditController` exists
 * despite the assessment's evidence column). Only the on-demand BACKUP module
 * is real: `BackupController` provides `/pengaturan/backup` index + `backup.run`
 * (TC-REQ-062) - the assessment marked it "Not Ready" (infra concern), but the
 * application module is implemented and runnable.
 *
 * Therefore 059/060/061/063/064/065 are deferred with exact evidence; 062 is
 * implemented for real (create an on-demand snapshot, then delete it in a
 * best-effort cleanup so no artifact remains).
 *
 * LOGIN THROTTLE: only the real scenario signs in (1 login); deferred
 * scenarios abort (skip) in declareScenario before any sign-in.
 */

const JOURNEY = 'J-S8 - Pantau & Audit Sistem (LR-7, BK-6, SR-9)';
const REQUIREMENTS = [
  'FR-01', 'FR-03', 'FR-04', 'FR-05', 'FR-07', 'LR-1', 'SR-1',
  'UC-1', 'UC-2', 'UC-3', 'LR-5', 'BK-6', 'SR-6', 'LR-7', 'SR-7', 'SR-8', 'SR-9',
];
const ROLE = 'Superadmin';

/** Audit-ledger scenarios: no browser page exists to exercise (feature absent). */
const DEFERRED_AUDIT_PAGE =
  'No audit-log browser page exists in the source: ActivityLogService only ' +
  'writes activity rows (spatie/laravel-activitylog); there is no controller/' +
  'view/routes listing activity, auth, or RAB-revision logs (no AuditController). ' +
  'Deferred per Phase 3 instruction; expected result unchanged.';

/** TC-REQ-063: needs a non-Superadmin/non-BU identity (none configured). */
const DEFERRED_063 =
  DEFERRED_AUDIT_PAGE +
  ' Additionally requires a non-Superadmin/non-BU identity to attempt the page, ' +
  'and no such identity is configured in env for this phase.';

/** TC-REQ-065: infra-level sensitive-data check, not observable through the UI. */
const DEFERRED_065 =
  'SR-7 (sensitive data separated from application error logs) is an infra-level ' +
  'requirement with no UI surface. Deferred; requires a non-UI audit (log ' +
  'retention/redaction review), which is outside this automation phase.';

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

/** Declare the scenario (session-guarded) and sign in as Superadmin. */
const beginSession = async (
  loginPage: Parameters<typeof signIn>[0],
  id: string,
  scenario: string,
  extra: Partial<ScenarioMeta> = {}
): Promise<void> => {
  declareScenario(meta(id, scenario, extra), {
    requiresSession: true,
    user: superadmin(),
  });
  await signIn(loginPage, superadmin());
};

/** Best-effort cleanup - never masks the assertion outcome of a test. */
/**
 * Best-effort cleanup - never masks the assertion outcome of a test, but a
 * failed cleanup is surfaced (console warning + test attachment) so leftover
 * operational data is visible in the report instead of being silently lost.
 * The label is optional; an unlabeled step is numbered for traceability.
 */
let bestEffortSeq = 0;
const bestEffort = async (
  labelOrAction: string | (() => Promise<void>),
  maybeAction?: () => Promise<void>
): Promise<void> => {
  const label =
    typeof labelOrAction === 'string'
      ? labelOrAction
      : `cleanup#${++bestEffortSeq}`;
  const action =
    typeof labelOrAction === 'function' ? labelOrAction : maybeAction!;
  try {
    await action();
  } catch (error) {
    const message =
      error instanceof Error ? error.stack ?? error.message : String(error);
    console.warn(`[bestEffort] "${label}" failed: ${message}`);
    try {
      await authTest.info().attach(`cleanup-failed-${label}`, {
        body: `Cleanup step "${label}" failed:\n\n${message}`,
        contentType: 'text/plain',
      });
    } catch {
      // Attaching is itself best-effort; the test outcome is unaffected.
    }
  }
};

authTest.describe(() => {
  authTest(
    testTitle(
      meta('TC-REQ-059', 'Buka halaman pelacakan log aktivitas', {
        deferred: DEFERRED_AUDIT_PAGE,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-059', 'Buka halaman pelacakan log aktivitas', {
        deferred: DEFERRED_AUDIT_PAGE,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-060', 'Akses log RAB Seksi tertentu | EXPECT: riwayat revisi lengkap & tidak bisa dihapus', {
        deferred: DEFERRED_AUDIT_PAGE,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-060', 'Akses log RAB Seksi tertentu', {
        deferred: DEFERRED_AUDIT_PAGE,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-061', 'Cek log autentikasi | EXPECT: tersimpan minimal 1 tahun (LR-5)', {
        deferred: DEFERRED_AUDIT_PAGE,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-061', 'Cek log autentikasi', {
        deferred: DEFERRED_AUDIT_PAGE,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-062', 'Trigger snapshot manual | EXPECT: backup snapshot dibuat on-demand')
    ),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-062', 'Trigger snapshot manual');

      const backup = new BackupPage(page);
      await backup.goto();
      const before = await backup.rowCount();

      try {
        await backup.createSnapshot();
        await backup.expectSuccess(
          'Snapshot backup database & storage berhasil dibuat.'
        );
        await expect
          .poll(async () => backup.rowCount())
          .toBeGreaterThanOrEqual(before + 1);
      } finally {
        await bestEffort(async () => {
          await backup.goto();
          await backup.deleteNewestIfPresent(before);
        });
      }
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-063', 'User non-Superadmin/non-BU buka halaman audit | EXPECT: ditolak', {
        deferred: DEFERRED_063,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-063', 'User non-Superadmin/non-BU buka halaman audit', {
        deferred: DEFERRED_063,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-064', 'Menghapus/edit riwayat audit (RAB, koreksi) | EXPECT: tidak tersedia (append-only)', {
        deferred: DEFERRED_AUDIT_PAGE,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-064', 'Menghapus/edit riwayat audit (RAB, koreksi)', {
        deferred: DEFERRED_AUDIT_PAGE,
      });
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-065', 'Log error aplikasi berisi data sensitif transaksi | EXPECT: tidak boleh (SR-7)', {
        deferred: DEFERRED_065,
      })
    ),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-065', 'Log error aplikasi berisi data sensitif transaksi', {
        deferred: DEFERRED_065,
      });
    }
  );
});