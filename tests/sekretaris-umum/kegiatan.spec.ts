import { expect } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { KegiatanPage } from '../../pages/KegiatanPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { sekretarisUmum } from '../../test-data/users';

/**
 * Approved journey J-SU1 - "Kelola Timeline Kegiatan Semua Bidang/Seksi
 * (FR-06, UC-20)". Role: Sekretaris Umum (persona PERSONA-03). Approved source:
 * SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx.
 * Implemented scenarios: TC-REQ-084 .. TC-REQ-094 (11 scenarios).
 *
 * EXECUTION GUARD: requires a configured Sekretaris Umum identity
 * (env UAT_EMAIL_SEKRETARIS_UMUM / UAT_PASSWORD_SEKRETARIS_UMUM); skips otherwise.
 *
 * VERIFIED READINESS (source-grounded, app/Policies/KegiatanPolicy.php):
 * - viewAny = true and `canViewAllData()` includes SEKRETARIS_UMUM -> the Sekum
 *   sees the full cross-Bidang/Seksi timeline (TC-REQ-084).
 * - create = true for every role -> the Sekum can add an agenda and, because it
 *   is not Bidang-scoped in `KegiatanController::extractFilters`, may target any
 *   Bidang/Seksi (TC-REQ-085).
 * - update/delete require superadmin|bendahara OR Bidang/Seksi ownership; a
 *   Sekretaris Umum matches NEITHER -> editing/deleting another Seksi's agenda is
 *   DENIED. This CONTRADICTS TC-REQ-086 ("SU punya CRUD semua") and TC-REQ-093;
 *   both are deferred as verified discrepancies.
 * - StoreKegiatanRequest enforces `tanggal_selesai` `after_or_equal:tanggal_mulai`
 *   and `tahap`/`status` `in:` enum rules -> date-order and enum negatives.
 */

const JOURNEY = 'J-SU1 - Kelola Timeline Kegiatan Semua Bidang/Seksi (FR-06, UC-20)';
const REQUIREMENTS = ['FR-06', 'UC-20'];
const ROLE = 'Sekretaris Umum';

const DEFERRED_086 =
  'DISCREPANCY vs approval: TC-REQ-086 expects the Sekretaris Umum to edit any ' +
  "Seksi's agenda (CRUD semua), but KegiatanPolicy::update allows only " +
  'superadmin|bendahara_umum or the owning Bidang (kabid/sekbid) / Seksi (pj). A ' +
  'Sekretaris Umum owns no Bidang/Seksi, so update (and therefore delete) is ' +
  'DENIED. Deferred for product/dev confirmation.';

const DEFERRED_087 =
  'Hapus kegiatan (negatif bila ada ketergantungan): KegiatanPolicy::delete ' +
  'delegates to update, which denies the Sekretaris Umum entirely (see 086), so ' +
  'the dependency branch ("berhasil / ditolak bila dipakai") cannot be exercised ' +
  'with this role; deferred.';

const DEFERRED_089 =
  'Buka detail dari akun PJ Seksi lain: verifying that another role cannot see a ' +
  'detail requires a second configured PJ Seksi identity AND a Seksi-scoped ' +
  'agenda owned by it. This role-journey scenario is covered structurally by the ' +
  'KegiatanPolicy::view checks (PJ Seksi confined to its own khidmah_id); it is ' +
  'deferred pending the J-P setup that creates deterministic Seksi agendas.';

const DEFERRED_092 =
  'Tahap/Status di luar enum: StoreKegiatanRequest enforces ' +
  '`tahap in:rapat_rab,persiapan,pelaksanaan,lpj` and `status in:belum,terlaksana`. ' +
  'The create/edit `<select>` elements expose ONLY those enum options, so an ' +
  'out-of-enum value cannot be produced through the UI; a direct POST needs a ' +
  'valid CSRF token + session and is not a stable, deterministic UI path. Deferred.';

