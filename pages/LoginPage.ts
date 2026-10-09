import { expect, Locator, Page } from '@playwright/test';

/**
 * LOCATOR POLICY - PHASE 1
 * ------------------------
 * Development source code was intentionally NOT inspected to derive these
 * selectors. Every locator below is a best-effort semantic candidate and is
 * marked `LOCATOR-TODO`. They MUST be confirmed against the UAT environment
 * before this suite is trusted. No selector was invented from implementation
 * assumptions; the candidates are limited to semantic strategies
 * (getByRole / getByLabel / getByText).
 *
 * Page objects describe UI interaction only. They must not encode business
 * requirements or test scenarios.
 */
export class LoginPage {
  readonly page: Page;

  // LOCATOR-TODO: confirm label casing/wording against UAT. Marked unresolved.
  readonly emailInput: Locator;
  // LOCATOR-TODO: confirm label casing/wording against UAT. Marked unresolved.
  readonly passwordInput: Locator;
  // LOCATOR-TODO: confirm button text (e.g. "Masuk" vs "Login"). Marked unresolved.
  readonly submitButton: Locator;
  // LOCATOR-TODO: confirm the OTP field for the 2FA step. Marked unresolved.
  readonly otpInput: Locator;
  // LOCATOR-TODO: confirm the error/validation presentation. Marked unresolved.
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page
      .getByLabel(/email|username|nama pengguna/i)
      .or(page.getByRole('textbox', { name: /email|username|nama pengguna/i }));
    this.passwordInput = page
      .getByLabel(/password|kata sandi|sandi/i)
      .or(page.getByRole('textbox', { name: /password|kata sandi|sandi/i }));
    this.submitButton = page.getByRole('button', {
      name: /masuk|login|sign in/i,
    });
    this.otpInput = page.getByLabel(/otp|kode|verifikasi/i);
    this.errorMessage = page
      .getByRole('alert')
      .or(page.getByText(/salah|invalid|tidak valid|gagal|ditolak/i));
  }

  /** Navigate to the login screen. Path is environment-configurable. */
  async goto(): Promise<void> {
    await this.page.goto(process.env.LOGIN_PATH || '/login');
  }

  /** Fill the credential form. Does not submit. */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /** Submit the credential form. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Convenience: fill + submit credentials without asserting the outcome. */
  async loginWith(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * UNRESOLVED ADAPTER (2FA)
   * The workbook records the Superadmin test account as "2FA enabled".
   * The OTP delivery/entry mechanism cannot be finalised without inspecting
   * the application, so this step is deliberately left as a documented gap.
   */
  async submitOtp(_code: string): Promise<void> {
    throw new Error(
      'UNRESOLVED ADAPTER: OTP/2FA entry is not finalised in Phase 1. ' +
        'Confirm the 2FA mechanism against UAT before enabling.'
    );
  }

  async expectDisplayed(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
  }

  async expectErrorVisible(): Promise<void> {
    await expect(this.errorMessage.first()).toBeVisible();
  }
}
