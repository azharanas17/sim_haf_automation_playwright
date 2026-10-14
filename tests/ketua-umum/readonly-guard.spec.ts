import { APIRequestContext, expect } from '@playwright/test';
import {
  authTest,
  declareScenario,
  testTitle,
} from '../../fixtures/auth.fixture';
import { signIn } from '../../utils/session';
import { ScenarioMeta } from '../../utils/helpers';
import { ketuaUmum } from '../../test-data/users';
import {
  resolvePenerimaanKasDenialPayload,
  resolvePengeluaranKasDenialPayload,
  ONE_BY_ONE_PNG,
} from '../../utils/api';

/**
 * Approved journey J-K3 - "Verifikasi Read-Only Semua Modul (Bg. 8.3)".
 *
 * Role: Ketua Umum. Approved source:
 * SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (SCENARIOS).
 * Implemented scenarios: TC-REQ-078 .. TC-REQ-083 (6 scenarios).
 *
 * EXECUTION GUARD: requires a configured Ketua Umum identity
 * (env UAT_EMAIL_KETUA_UMUM / UAT_PASSWORD_KETUA_UMUM); skips otherwise.
 *
 * VERIFIED READINESS (source-grounded):
 * - `PenerimaanKasPolicy::create/update/delete` include only SUPERADMIN and
 *   BENDAHARA_UMUM (+ others, NOT Ketua Umum) -> a KU is denied mutation.
 * - `RabPolicy::create` excludes KU; `approveKabid` requires KETUA_BIDANG and
 *   `approveBU` requires SUPERADMIN/BENDAHARA_UMUM -> KU cannot approve RAB.
 * - API (`routes/api.php`) is guarded by `auth:sanctum`; `POST /api/v1/auth/login`
 *   returns a bearer token. Mutation endpoints call `$this->authorize(...)`, so a
 *   KU token must receive HTTP 403 (VR: TC-REQ-079).
 * - Web index view gates the create link with `@can('create', PenerimaanKas::class)`,
 *   so the "Tambah" control is absent for the KU (read-only UI, TC-REQ-078).
 */

const JOURNEY = 'J-K3 - Verifikasi Read-Only Semua Modul (Bg. 8.3)';
const REQUIREMENTS = ['FR-06', 'UC-19', 'UC-20', 'FR-21', 'FR-22'];
const ROLE = 'Ketua Umum';

const API = '/api/v1';

const meta = (id: string, scenario: string): ScenarioMeta => ({
  id,
  scenario,
  requirementIds: REQUIREMENTS,
  journey: JOURNEY,
  role: ROLE,
});

/** Declare the scenario (guarded) and sign in to the web app as Ketua Umum. */
const beginWebSession = async (
  loginPage: Parameters<typeof signIn>[0],
  id: string,
  scenario: string
): Promise<void> => {
  declareScenario(meta(id, scenario), {
    requiresSession: true,
    user: ketuaUmum(),
  });
  await signIn(loginPage, ketuaUmum());
};

type Api = APIRequestContext;

/** Log in through the public API and return the bearer token. */
const apiLogin = async (request: Api): Promise<string> => {
  const user = ketuaUmum();
  const res = await request.post(`${API}/auth/login`, {
    data: { email: user.email, password: user.password },
    headers: { Accept: 'application/json' },
    failOnStatusCode: false,
  });
  expect(res.status(), 'API login must succeed for the KU identity').toBe(200);
  return (await res.json()).data.token as string;
};

/** Best-effort first resource id from a Laravel index payload. */
const firstId = (payload: unknown): number | undefined => {
  const root = payload as { data?: unknown };
  const arr = Array.isArray(root?.data)
    ? (root.data as { id?: number }[])
    : Array.isArray((root?.data as { data?: unknown })?.data)
      ? ((root.data as { data: { id?: number }[] }).data ?? [])
      : [];
  return arr[0]?.id;
};

