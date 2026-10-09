import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Bidang Organisasi" (approved journey J-S2).
 *
 * LOCATOR PROVENANCE (Phase 3 - grounded in development source):
 * - Route: `routes/web.php` -> `Route::resource('bidang', BidangController::class)`
 *   inside the `pengaturan` prefix; index path `/pengaturan/bidang`.
 * - View: `resources/views/pengaturan/bidang/index.blade.php`.
 * - Heading: `<h1>Bidang Organisasi</h1>`.
 * - Add button: "Tambah Bidang".
 * - Add form: contains the submit button "Simpan"; field components
 *   `x-form.select name="haul_akbar_id" label="Haul Akbar"` and
 *   `x-form.input name="nama" label="Nama Bidang"` render `#haul_akbar_id`
 *   and `#nama`.
 * - Edit form: submit button "Perbarui" (row-level "Edit" opens it).
 * - Delete: row-level "Hapus" button inside a form guarded by a native
 *   `confirm()` dialog.
 * - Feedback: `resources/views/components/alert.blade.php` renders
 *   `session('success')` and validation errors.
 *
 * This page object describes UI interaction only; it does not encode business
 * rules or scenario expectations.
 */
export class BidangPage {
  readonly page: Page;

  /** Index path, grounded in `routes/web.php` and configurable via env. */
  readonly path: string;

  readonly heading: Locator;
  readonly addButton: Locator;
  readonly table: Locator;

  /** Add modal form, identified by its "Simpan" submit button. */
  readonly addForm: Locator;
  /** Edit modal form, identified by its "Perbarui" submit button. */
  readonly editForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = process.env.BIDANG_PATH || '/pengaturan/bidang';
    this.heading = page.getByRole('heading', {
      name: 'Bidang Organisasi',
      exact: true,
    });
    this.addButton = page.getByRole('button', {
      name: 'Tambah Bidang',
      exact: true,
    });
    this.table = page.getByRole('table');
    this.addForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Simpan', exact: true }) });
    this.editForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Perbarui', exact: true }) });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  // --- Add ---------------------------------------------------------------

  /** Open the "Tambah Bidang" modal and wait for the nama field. */
  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await expect(this.addForm.getByLabel('Nama Bidang')).toBeVisible();
  }

  /** Fill the add form and submit it. */
  async addBidang(nama: string): Promise<void> {
    await this.openAddForm();
    await this.addForm.getByLabel('Nama Bidang').fill(nama);
    await this.addForm
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  // --- Edit --------------------------------------------------------------

  /** Edit the name of the Bidang row identified by its current name. */
  async editName(currentName: string, newName: string): Promise<void> {
    const row = this.rowByName(currentName).first();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    const input = this.editForm.getByLabel('Nama Bidang');
    await expect(input).toBeVisible();
    await input.fill(newName);
    await this.editForm
      .getByRole('button', { name: 'Perbarui', exact: true })
      .click();
  }

  // --- Delete ------------------------------------------------------------

  /** Accept the native confirm() dialog then click Hapus for the given row. */
  async deleteByName(nama: string): Promise<void> {
    const row = this.rowByName(nama).first();
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  // --- Assertions --------------------------------------------------------

  rowByName(nama: string): Locator {
    return this.page.getByRole('row').filter({ hasText: nama });
  }

  async expectDisplayed(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.addButton).toBeVisible();
  }

  async expectRow(nama: string): Promise<void> {
    await expect(this.rowByName(nama).first()).toBeVisible();
  }

  async expectRowAbsent(nama: string): Promise<void> {
    await expect(this.rowByName(nama)).toHaveCount(0);
  }

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

  /** True when the given form field fails native HTML5 constraint validation. */
  async isFieldInvalid(locator: Locator): Promise<boolean> {
    return locator.evaluate(
      (el) => !(el as HTMLInputElement | HTMLSelectElement).checkValidity()
    );
  }

  /** Count rows currently showing the given name (expect 1 after a valid add). */
  async countRows(nama: string): Promise<number> {
    return this.rowByName(nama).count();
  }
}
