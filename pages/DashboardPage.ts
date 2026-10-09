import { expect, Locator, Page } from '@playwright/test';

/**
 * LOCATOR POLICY - PHASE 1
 * ------------------------
 * See LoginPage. All locators are semantic candidates marked `LOCATOR-TODO`
 * and must be confirmed against the UAT environment before this suite is
 * trusted. This page object represents UI interaction only.
 */
export class DashboardPage {
  readonly page: Page;

  // LOCATOR-TODO: confirm the heading/landmark for the authenticated area.
  readonly dashboardHeading: Locator;
  // LOCATOR-TODO: confirm the Haul Akbar selector control in the navbar.
  readonly haulAkbarSelector: Locator;
  // LOCATOR-TODO: confirm the logout control (menu item or button).
  readonly logoutControl: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardHeading = page
      .getByRole('heading', { name: /dashboard|beranda/i })
      .or(page.getByText(/dashboard|beranda/i));
    this.haulAkbarSelector = page.getByRole('button', {
      name: /haul akbar|haf/i,
    });
    this.logoutControl = page
      .getByRole('button', { name: /keluar|logout|sign out/i })
      .or(page.getByRole('menuitem', { name: /keluar|logout|sign out/i }));
  }

  /** Path to a protected page used for redirect checks. */
  async gotoProtected(): Promise<void> {
    await this.page.goto(process.env.PROTECTED_PATH || '/dashboard');
  }

  async expectDisplayed(): Promise<void> {
    await expect(this.dashboardHeading.first()).toBeVisible();
  }

  async expectHaulAkbarSelectorVisible(): Promise<void> {
    await expect(this.haulAkbarSelector.first()).toBeVisible();
  }

  /** Switch the active Haul Akbar context from the navbar. */
  async selectHaulAkbar(name: string | RegExp): Promise<void> {
    await this.haulAkbarSelector.first().click();
    await this.page.getByRole('option', { name }).or(
      this.page.getByRole('menuitem', { name })
    ).first().click();
  }

  async logout(): Promise<void> {
    await this.logoutControl.first().click();
  }
}