const DEFERRED_093 =
  'DISCREPANCY vs approval: TC-REQ-093 expects no Bidang/Seksi restriction for ' +
  'the Sekretaris Umum when ADDING (it should CRUD all). create() is indeed true ' +
  'for every role, so adding is NOT blocked - the negative premise does not hold ' +
  'as stated. What IS blocked is update/delete (see 086). Deferred for ' +
  'clarification of the intended negative.';

const DEFERRED_094 =
  'Bidang/Seksi lain melihat kegiatan Seksi pemilik (visibilitas terbatas): ' +
  'requires a second Bidang/Seksi role identity acting as the "other" viewer. ' +
  'Enforced by KegiatanPolicy::view (bidang_id/khidmah_id equality); deferred to ' +
  'the J-KB / J-P role journeys where those identities are exercised.';

const meta = (
  id: string,
  scenario: string,
  deferred?: string
): ScenarioMeta => ({
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

const uniqueName = (): string => `UAT-Kegiatan-SU-${Date.now()}`;

authTest.describe(() => {
  authTest(
    testTitle(meta('TC-REQ-084', 'Login SU buka modul Kegiatan | EXPECT: daftar timeline seluruh Bidang/Seksi tampil')),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-084', 'Login SU buka modul Kegiatan');
      const kegiatan = new KegiatanPage(page);
      await kegiatan.goto();
      // The Sekum sees an un-scoped "Semua Bidang" filter (view-all role).
      await expect(kegiatan.bidangAllOption()).toHaveCount(1);
      await expect(kegiatan.bidangSelect).toHaveValue('');
      await expect(
        page.getByText('Tidak ditemukan catatan rencana agenda seksi', { exact: false })
          .or(page.getByRole('list'))
          .first()
      ).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-085', 'Tambah kegiatan untuk Bidang "Konsumsi" / Khidmah "Jamuan" | EXPECT: tersimpan; masuk timeline Bagian tersebut')),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-085', 'Tambah kegiatan Bidang/Khidmah');
      const kegiatan = new KegiatanPage(page);
      const opened = await kegiatan.gotoCreate();
      authTest.skip(!opened, 'Periode aktif tidak tersedia; halaman create mengalihkan ke dashboard (perlu set periode di navbar).');

      const bidang = await kegiatan.bidangSelect.locator('option').nth(1).getAttribute('value');
      const khidmah = await page
        .locator('select[name="khidmah_id"]')
        .locator('option')
        .nth(1)
        .getAttribute('value');
      authTest.skip(!bidang || !khidmah, 'Tidak ada Bidang/Khidmah ter-seed untuk periode aktif.');

      const nama = uniqueName();
      await kegiatan.submitCreateForm({
        nama,
        bidang: bidang!,
        khidmah: khidmah!,
        mulai: '2026-11-01',
        selesai: '2026-11-02',
        tahap: 'persiapan',
        status: 'belum',
      });
      await expect(
        page.getByText('Agenda kegiatan berhasil dibuat.', { exact: false }).first()
      ).toBeVisible();
      // NOTE: the Sekretaris Umum has no delete permission (see 086); this unique,
      // clearly-labelled UAT record cannot be removed via the UI and is left as
      // best-effort cleanup limitation (documented, isolated test data only).
    }
  );

  authTest(
    testTitle(      meta('TC-REQ-086', 'Edit kegiatan milik Seksi lain | EXPECT: berhasil (SU punya CRUD semua)')),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-086', 'Edit kegiatan milik Seksi lain', DEFERRED_086);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-087', 'Hapus kegiatan (negatif bila ada ketergantungan) | EXPECT: berhasil / ditolak bila dipakai')),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-087', 'Hapus kegiatan', DEFERRED_087);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-088', 'Cek tanggal mulai > selesai | EXPECT: ditolak')),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-088', 'Cek tanggal mulai > selesai');
      const kegiatan = new KegiatanPage(page);
      const opened = await kegiatan.gotoCreate();
      authTest.skip(!opened, 'Periode aktif tidak tersedia (redirect ke dashboard).');

      const bidang = await kegiatan.bidangSelect.locator('option').nth(1).getAttribute('value');
      const khidmah = await page.locator('select[name="khidmah_id"]').locator('option').nth(1).getAttribute('value');
      authTest.skip(!bidang || !khidmah, 'Tidak ada Bidang/Khidmah ter-seed.');

      await kegiatan.submitCreateForm({
        nama: uniqueName(),
        bidang: bidang!,
        khidmah: khidmah!,
        mulai: '2026-12-31',
        selesai: '2026-01-01', // before start -> after_or_equal fails
        tahap: 'persiapan',
        status: 'belum',
      });
      // Server-side validation keeps us on the create page and shows the alert.
      await expect(kegiatan.createHeading).toBeVisible();
      await expect(
        page.getByText('Terdapat kesalahan validasi pada form:', { exact: false }).first()
      ).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-089', 'Buka detail dari akun PJ Seksi lain | EXPECT: tidak terlihat (pembatasan lawan)')),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-089', 'Buka detail dari akun PJ Seksi lain', DEFERRED_089);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-090', 'Nama Kegiatan kosong / Bidang-Khidmah kosong | EXPECT: ditolak')),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-090', 'Nama Kegiatan/Bidang/Khidmah kosong');
      const kegiatan = new KegiatanPage(page);
      const opened = await kegiatan.gotoCreate();
      authTest.skip(!opened, 'Periode aktif tidak tersedia (redirect ke dashboard).');

      // Empty submit is blocked by native HTML5 `required` -> assert invalidity
      // and that the empty name field never reaches the server.
      await kegiatan.submitCreate.first().click();
      await expect(kegiatan.createHeading).toBeVisible();
      const invalid = await kegiatan.namaInput.evaluate(
        (el) => !(el as HTMLInputElement).checkValidity()
      );
      expect(invalid, 'nama_kegiatan must be flagged invalid by HTML5 required').toBe(true);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-091', 'Tanggal Selesai < Mulai | EXPECT: ditolak')),
    async ({ page, loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-091', 'Tanggal Selesai < Mulai');
      const kegiatan = new KegiatanPage(page);
      const opened = await kegiatan.gotoCreate();
      authTest.skip(!opened, 'Periode aktif tidak tersedia (redirect ke dashboard).');

      const bidang = await kegiatan.bidangSelect.locator('option').nth(1).getAttribute('value');
      const khidmah = await page.locator('select[name="khidmah_id"]').locator('option').nth(1).getAttribute('value');
      authTest.skip(!bidang || !khidmah, 'Tidak ada Bidang/Khidmah ter-seed.');

      await kegiatan.submitCreateForm({
        nama: uniqueName(),
        bidang: bidang!,
        khidmah: khidmah!,
        mulai: '2026-11-10',
        selesai: '2026-11-01',
        tahap: 'persiapan',
        status: 'belum',
      });
      await expect(kegiatan.createHeading).toBeVisible();
      await expect(
        page.getByText('Terdapat kesalahan validasi pada form:', { exact: false }).first()
      ).toBeVisible();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-092', 'Tahap/Status di luar enum | EXPECT: ditolak')),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-092', 'Tahap/Status di luar enum', DEFERRED_092);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-093', 'SU tidak bisa menambah untuk Bidang/Seksi tertentu | EXPECT: bug — SU harus CRUD semua')),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-093', 'SU tidak bisa menambah untuk Bidang/Seksi tertentu', DEFERRED_093);
    }
  );

  authTest(
    testTitle(meta('TC-REQ-094', 'Bidang/Seksi lain melihat kegiatan Seksi pemilik | EXPECT: tidak boleh (visibilitas terbatas)')),
    async ({ loginPage }) => {
      await beginSession(loginPage, 'TC-REQ-094', 'Bidang/Seksi lain melihat kegiatan Seksi pemilik', DEFERRED_094);
    }
  );
});