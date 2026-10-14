import { APIRequestContext, expect } from '@playwright/test';
import { User } from '../test-data/users';

/**
 * Shared helpers for API-based authorization checks (negative matrix).
 *
 * These log in through the public API (`POST /api/v1/auth/login`) to obtain a
 * bearer token, then attempt mutations that MUST be denied for the given role.
 * Using the real login endpoint keeps us inside the app's auth stack (no
 * bypass); 403 responses from `$this->authorize(...)` are the proof of denial.
 */
export const API_PREFIX = '/api/v1';

export const jsonHeaders = (token?: string): Record<string, string> => ({
  Accept: 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/** Log in via the public API and return the bearer token. */
export const apiLogin = async (
  request: APIRequestContext,
  user: User
): Promise<string> => {
  const res = await request.post(`${API_PREFIX}/auth/login`, {
    data: { email: user.email, password: user.password },
    headers: { Accept: 'application/json' },
    failOnStatusCode: false,
  });
  expect(
    res.status(),
    `API login must succeed for role "${user.role}"`
  ).toBe(200);
  return (await res.json()).data.token as string;
};

/** Extract the first resource id from a Laravel index payload (best effort). */
export const firstResourceId = (payload: unknown): number | undefined => {
  const root = payload as { data?: unknown };
  const inner = root?.data as { data?: unknown } | undefined;
  const arr: { id?: number }[] = Array.isArray(root?.data)
    ? (root.data as { id?: number }[])
    : Array.isArray(inner?.data)
      ? (inner!.data as { id?: number }[])
      : [];
  return arr[0]?.id;
};

/** Read the first resource id of an index endpoint (returns undefined on error/empty). */
export const firstIndexId = async (
  request: APIRequestContext,
  token: string,
  apiPath: string
): Promise<number | undefined> => {
  const res = await request.get(`${API_PREFIX}${apiPath}`, {
    headers: jsonHeaders(token),
    failOnStatusCode: false,
  });
  return res.ok() ? firstResourceId(await res.json()) : undefined;
};

export interface PenerimaanKasDenialPayload {
  periode_haul_akbar_id: number;
  tanggal_transaksi: string;
  akun_penerimaan_id: number;
  nominal: number;
  disetor_oleh: string;
  channel: 'transfer' | 'tunai';
}

export interface PengeluaranKasDenialPayload {
  periode_haul_akbar_id: number;
  tanggal_transaksi: string;
  bidang_id: number;
  khidmah_id: number;
  akun_pengeluaran_id: number;
  sub_agenda: string;
  uraian: string;
  qty: number;
  satuan: string;
  harga_satuan: number;
  dibayarkan_ke: string;
}

/**
 * Build a schema-valid Penerimaan Kas create payload.
 *
 * A non-privileged role is denied by the POLICY only AFTER FormRequest
 * validation passes, so a placeholder body (e.g. `{ jumlah: 1000 }`) yields a
 * 422 validation error instead of the intended 403. Every required rule,
 * including the `exists` FK checks, must therefore be satisfied. Master data is
 * read through endpoints the caller is allowed to see (periode + akun indexes
 * are `viewAny`). Returns undefined when that master data is unavailable so the
 * caller can skip rather than assert on a validation error.
 */
export const resolvePenerimaanKasDenialPayload = async (
  request: APIRequestContext,
  token: string
): Promise<PenerimaanKasDenialPayload | undefined> => {
  const [periodeId, akunId] = await Promise.all([
    firstIndexId(request, token, '/pengaturan/periodes'),
    firstIndexId(request, token, '/keuangan/akun-penerimaan'),
  ]);
  if (!periodeId || !akunId) return undefined;
  return {
    periode_haul_akbar_id: periodeId,
    tanggal_transaksi: new Date().toISOString().slice(0, 10),
    akun_penerimaan_id: akunId,
    nominal: 1000,
    disetor_oleh: 'QA UAT (denial probe)',
    channel: 'tunai',
  };
};

/**
 * Build a schema-valid Pengeluaran Kas create payload (mirrors the
 * `resolvePenerimaanKasDenialPayload` contract). `foto_nota` is mandatory and
 * supplied separately as a multipart file by the caller.
 */
export const resolvePengeluaranKasDenialPayload = async (
  request: APIRequestContext,
  token: string
): Promise<PengeluaranKasDenialPayload | undefined> => {
  const [periodeId, bidangId, khidmahId, akunId] = await Promise.all([
    firstIndexId(request, token, '/pengaturan/periodes'),
    firstIndexId(request, token, '/pengaturan/bidangs'),
    firstIndexId(request, token, '/pengaturan/khidmahs'),
    firstIndexId(request, token, '/keuangan/akun-pengeluaran'),
  ]);
  if (!periodeId || !bidangId || !khidmahId || !akunId) return undefined;
  return {
    periode_haul_akbar_id: periodeId,
    tanggal_transaksi: new Date().toISOString().slice(0, 10),
    bidang_id: bidangId,
    khidmah_id: khidmahId,
    akun_pengeluaran_id: akunId,
    sub_agenda: 'umum',
    uraian: 'QA UAT (denial probe)',
    qty: 1,
    satuan: 'unit',
    harga_satuan: 1000,
    dibayarkan_ke: 'QA UAT (denial probe)',
  };
};

/** A 1x1 transparent PNG, used where an image upload is mandatory. */
export const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
