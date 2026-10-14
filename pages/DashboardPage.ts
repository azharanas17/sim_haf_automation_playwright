import { expect, Locator, Page } from '@playwright/test';

/**
 * LOCATOR POLICY - PHASE 1
 * ------------------------
 * See LoginPage. The authenticated-area locators below were confirmed against
 * the UAT environment from the manual reporting run 38147054993 (accessibility
 * snapshot + DOM); the remaining candidates stay marked `LOCATOR-TODO`. This
 * page object represents UI interaction only.
 */
export class DashboardPage {
  readonly page: Page;

  // Confirmed (UAT run 38147054993): authenticated landing area.
  readonly dashboardHeading: Locator;
  // Confirmed (UAT run 38147054993): navbar context switcher; its label carries
  // the active haul name (e.g. "Haul Akbar Al Fithrah 2027") and clicking it
  // reveals the switch options.
  readonly haulAkbarSelector: Locator;
  // Confirmed (UAT run 38147054993): profile trigger (labelled with the person's
  // name, e.g. "Su Super Administrator Super Administrator") that reveals the
  // account dropdown containing the logout item.
  readonly profileMenuTrigger: Locator;
  // Confirmed (UAT run 38147054993): the "Keluar Sistem" submit button, rendered
  // inside the profile dropdown (hence the menu must be opened first).
  readonly logoutControl: Locator;

  /**
   * Grounded in `resources/views/dashboard/index.blade.php`: the greeting
   * "Selamat datang, {{ nama }}!" plus the widget-1..5 financial cards
   * (Pemasukan, Pengeluaran, Saldo Kas, Total RAB, LPJ Pending).
   */
  readonly welcomeHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardHeading = page
      .getByRole('heading', { name: /dashboard|beranda/i })
      .or(page.getByText(/dashboard|beranda/i));
    this.haulAkbarSelector = page.getByRole('button', {
      name: /haul akbar|haf/i,
    });
    this.profileMenuTrigger = page.getByRole('button', {
      name: /super administrator/i,
    });
    this.logoutControl = page
      .getByRole('button', { name: /keluar|logout|sign out/i })
      .or(page.getByRole('menuitem', { name: /keluar|logout|sign out/i }));
    this.welcomeHeading = page.getByRole('heading', {
      name: /Selamat datang/i,
    });
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

  /**
   * Switch the active Haul Akbar context from the navbar.
   *
   * Confirmed against UAT (run 38147054993): the switch options are plain
   * `<button>` elements (the submit control of a `set-active-periode` form),
   * not `option`/`menuitem`, so the option role is matched as a button first.
   */
  async selectHaulAkbar(name: string | RegExp): Promise<void> {
    await this.haulAkbarSelector.first().click();
    await this.page
      .getByRole('button', { name })
      .or(this.page.getByRole('option', { name }))
      .or(this.page.getByRole('menuitem', { name }))
      .first()
      .click();
  }

  /**
   * End the session.
   *
   * Confirmed against UAT (run 38147054993): the logout control is only
   * rendered once the profile dropdown is open, so the profile menu must be
   * opened before the logout item can be clicked.
   */
  async logout(): Promise<void> {
    await this.profileMenuTrigger.first().click();
    await this.logoutControl.first().click();
  }

  // --- Dashboard cards & quick actions (J-K1) ----------------------------

  /** Financial widget card identified by its uppercase label. */
  card(label: string): Locator {
    return this.page.getByText(label, { exact: true });
  }

  /** Quick-action link in the "Akses Cepat" panel (e.g. 'Laporan'). */
  quickAction(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }
}
