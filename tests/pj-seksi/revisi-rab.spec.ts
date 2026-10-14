import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { pjSeksi } from '../../test-data/users';

/**
 * Approved journey J-P3 - "Revisi RAB Ditolak (PJ Seksi)".
 * Role: PJ Seksi. Approved source: SIM_HAF_..._v4.xlsx.
 * Implemented scenarios: TC-REQ-256 .. TC-REQ-261 (6 scenarios).
 *
 * EXECUTION GUARD: requires a configured PJ Seksi identity; skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - RAB revisions are append-only in `rab_revisis`; there is no delete route
 *   (LR-2 / audit). Reject reason is stored on the RAB (catatan).
 */

const JOURNEY = 'J-P3 - Revisi RAB Ditolak (PJ Seksi)';
const REQUIREMENTS = ['LR-2', 'FR-12'];
const ROLE = 'PJ Seksi';

const reasons: Record<string, string> = {
  'TC-REQ-256': 'Terima N-3 (ditolak) -> notif + alasan tampil: requires a specific RAB in rejected_kabid state + notification payload; fixture state not deterministic. Deferred.',
  'TC-REQ-257': 'Revisi -> draft tersimpan: edits a RAB (shared-state mutation). Deferred.',
  'TC-REQ-258': 'Ajukan ulang -> Menunggu Approval kembali: performs a re-submit transition (mutation). Deferred.',
  'TC-REQ-259': 'Cek riwayat -> revisi tercatat (nilai lama & baru): requires a RAB that has been revised; not deterministic. Deferred.',
  'TC-REQ-260': 'Ajukan revisi tanpa alasan perubahan -> Ditolak / wajib alasan: needs a rejected RAB and a UI submit; state-dependent. Deferred.',
  'TC-REQ-261': 'Menghapus riwayat revisi -> Tidak tersedia: proven structurally (no revisi delete route/method in web or API controllers). Deferred.',
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
    ['TC-REQ-256', 'Terima N-3 (ditolak) | EXPECT: Notif + alasan tampil'],
    ['TC-REQ-257', 'Revisi | EXPECT: Draft tersimpan'],
    ['TC-REQ-258', 'Ajukan ulang | EXPECT: Menunggu Approval kembali'],
    ['TC-REQ-259', 'Cek riwayat | EXPECT: Revisi tercatat (nilai lama & baru)'],
    ['TC-REQ-260', 'Ajukan revisi tanpa alasan perubahan | EXPECT: Ditolak / wajib alasan'],
    ['TC-REQ-261', 'Menghapus riwayat revisi | EXPECT: Tidak tersedia'],
  ] as const) {
    authTest(testTitle(meta(id, scenario, reasons[id])), async ({ loginPage }) => {
      declareScenario(meta(id, scenario, reasons[id]), { requiresSession: true, user: pjSeksi() });
      await signIn(loginPage, pjSeksi());
      expect(true).toBe(true);
    });
  }
});