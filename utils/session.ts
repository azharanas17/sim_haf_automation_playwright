import { LoginPage } from '../pages/LoginPage';
import { User } from '../test-data/users';

/**
 * Establish an authenticated session for a given identity.
 *
 * Reuses the Phase 1 login pattern and the unresolved 2FA/OTP adapter
 * (`LoginPage.submitOtp`). Session-dependent scenarios are guarded by
 * `declareScenario({ requiresSession: true, user })`, which skips them unless a
 * TOTP secret is configured - so this helper is only reached when a session can
 * legitimately be formed. No credentials are hardcoded here.
 */
export const signIn = async (
  loginPage: LoginPage,
  user: User
): Promise<void> => {
  await loginPage.goto();
  await loginPage.expectDisplayed();
  await loginPage.loginWith(user.email, user.password);

  if (user.totpSecret) {
    await loginPage.submitOtp(user.totpSecret);
  }
};
