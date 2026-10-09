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
 */

export interface User {
  role: string;
  email: string;
  password: string;
  totpSecret?: string;
}

const readEnv = (name: string): string => process.env[name] ?? '';

/** Superadmin identity used by TC-REQ-001 .. TC-REQ-011. */
export const superadmin = (): User => ({
  role: 'Superadmin',
  email: readEnv('UAT_EMAIL_SUPERADMIN'),
  password: readEnv('UAT_PASSWORD_SUPERADMIN'),
  totpSecret: readEnv('UAT_TOTP_SECRET_SUPERADMIN') || undefined,
});

/**
 * Deliberately inactive account required by TC-REQ-010.
 * The workbook does not define this account; it must be provisioned in UAT.
 */
export const inactiveSuperadmin = (): User => ({
  role: 'Superadmin (Nonaktif)',
  email: readEnv('UAT_EMAIL_INACTIVE'),
  password: readEnv('UAT_PASSWORD_INACTIVE'),
});

/** Invalid credentials used by TC-REQ-006 (wrong password / unregistered email). */
export const invalidCredentials = () => ({
  email: readEnv('UAT_EMAIL_INVALID') || 'not-a-registered-user@simhaf.test',
  password: readEnv('UAT_PASSWORD_INVALID') || 'DefinitelyWrongPassword!',
});

export const isUserConfigured = (user: User): boolean =>
  Boolean(user.email && user.password);
