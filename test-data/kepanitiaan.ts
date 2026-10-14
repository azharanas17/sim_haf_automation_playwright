/**
 * Test data for approved journeys J-S4 ("Kelola Alamat Cascading", FR-04,
 * 15.1.5) and J-S5 ("Kelola Kepanitiaan", FR-04, 15.1.6).
 *
 * Entities are generated with a unique suffix so repeated runs never collide
 * with UAT fixture data or with prior runs.
 *
 * User-visible messages are taken verbatim from the development source
 * (controllers / form requests) and are asserted as the observable outcome.
 */

/** Random, collision-resistant suffix for test-created entities. */
export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Unique panitia (committee member) name. */
export const uniquePanitiaNama = (base = 'Panitia QA'): string =>
  `${base} ${uniqueSuffix()}`;

/**
 * Validation / feedback messages (verbatim from development source):
 * - `app/Http/Controllers/Web/Pengaturan/KepanitiaaanController.php`
 * - `app/Http/Requests/Pengaturan/StoreKepanitiaaanRequest.php`
 * Note: the workbook's TC-REQ-040 expects "≤5MB" but the request actually
 * enforces `foto.max` = 2MB; the asserted message is the app's verbatim text.
 */
export const MESSAGES = {
  kepanitiaanCreated: 'Anggota Kepanitiaan berhasil ditambahkan.',
  kepanitiaanUpdated: 'Anggota Kepanitiaan berhasil diperbarui.',
  kepanitiaanDeleted: 'Anggota Kepanitiaan berhasil dihapus.',
  namaRequired: 'Nama wajib diisi.',
  bidangRequired: 'Bidang wajib dipilih.',
  khidmahRequired: 'Khidmah/Seksi wajib dipilih.',
  fotoMime: 'Format foto harus jpg, jpeg, png, atau webp.',
  fotoMax: 'Ukuran foto maksimal 2MB.',
} as const;