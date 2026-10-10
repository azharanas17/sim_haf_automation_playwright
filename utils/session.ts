import { LoginPage } from '../pages/LoginPage';
import { User } from '../test-data/users';

/**
 * Establish an authenticated session for a given identity.
 *
 * The OTP step is identity-driven (`User.otpRequired`): an account that
 * authenticates with email + password only is logged in directly, while an
 * account that requires 2FA still goes through `LoginPage.submitOtp`. No step
 * is faked and no session is fabricated; `declareScenario` guards sessions that
 * cannot legitimately be formed. No credentials are hardcoded here.
 */
export const signIn = async (
  loginPage: LoginPage,
  user: User
): Promise<void> => {
  await loginPage.goto();
  await loginPage.expectDisplayed();
  await loginPage.loginWith(user.email, user.password);

  if (user.otpRequired) {
    await loginPage.submitOtp(user.totpSecret ?? '');
  }
};
