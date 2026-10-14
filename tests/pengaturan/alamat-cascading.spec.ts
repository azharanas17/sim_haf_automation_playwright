import { expect, Locator } from '@playwright/test';
import { authTest, declareScenario, testTitle } from '../../fixtures/auth.fixture';
import { KepanitiaanPage } from '../../pages/KepanitiaanPage';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { superadmin } from '../../test-data/users';

/**
 * Approved journey J-S4 - "Kelola Alamat Cascading (15.1.5, FR-04)".
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-030 .. TC-REQ-036 (7 scenarios).
 *
 * EXECUTION GUARD: every scenario needs an authenticated Superadmin session.
 * No application execution is authorized in this phase; these tests are
 * registered and traceable and become runnable once the environment + session
 * are available.
 */

const JOURNEY = 'J-S4 - Kelola Alamat Cascading (15.1.5, FR-04)';
const REQUIREMENTS = ['FR-04', '15.1.5'];
const ROLE = 'Superadmin';

/**
 * Verified blocker (development source, not the readiness doc):
 * `AlamatController` exposes ONLY read-only cascade lookups
 * (`routes/web.php` -> `alamat.provinsis/kotas/kecamatans`); there is no
 * create/update/delete route or view for Provinsi/Kota/Kecamatan, so the
 * workbook CRUD outcomes cannot be exercised through the application.
 */
const DEFERRED_NO_CRUD =
  'Blocked (source evidence: routes/web.php alamat.provinsis/kotas/kecamatans ' +
  '-> AlamatController, read-only JSON lookups). No development route/view exists ' +
  'to create or delete address entities; the readiness doc marked these Ready, but ' +
  'the CRUD surface is absent. Script retained for when the feature ships.';

const DEFERRED_035 = `${DEFERRED_NO_CRUD} Duplicate-name handling / wilayah code management is additionally not evidenced.`;
const DEFERRED_036 = `${DEFERRED_NO_CRUD} FK restraint when deleting an address in use by Kepanitiaan is not evidenced.`;

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

/** First usable (non-placeholder) option label of a cascade select. */
const firstOptionLabel = async (select: Locator): Promise<string> => {
  const opts = await select.locator('option').all();
  for (const o of opts.slice(1)) {
    const text = (await o.textContent()) ?? '';
    if (text.trim()) return text.trim();
  }
  throw new Error('No selectable cascade option available.');
};

authTest.describe(`Alamat Cascading - ${JOURNEY}`, () => {
  authTest(
    testTitle(meta('TC-REQ-030', 'Tambah Provinsi (Jawa Timur)', { deferred: DEFERRED_NO_CRUD })),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan".
      await beginSession(loginPage, 'TC-REQ-030', 'Tambah Provinsi (Jawa Timur)', {
        deferred: DEFERRED_NO_CRUD,
      });
      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();
      // Retained implementation: assert province is selectable on the cascade.
      await expect(kep.provinsiSelect).toBeEnabled();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-031', 'Tambah Kota di bawahnya (Surabaya)', { deferred: DEFERRED_NO_CRUD })),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan & terkait".
      await beginSession(loginPage, 'TC-REQ-031', 'Tambah Kota di bawahnya (Surabaya)', {
        deferred: DEFERRED_NO_CRUD,
      });
      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();
      await expect(kep.provinsiSelect).toBeEnabled();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-032', 'Tambah Kecamatan (Sukolilo)', { deferred: DEFERRED_NO_CRUD })),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Tersimpan".
      await beginSession(loginPage, 'TC-REQ-032', 'Tambah Kecamatan (Sukolilo)', {
        deferred: DEFERRED_NO_CRUD,
      });
      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();
      await expect(kep.kecamatanSelect).toBeDisabled();
    }
  );

  authTest(
    testTitle(meta('TC-REQ-033', 'Cek dropdown cascading di form Kepanitiaan')),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Pilihan anak mengikuti induk".
      await beginSession(loginPage, 'TC-REQ-033', 'Cek dropdown cascading di form Kepanitiaan');

      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();

      // Province is the root: enabled with server-rendered options.
      await expect(kep.provinsiSelect).toBeEnabled();
      const provinsi = await firstOptionLabel(kep.provinsiSelect);
      await kep.provinsiSelect.selectOption({ label: provinsi });

      // City options appear only after the province is chosen (child follows parent).
      await expect(kep.kotaSelect).toBeEnabled();
      await expect
        .poll(() => kep.kotaSelect.locator('option').count(), {
          message: 'Kota options should load after selecting a Province',
        })
        .toBeGreaterThan(1);
      const kota = await firstOptionLabel(kep.kotaSelect);
      await kep.kotaSelect.selectOption({ label: kota });

      // District options appear only after the city is chosen.
      await expect(kep.kecamatanSelect).toBeEnabled();
      await expect
        .poll(() => kep.kecamatanSelect.locator('option').count(), {
          message: 'Kecamatan options should load after selecting a City',
        })
        .toBeGreaterThan(1);
      const kecamatan = await firstOptionLabel(kep.kecamatanSelect);
      await expect(kep.kecamatanSelect.locator('option', { hasText: kecamatan })).not.toHaveCount(0);
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-034', 'Memastikan sistem menangani kondisi: Memilih Kecamatan tanpa memilih Kota')
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Pilihan Kecamatan tidak tersedia (dependent)".
      await beginSession(
        loginPage,
        'TC-REQ-034',
        'Memastikan sistem menangani kondisi: Memilih Kecamatan tanpa memilih Kota'
      );

      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();

      // Nothing selected yet: both children are disabled and carry no options.
      await expect(kep.kotaSelect).toBeDisabled();
      await expect(kep.kecamatanSelect).toBeDisabled();
      expect(await kep.kecamatanSelect.locator('option').count()).toBe(1); // placeholder only

      // Selecting a province enables the city, but the district stays locked
      // until a city is chosen - a district cannot be picked without its parent.
      const provinsi = await firstOptionLabel(kep.provinsiSelect);
      await kep.provinsiSelect.selectOption({ label: provinsi });
      await expect(kep.kotaSelect).toBeEnabled();
      await expect(kep.kecamatanSelect).toBeDisabled();
      await expect
        .poll(() => kep.kecamatanSelect.locator('option').count())
        .toBe(1);
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-035',
        'Memastikan sistem menangani kondisi: Duplikat nama pada level yang sama',
        { deferred: DEFERRED_035 }
      )
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Ditolak / dikelola dengan kode wilayah".
      await beginSession(
        loginPage,
        'TC-REQ-035',
        'Memastikan sistem menangani kondisi: Duplikat nama pada level yang sama',
        { deferred: DEFERRED_035 }
      );
      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();
      await expect(kep.provinsiSelect).toBeEnabled();
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-036',
        'Memastikan sistem menangani kondisi: Alamat dipakai oleh Kepanitiaan lalu dihapus',
        { deferred: DEFERRED_036 }
      )
    ),
    async ({ page, loginPage }) => {
      // Workbook expected result: "Diblokir (FK)".
      await beginSession(
        loginPage,
        'TC-REQ-036',
        'Memastikan sistem menangani kondisi: Alamat dipakai oleh Kepanitiaan lalu dihapus',
        { deferred: DEFERRED_036 }
      );
      const kep = new KepanitiaanPage(page);
      await kep.gotoCreate();
      await expect(kep.kecamatanSelect).toBeDisabled();
    }
  );
});