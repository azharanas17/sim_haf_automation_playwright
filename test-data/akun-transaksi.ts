/**
 * Test data for approved journey J-S7 - "Master Akun Transaksi (FR-07, FR-14)".
 *
 * Entities are generated with a unique suffix so repeated runs never collide
 * with UAT fixture data or with prior runs.
 *
 * User-visible messages are taken verbatim from the development source
 * (`app/Http/Controllers/Web/Keuangan/AkunTransaksiController.php`) and are
 * asserted as the observable outcome.
 */

/** Random, collision-resistant suffix for test-created entities. */
export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Unique akun kode (max 20 chars per the request validation). */
export const uniqueKode = (prefix = 'QA'): string =>
  `${prefix}-${uniqueSuffix()}`.slice(0, 20);

/** Unique akun nama. */
export const uniqueNama = (base = 'Akun QA'): string =>
  `${base} ${uniqueSuffix()}`;

/**
 * Validation / feedback messages (verbatim from development source):
 * - `app/Http/Controllers/Web/Keuangan/AkunTransaksiController.php`
 * The application renders server-side validation failures inside the GLOBAL
 * alert (`resources/views/components/alert.blade.php`) whose leading line is
 * "Terdapat kesalahan validasi pada form:" followed by the field errors.
 */
export const MESSAGES = {
  penerimaanCreated: 'Akun Penerimaan berhasil ditambahkan.',
  penerimaanUpdated: 'Akun Penerimaan berhasil diperbarui.',
  penerimaanDeleted: 'Akun Penerimaan berhasil dihapus.',
  pengeluaranCreated: 'Akun Pengeluaran berhasil ditambahkan.',
  pengeluaranUpdated: 'Akun Pengeluaran berhasil diperbarui.',
  pengeluaranDeleted: 'Akun Pengeluaran berhasil dihapus.',
  subAgendaCreated: 'Sub Agenda berhasil ditambahkan.',
  subAgendaUpdated: 'Sub Agenda berhasil diperbarui.',
  subAgendaDeleted: 'Sub Agenda berhasil dihapus.',
  validationAlert: 'Terdapat kesalahan validasi pada form:',
} as const;