authTest.describe(() => {
  authTest(
    testTitle(
      meta(
        'TC-REQ-078',
        'Sampling menu | EXPECT: tombol tambah/edit/approve tidak ada / disabled untuk KU (read-only)'
      )
    ),
    async ({ page, loginPage }) => {
      await beginWebSession(loginPage, 'TC-REQ-078', 'Sampling menu');

      // Sample a mutation-capable module; the KU must NOT be offered the create
      // affordance (PenerimaanKasPolicy::create excludes Ketua Umum).
      await page.goto('/keuangan/penerimaan-kas');
      await expect(
        page.getByRole('heading', { name: 'Penerimaan Kas', exact: true })
      ).toBeVisible();
      await expect(
        page.locator('a[href*="penerimaan-kas/create"]')
      ).toHaveCount(0);
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-079',
        'Coba akses API transaksi (POST) via token KU | EXPECT: ditolak (403) - policy/authorize'
      )
    ),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-079', 'Coba akses API transaksi (POST)'), {
        requiresCredentials: true,
        user: ketuaUmum(),
      });
      const token = await apiLogin(request);
      const payload = await resolvePenerimaanKasDenialPayload(request, token);
      authTest.skip(
        !payload,
        'No master data (periode/akun penerimaan) to build a schema-valid payload; the policy denial cannot be reached.'
      );
      const res = await request.post(`${API}/keuangan/penerimaan-kas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        data: payload,
        failOnStatusCode: false,
      });
      expect(res.status(), 'KU POST penerimaan-kas must be forbidden').toBe(403);
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-080', 'Coba approve RAB | EXPECT: ditolak')
    ),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-080', 'Coba approve RAB'), {
        requiresCredentials: true,
        user: ketuaUmum(),
      });
      const token = await apiLogin(request);
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const list = await request.get(`${API}/keuangan/rabs`, {
        headers,
        failOnStatusCode: false,
      });
      const id = list.ok() ? firstId(await list.json()) : undefined;
      const res = await request.patch(`${API}/keuangan/rabs/${id ?? 1}/status`, {
        headers,
        data: { status: 'approved_kabid' },
        failOnStatusCode: false,
      });
      // KU is neither Ketua Bidang nor Bendahara Umum: approval is rejected.
      expect([403, 404]).toContain(res.status());
    }
  );

  authTest(
    testTitle(
      meta('TC-REQ-081', 'Coba hapus data | EXPECT: ditolak')
    ),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-081', 'Coba hapus data'), {
        requiresCredentials: true,
        user: ketuaUmum(),
      });
      const token = await apiLogin(request);
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const list = await request.get(`${API}/keuangan/penerimaan-kas`, {
        headers,
        failOnStatusCode: false,
      });
      const id = list.ok() ? firstId(await list.json()) : undefined;
      const res = await request.delete(
        `${API}/keuangan/penerimaan-kas/${id ?? 1}`,
        { headers, failOnStatusCode: false }
      );
      expect([403, 404]).toContain(res.status());
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-082',
        'KU bisa mengubah/menghapus data | EXPECT: defect - harus ditolak (read-only, permission matrix)'
      )
    ),
    async ({ request }) => {
      declareScenario(
        meta('TC-REQ-082', 'KU bisa mengubah/menghapus data'),
        { requiresCredentials: true, user: ketuaUmum() }
      );
      const token = await apiLogin(request);
      // Attempt a create (mutation) on a second keuangan resource; KU must be
      // forbidden -> proves the KU is read-only across modules. The payload is
      // schema-valid so the request reaches the POLICY (an invalid body would
      // short-circuit at validation with 422 before authorization runs).
      const payload = await resolvePengeluaranKasDenialPayload(request, token);
      authTest.skip(
        !payload,
        'No master data (periode/bidang/khidmah/akun) to build a schema-valid payload; the policy denial cannot be reached.'
      );
      const probe = payload!;
      const res = await request.post(`${API}/keuangan/pengeluaran-kas`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        multipart: {
          periode_haul_akbar_id: String(probe.periode_haul_akbar_id),
          tanggal_transaksi: probe.tanggal_transaksi,
          bidang_id: String(probe.bidang_id),
          khidmah_id: String(probe.khidmah_id),
          akun_pengeluaran_id: String(probe.akun_pengeluaran_id),
          sub_agenda: probe.sub_agenda,
          uraian: probe.uraian,
          qty: String(probe.qty),
          satuan: probe.satuan,
          harga_satuan: String(probe.harga_satuan),
          dibayarkan_ke: probe.dibayarkan_ke,
          foto_nota: {
            name: 'qa-denial-probe.png',
            mimeType: 'image/png',
            buffer: ONE_BY_ONE_PNG,
          },
        },
        failOnStatusCode: false,
      });
      expect(res.status(), 'KU POST pengeluaran-kas must be forbidden').toBe(403);
    }
  );

  authTest(
    testTitle(
      meta(
        'TC-REQ-083',
        'KU bisa approve RAB/LPJ | EXPECT: ditolak (hanya Kabid/BU)'
      )
    ),
    async ({ request }) => {
      declareScenario(meta('TC-REQ-083', 'KU bisa approve RAB/LPJ'), {
        requiresCredentials: true,
        user: ketuaUmum(),
      });
      const token = await apiLogin(request);
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const list = await request.get(`${API}/keuangan/lpjs`, {
        headers,
        failOnStatusCode: false,
      });
      const id = list.ok() ? firstId(await list.json()) : undefined;
      const res = await request.patch(`${API}/keuangan/lpjs/${id ?? 1}/status`, {
        headers,
        data: { status: 'approved_kabid' },
        failOnStatusCode: false,
      });
      expect([403, 404]).toContain(res.status());
    }
  );
});