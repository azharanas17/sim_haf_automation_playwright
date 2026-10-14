import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Akun Pengguna" (approved journey J-S6
 * "Kelola User & Role", FR-05 / UC-2).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Routes: `routes/web.php` -> `pengaturan.user.*` (`UserController`, gated to
 *   Superadmin); index `/pengaturan/user`, create `/pengaturan/user/create`,
 *   edit `/pengaturan/user/{id}/edit`.
 * - Index view: `resources/views/pengaturan/user/index.blade.php`.
 *   Heading `<h1>Akun Pengguna</h1>`; add link "Tambah Pengguna"; GET search
 *   `<input name="search" placeholder="Nama / Email...">` + button "Cari";
 *   status filter `select[name="status"]`; columns Nama / Email / Role /
 *   Status / Scope Akses / Aksi. Row actions: "Edit" (anchor), "Reset Sandi"
 *   (button opens modal), "Nonaktifkan"/"Aktifkan" (PATCH toggle-status),
 *   "Hapus" (DELETE + native confirm()). Self-row actions (id == auth id) are
 *   hidden, so toggle/delete are only available for other users.
 *   Reset modal: heading "Reset Sandi Pengguna", `x-form.input name="password"`
 *   label "Kata Sandi Baru", submit "Simpan", cancel "Batal".
 * - Create view: `resources/views/pengaturan/user/create.blade.php`.
 *   Heading "Tambah Akun Pengguna"; submit "Simpan Akun". Fields
 *   `select[name="role_id"]` (options are the role display names), optional
 *   `name="kepanitiaan_id"`, scoped `name="bidang_id"` + `name="khidmah_id"`
 *   (`:disabled="!selectedBidang"`), `input[name="nama"]`,
 *   `x-form.input name="email"`, `x-form.input name="password"` (Sandi minimal
 *   8 karakter), `name="haul_akbar_ids[]"` checkboxes (active Haul Akbar is
 *   pre-checked via `$activeHaulAkbarId`).
 * - Edit view: heading "Edit Akun Pengguna"; submit "Perbarui Akun".
 * - Feedback: `resources/views/components/alert.blade.php`. Server validation
 *   errors render as a visible global alert, so e.g. the duplicate-email
 *   message can be asserted from any page state.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class UserPage {
  readonly page: Page;

  readonly indexPath: string;
  readonly createPath: string;
  readonly editPathPrefix: string;

  readonly heading: Locator;
  readonly addLink: Locator;
  readonly table: Locator;

  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indexPath = process.env.USERS_PATH || '/pengaturan/user';
    this.createPath = `${this.indexPath}/create`;
    this.editPathPrefix = `${this.indexPath}/`;
    this.heading = page.getByRole('heading', {
      name: 'Akun Pengguna',
      exact: true,
    });
    this.addLink = page.getByRole('link', {
      name: 'Tambah Pengguna',
      exact: true,
    });
    this.table = page.getByRole('table');
    this.searchInput = page.getByPlaceholder(/Nama \/ Email/i);
    this.searchButton = page.getByRole('button', { name: 'Cari', exact: true });
  }

  async gotoIndex(): Promise<void> {
    await this.page.goto(this.indexPath);
    await expect(this.heading).toBeVisible();
  }

  async gotoCreate(): Promise<void> {
    await this.page.goto(this.createPath);
    await expect(
      this.page.getByRole('heading', {
        name: 'Tambah Akun Pengguna',
        exact: true,
      })
    ).toBeVisible();
  }

  // --- Search ------------------------------------------------------------

  async searchByEmail(email: string): Promise<void> {
    await this.searchInput.fill(email);
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).pathname.endsWith(this.indexPath) &&
          new URL(response.url()).searchParams.get('search') === email
      ),
      this.searchButton.click(),
    ]);
    await expect(this.table).toBeVisible();
  }

  // --- Row-level helpers --------------------------------------------------

  rowByEmail(email: string): Locator {
    return this.page.getByRole('row').filter({ hasText: email });
  }

  async expectRowVisible(email: string): Promise<void> {
    await this.searchByEmail(email);
    await expect(this.rowByEmail(email).first()).toBeVisible();
  }

  async expectRowAbsent(email: string): Promise<void> {
    await this.searchByEmail(email);
    await expect(this.rowByEmail(email)).toHaveCount(0);
  }

  // --- Create form -------------------------------------------------------

  /** Select a scope (Bidang -> Khidmah) when the chosen role requires it. */
  async selectScope(bidang: string, khidmah?: string): Promise<void> {
    const bidangSelect = this.page.locator('select[name="bidang_id"]');
    await expect(bidangSelect).toBeEnabled();
    await bidangSelect.selectOption({ label: bidang });
    const khidmahSelect = this.page.locator('select[name="khidmah_id"]');
    await expect(khidmahSelect).toBeEnabled();
    if (khidmah) {
      await khidmahSelect.selectOption({ label: khidmah });
    }
  }

  async submitCreate(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Simpan Akun', exact: true })
      .click();
  }

  async createUser(input: {
    roleLabel: string;
    nama: string;
    email: string;
    password: string;
    scope?: { bidang: string; khidmah: string };
  }): Promise<void> {
    await this.gotoCreate();
    await this.page.locator('select[name="role_id"]').selectOption({
      label: input.roleLabel,
    });
    if (input.scope) {
      await this.selectScope(input.scope.bidang, input.scope.khidmah);
    }
    await this.page.locator('input[name="nama"]').fill(input.nama);
    await this.page.locator('input[name="email"]').fill(input.email);
    await this.page.locator('input[name="password"]').fill(input.password);
    await this.submitCreate();
  }

  // --- Edit --------------------------------------------------------------

  async editUser(email: string, input: { roleLabel?: string }): Promise<void> {
    await this.searchByEmail(email);
    const row = this.rowByEmail(email).first();
    await expect(row).toBeVisible();
    await row.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(
      this.page.getByRole('heading', {
        name: 'Edit Akun Pengguna',
        exact: true,
      })
    ).toBeVisible();
    if (input.roleLabel) {
      await this.page.locator('select[name="role_id"]').selectOption({
        label: input.roleLabel,
      });
    }
    await this.page
      .getByRole('button', { name: 'Perbarui Akun', exact: true })
      .click();
  }

  // --- Reset password, toggle status, delete -----------------------------

  async resetPassword(email: string, newPassword: string): Promise<void> {
    await this.searchByEmail(email);
    const row = this.rowByEmail(email).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Reset Sandi', exact: true }).click();
    await expect(
      this.page.getByRole('heading', {
        name: 'Reset Sandi Pengguna',
        exact: true,
      })
    ).toBeVisible();
    await this.page.locator('input[name="password"]').fill(newPassword);
    await this.page
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  /** Toggle status of the row: "Nonaktifkan" (active -> inactive) or the reverse. */
  async toggleStatus(email: string, buttonText: 'Nonaktifkan' | 'Aktifkan'): Promise<void> {
    await this.searchByEmail(email);
    const row = this.rowByEmail(email).first();
    await expect(row).toBeVisible();
    await row
      .getByRole('button', { name: buttonText, exact: true })
      .click();
  }

  async deleteByEmailIfPresent(email: string): Promise<void> {
    await this.gotoIndex();
    await this.searchByEmail(email);
    const row = this.rowByEmail(email).first();
    if ((await row.count()) === 0) {
      return;
    }
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  // --- Assertions --------------------------------------------------------

  async expectSuccess(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }).first()
    ).toBeVisible();
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }).first()
    ).toBeVisible();
  }

  /** True when the given field fails native HTML5 constraint validation. */
  async isFieldInvalid(locator: Locator): Promise<boolean> {
    return locator.evaluate(
      (el) => !(el as HTMLInputElement | HTMLSelectElement).checkValidity()
    );
  }
}