/**
 * Test data for approved journey J-S3
 * "Kelola Haul Akbar & Periode (UC-3, FR-01, 15.1.3-15.1.4)".
 *
 * Entities are generated with a unique suffix so repeated runs never collide
 * with UAT fixture data or with prior runs. The active Haul Akbar context is
 * established by the authentication journey (J-S1); the Periode list is scoped
 * to that active Haul Akbar (`PeriodeController::index` ->
 * `session('active_haul_akbar_id')`).
 *
 * User-visible messages below are taken verbatim from the development source
 * (controllers / form requests) and are asserted as the observable outcome.
 */

/** Random, collision-resistant suffix for test-created entities. */
export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Unique Haul Akbar name; the workbook base is "Haul Akbar". */
export const uniqueHaulAkbarName = (base = 'Haul Akbar QA'): string =>
  `${base} ${uniqueSuffix()}`;

/**
 * Unique Haul Akbar abbreviation.
 *
 * `StoreHaulAkbarRequest` requires `alpha_num`, `uppercase`, max 20 and global
 * uniqueness, so the value is generated from uppercase letters/digits only.
 */
export const uniqueHaulAkbarSingkatan = (): string =>
  `QA${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

/**
 * Candidate unique year (Masehi). Real data sits around 2024-2027, so the
 * generator avoids that band while staying inside the validated range
 * (2000-2100) of `StorePeriodeRequest`.
 */
export const uniqueTahunMasehi = (): string =>
  String(2070 + Math.floor(Math.random() * 30));

/** Unique Hijriyah label (max 20 chars per `StorePeriodeRequest`). */
export const uniqueTahunHijriyah = (): string =>
  `1${400 + Math.floor(Math.random() * 99)} QA`;

/**
 * Validation / feedback messages (verbatim from development source):
 * - `app/Http/Controllers/Web/Pengaturan/HaulAkbarController.php`
 * - `app/Http/Controllers/Web/Pengaturan/PeriodeController.php`
 * - `app/Http/Requests/Pengaturan/StoreHaulAkbarRequest.php`
 * - `app/Http/Requests/Pengaturan/StorePeriodeRequest.php`
 */
export const MESSAGES = {
  haulAkbarCreated: 'Haul Akbar berhasil ditambahkan.',
  haulAkbarUpdated: 'Haul Akbar berhasil diperbarui.',
  haulAkbarDeleted: 'Haul Akbar berhasil dihapus.',
  haulAkbarNamaRequired: 'Nama Haul Akbar wajib diisi.',
  haulAkbarSingkatanRequired: 'Singkatan wajib diisi.',
  periodeCreated: 'Periode berhasil ditambahkan.',
  periodeUpdated: 'Periode berhasil diperbarui.',
  periodeDeleted: 'Periode berhasil dihapus.',
  periodeTahunRequired: 'Tahun Masehi wajib diisi.',
  periodeTahunDuplicate: 'Tahun Masehi sudah ada untuk Haul Akbar ini.',
  periodeHijriyahRequired: 'Tahun Hijriyah wajib diisi.',
  statusBelumDibuka: 'Belum Dibuka',
} as const;
