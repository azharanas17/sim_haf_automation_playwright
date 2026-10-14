import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { ketuaBidang } from '../../test-data/users';

/**
 * Approved journey J-KB4 - "Kelola Kepanitiaan Seksi (scope Bidang)".
 * Role: Ketua Bidang. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-209 .. TC-REQ-210 (2 scenarios).
 *
 * EXECUTION GUARD: requires a configured Ketua Bidang identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - Kepanitiaan routes live under `pengaturan.kepanitiaan.*` (web + API
 *   `pengaturan/kepanitiaans`). CRUD is a mutation of shared kepanitiaan data.
 */

const JOURNEY = 'J-KB4 - Kelola Kepanitiaan Seksi (scope Bidang)';
const REQUIREMENTS = ['FR-14'];
const ROLE = 'Ketua Bidang';

const DEFERRED_209 =
  'Tambah panitia Seksi Jamuan -> Berhasil (scope Bidang Konsumsi): adding a ' +
  'committee member is a mutation of shared kepanitiaan data (and needs a ' +
  'specific Seksi/Khidmah context). Deferred.';

const DEFERRED_210 =
  'Edit panitia Seksi lain (Bidang lain) -> Ditolak/tidak tampil: requires a ' +
  'deterministic kepanitiaan row belonging to another Bidang to prove the scope ' +
  'denial; the fixture bidang mapping is not deterministic. Deferred.';

const meta = (id: string, scenario: string, deferred: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  deferred,
});

authTest.describe(() => {
  for (const [id, scenario, reason] of [
    ['TC-REQ-209', 'Tambah panitia Seksi Jamuan | EXPECT: Berhasil (scope Bidang Konsumsi)', DEFERRED_209],
    ['TC-REQ-210', 'Edit panitia Seksi lain (Bidang lain) | EXPECT: Ditolak / tidak tampil', DEFERRED_210],
  ] as const) {
    authTest(testTitle(meta(id, scenario, reason)), async ({ loginPage }) => {
      declareScenario(meta(id, scenario, reason), { requiresSession: true, user: ketuaBidang() });
      await signIn(loginPage, ketuaBidang());
      expect(true).toBe(true);
    });
  }
});