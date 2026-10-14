/**
 * Test data for approved journey J-S6 - "Kelola User & Role (FR-05, 15.1.7)".
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

/** Unique login email for a generated user (lowercase, registry-safe). */
export const uniqueEmail = (base = 'user.qa'): string =>
  `${base}.${uniqueSuffix()}@simhaf.test`;

/** Unique display name / nama lengkap for a generated user. */
export const uniqueNama = (base = 'User QA'): string =>
  `${base} ${uniqueSuffix()}`;

/** Strong generated password: >= 8 chars, letters + numbers (policy FR-05). */
export const strongPassword = (): string => `Qa${uniqueSuffix()}Pass1`;

/** Weak password: letters + numbers but shorter than the 8-char minimum. */
export const weakPassword: string = 'abc123';

/**
 * Role identifiers + display names (verbatim from:
 * `app/Domain/Shared/Enums/UserRole.php`). Values are the `name` stored in the
 * roles table; labels are the option text rendered in the create/edit form.
 */
export const ROLES = [
  { value: 'superadmin', label: 'Super Administrator', scoped: false },
  { value: 'ketua_umum', label: 'Ketua Umum', scoped: false },
  { value: 'sekretaris_umum', label: 'Sekretaris Umum', scoped: false },
  { value: 'bendahara_umum', label: 'Bendahara Umum', scoped: false },
  { value: 'ketua_bidang', label: 'Ketua Bidang', scoped: true },
  { value: 'sekretaris_bidang', label: 'Sekretaris Bidang', scoped: true },
  { value: 'pj_seksi', label: 'PJ Seksi', scoped: true },
] as const;

/**
 * Validation / feedback messages (verbatim from development source):
 * - `app/Http/Controllers/Web/Pengaturan/UserController.php`
 * - `app/Http/Requests/Pengaturan/StoreUserRequest.php`
 */
export const MESSAGES = {
  userCreated: 'User berhasil ditambahkan.',
  userUpdated: 'User berhasil diperbarui.',
  userDeleted: 'User berhasil dihapus.',
  passwordReset: 'Password user berhasil direset.',
  statusToggled: 'Status user berhasil diubah.',
  emailTaken: 'Email sudah terdaftar.',
  roleRequired: 'Role wajib dipilih.',
  namaRequired: 'Nama wajib diisi.',
  passwordRequired: 'Password wajib diisi.',
  minOneHaulAkbar: 'Minimal satu Haul Akbar harus dipilih.',
} as const;