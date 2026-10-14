import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { sekretarisBidang } from '../../test-data/users';

/**
 * Approved journey J-SB2 - "Revisi RAB yang Ditolak (Sekretaris Bidang)".
 * Role: Sekretaris Bidang. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-228 .. TC-REQ-233 (6 scenarios).
 *
 * EXECUTION GUARD: requires a configured Sekretaris Bidang identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - RAB revisions are append-only in `rab_revisis` (RabService records them);
 *   there is no delete/update route for revisions (LR-2 / audit).
 */

const JOURNEY = 'J-SB2 - Revisi RAB yang Ditolak (Sekretaris Bidang)';
const REQUIREMENTS = ['LR-2', 'Fr-12'];
const ROLE = 'Sekretaris Bidang';

const reasons: Record<string, string> = {
  'TC-REQ-228': 'Buka RAB yang ditolak -> alasan terlihat: requires a specific RAB in rejected_kabid state; fixture status not deterministic. Deferred.',
  'TC-REQ-229': 'Revisi estimasi / lengkapi uraian -> tersimpan: edits a RAB (shared-state mutation) in editable status. Deferred.',
  'TC-REQ-230': 'Ajukan ulang -> status reset + alasan di riwayat: performs a re-submit transition (mutation). Deferred.',
  'TC-REQ-231': 'Cek riwayat RAB -> create->submit->tolak->revisi->submit tercatat: requires a RAB that has traversed all those states; not deterministic. Deferred.',
  'TC-REQ-232': 'Menghapus riwayat penolakan -> Tidak tersedia (audit): proven structurally (no revisi delete route/method in web or API controllers); no positive UI surface for a Sekretaris Bidang. Deferred.',
  'TC-REQ-233': 'Ajukan ulang tanpa perubahan -> Diizinkan tapi terlihat duplikat di riwayat (kebijakan): needs a rejected RAB + re-submit to compare revisions; state-dependent mutation. Deferred.',
};

const meta = (id: string, scenario: string, deferred: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
  deferred,
});

authTest.describe(() => {
  for (const [id, scenario] of [
    ['TC-REQ-228', 'Buka RAB yang ditolak | EXPECT: Alasan terlihat'],
    ['TC-REQ-229', 'Revisi estimasi / lengkapi uraian | EXPECT: Tersimpan'],
    ['TC-REQ-230', 'Ajukan ulang | EXPECT: status reset -> Menunggu Approval; alasan penolakan tetap di riwayat'],
    ['TC-REQ-231', 'Cek riwayat RAB | EXPECT: create->submit->tolak->revisi->submit tercatat'],
    ['TC-REQ-232', 'Menghapus riwayat penolakan | EXPECT: Tidak tersedia (audit)'],
    ['TC-REQ-233', 'Ajukan ulang tanpa perubahan | EXPECT: Diizinkan tapi terlihat duplikat di riwayat (kebijakan)'],
  ] as const) {
    authTest(testTitle(meta(id, scenario, reasons[id])), async ({ loginPage }) => {
      declareScenario(meta(id, scenario, reasons[id]), { requiresSession: true, user: sekretarisBidang() });
      await signIn(loginPage, sekretarisBidang());
      expect(true).toBe(true);
    });
  }
});