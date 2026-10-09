/**
 * Test data for approved journey J-S2
 * "Kelola Struktur Organisasi: Bidang -> Khidmah (UC-1, FR-03, 15.1.1-15.1.2)".
 *
 * Names are generated with a unique suffix so repeated runs never collide with
 * each other or with UAT fixture data. The workbook's entity names ("Konsumsi")
 * are preserved as the semantic base of the generated name.
 *
 * User-visible messages below are taken verbatim from the development source
 * (controllers / form requests / services) and are asserted as the observable
 * outcome of each scenario.
 */

/** Random, collision-resistant suffix for test-created entities. */
export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Unique Bidang name. Base is the workbook entity ("Konsumsi") by default. */
export const uniqueBidangName = (base = 'Konsumsi'): string =>
  `${base} QA-${uniqueSuffix()}`;

/** Unique Khidmah / Seksi name. */
export const uniqueKhidmahName = (base = 'Jamuan'): string =>
  `${base} QA-${uniqueSuffix()}`;

/**
 * Validation / feedback messages (verbatim from development source):
 * - `app/Application/Pengaturan/Services/BidangService.php`
 * - `app/Application/Pengaturan/Services/KhidmahService.php`
 * - `app/Http/Requests/Pengaturan/StoreBidangRequest.php`
 * - `app/Http/Requests/Pengaturan/StoreKhidmahRequest.php`
 * - `app/Http/Controllers/Web/Pengaturan/{BidangController,KhidmahController}.php`
 */
export const MESSAGES = {
  bidangCreated: 'Bidang berhasil ditambahkan.',
  bidangUpdated: 'Bidang berhasil diperbarui.',
  bidangDeleted: 'Bidang berhasil dihapus.',
  bidangNamaRequired: 'Nama Bidang wajib diisi.',
  bidangNamaDuplicate: 'Nama Bidang sudah digunakan dalam Haul Akbar ini.',
  bidangDeleteBlocked:
    'Bidang tidak dapat dihapus karena masih memiliki Khidmah/Seksi aktif.',
  khidmahCreated: 'Khidmah berhasil ditambahkan.',
  khidmahUpdated: 'Khidmah berhasil diperbarui.',
  khidmahDeleted: 'Khidmah berhasil dihapus.',
  khidmahBidangRequired: 'Bidang wajib dipilih.',
  khidmahNamaRequired: 'Nama Khidmah wajib diisi.',
  khidmahDeleteBlockedPeriode:
    'Seksi / Khidmah tidak dapat dihapus karena masih memiliki transaksi, kegiatan, atau RAB aktif pada periode ini.',
  khidmahDeleteBlockedGlobal:
    'Khidmah tidak dapat dihapus karena masih memiliki Kepanitiaan, User, atau Transaksi aktif.',
} as const;
