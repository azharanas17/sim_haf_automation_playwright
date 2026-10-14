/**
 * Test data abstraction.
 *
 * Credentials are NEVER hardcoded here. They are read from environment
 * variables (see .env.example). Values are resolved lazily so that test
 * discovery (`playwright test --list`) works without a configured .env.
 *
 * Approved source: SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx,
 * journey J-S1 "Login & Pilih Haul Akbar (FR-02, Auth, SR-8)".
 *
 * The workbook names the Superadmin test identity as `admin@simhaf.test`
 * with "2FA enabled". Passwords and any TOTP secret are intentionally not
 * stored in this repository and must be supplied via the environment.
 *
 * OTP is not mandatory for every account: `otpRequired` is identity/config
 * driven, so an account that authenticates with email + password only is
 * supported without removing the OTP path for accounts that need it.
 */

export interface User {
  role: string;
  email: string;
  password: string;
  /**
   * Optional TOTP secret, only meaningful for identities that require 2FA/OTP.
   * Supply via `UAT_TOTP_SECRET_<IDENTITY>` when the account needs it.
   */
  totpSecret?: string;
  /**
   * Whether this identity requires a 2FA/OTP step after the credentials step.
   * Not all accounts require OTP; this is driven by the identity/config:
   *   - explicit override via `UAT_OTP_REQUIRED_<IDENTITY>` (true/false), or
   *   - defaults to whether a TOTP secret is configured for that identity.
   */
  otpRequired?: boolean;
}

const readEnv = (name: string): string => process.env[name] ?? '';

const readBoolEnv = (name: string, fallback: boolean): boolean => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  return /^(1|true|yes|on)$/i.test(value.trim());
};

/** True when the identity must complete a 2FA/OTP step after credentials. */
export const requiresOtp = (user?: User): boolean => Boolean(user?.otpRequired);

/**
 * Superadmin identity used by TC-REQ-001 .. TC-REQ-011 and the J-S2 slice.
 *
 * OTP is NOT assumed: `otpRequired` is resolved from `UAT_OTP_REQUIRED_SUPERADMIN`
 * and defaults to whether `UAT_TOTP_SECRET_SUPERADMIN` is present. An account
 * whose credentials suffice (no OTP) therefore logs in with email/password only.
 */
export const superadmin = (): User => {
  const totpSecret = readEnv('UAT_TOTP_SECRET_SUPERADMIN') || undefined;
  return {
    role: 'Superadmin',
    email: readEnv('UAT_EMAIL_SUPERADMIN'),
    password: readEnv('UAT_PASSWORD_SUPERADMIN'),
    totpSecret,
    otpRequired: readBoolEnv(
      'UAT_OTP_REQUIRED_SUPERADMIN',
      Boolean(totpSecret)
    ),
  };
};

/**
 * Deliberately inactive account required by TC-REQ-010.
 * The workbook does not define this account; it must be provisioned in UAT.
 */
export const inactiveSuperadmin = (): User => ({
  role: 'Superadmin (Nonaktif)',
  email: readEnv('UAT_EMAIL_INACTIVE'),
  password: readEnv('UAT_PASSWORD_INACTIVE'),
  otpRequired: false,
});

/** Invalid credentials used by TC-REQ-006 (wrong password / unregistered email). */
export const invalidCredentials = () => ({
  email: readEnv('UAT_EMAIL_INVALID') || 'not-a-registered-user@simhaf.test',
  password: readEnv('UAT_PASSWORD_INVALID') || 'DefinitelyWrongPassword!',
});

const roleIdentity = (envKey: string, role: string): (() => User) => {
  const totpSecret = readEnv(`UAT_TOTP_SECRET_${envKey}`) || undefined;
  return () => ({
    role,
    email: readEnv(`UAT_EMAIL_${envKey}`),
    password: readEnv(`UAT_PASSWORD_${envKey}`),
    totpSecret,
    otpRequired: readBoolEnv(`UAT_OTP_REQUIRED_${envKey}`, Boolean(totpSecret)),
  });
};

/**
 * UAT fixture role identities (names/emails defined by the development seeder
 * `database/seeders/UatFixtureSeeder.php`). Credentials are NEVER hardcoded:
 * they must be supplied via the environment. When a role identity is not
 * configured, scenario sessions for that role skip (see `declareScenario`).
 */
export const ketuaUmum = roleIdentity('KETUA_UMUM', 'Ketua Umum');
export const sekretarisUmum = roleIdentity('SEKRETARIS_UMUM', 'Sekretaris Umum');
export const bendaharaUmum = roleIdentity('BENDAHARA_UMUM', 'Bendahara Umum');
export const ketuaBidang = roleIdentity('KETUA_BIDANG', 'Ketua Bidang');
export const sekretarisBidang = roleIdentity('SEKRETARIS_BIDANG', 'Sekretaris Bidang');
export const pjSeksi = roleIdentity('PJ_SEKSI', 'PJ Seksi');
/** PJ Seksi account deliberately seeded with status 'nonaktif' (UAT). */
export const nonaktifPjSeksi = roleIdentity('PJ_SEKSI_NONAKTIF', 'PJ Seksi (Nonaktif)');
export const panitiaLapangan = roleIdentity('PANITIA_LAPANGAN', 'Panitia Lapangan');

export const isUserConfigured = (user: User): boolean =>
  Boolean(user.email && user.password);
