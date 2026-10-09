import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Seksi / Khidmah" (approved journey J-S2).
 *
 * LOCATOR PROVENANCE (Phase 3 - grounded in development source):
 * - Route: `routes/web.php` -> `Route::resource('khidmah', KhidmahController::class)`
 *   inside the `pengaturan` prefix; index path `/pengaturan/khidmah`.
 * - View: `resources/views/pengaturan/khidmah/index.blade.php`.
 * - Heading: `<h1>Seksi / Khidmah</h1>`.
 * - Add button: "Tambah Seksi / Khidmah".
 * - Add form: submit button "Simpan"; field components
 *   `x-form.select name="bidang_id" label="Menaungi Bidang"` (dependent on
 *   Bidang) and `x-form.input name="nama" label="Nama Seksi / Khidmah"`.
 * - NOTE: the page also renders a filter select labelled "Filter Bidang"
 *   (`name="bidang_id"`), so the add form is scoped via its "Simpan" button to
 *   avoid matching two `#bidang_id` controls.
 * - Edit form: submit button "Perbarui" (row-level "Edit" opens it).
 * - Delete: row-level "Hapus" button guarded by a native `confirm()` dialog.
 * - Feedback: `resources/views/components/alert.blade.php`.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class KhidmahPage {
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
    this.path = process.env.KHIDMAH_PATH || '/pengaturan/khidmah';
    this.heading = page.getByRole('heading', {
      name: 'Seksi / Khidmah',
      exact: true,
    });
    this.addButton = page.getByRole('button', {
      name: 'Tambah Seksi / Khidmah',
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

  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await expect(this.addForm.getByLabel('Nama Seksi / Khidmah')).toBeVisible();
  }

  /** Fill the add form and submit it. `bidang` is the visible Bidang name. */
  async addKhidmah(nama: string, bidang?: string): Promise<void> {
    await this.openAddForm();
    if (bidang) {
      await this.addForm
        .getByLabel('Menaungi Bidang')
        .selectOption({ label: bidang });
    }
    await this.addForm.getByLabel('Nama Seksi / Khidmah').fill(nama);
    await this.addForm
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  // --- Edit --------------------------------------------------------------

  async editName(currentName: string, newName: string): Promise<void> {
    const row = this.rowByName(currentName).first();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    const input = this.editForm.getByLabel('Nama Seksi / Khidmah');
    await expect(input).toBeVisible();
    await input.fill(newName);
    await this.editForm
      .getByRole('button', { name: 'Perbarui', exact: true })
      .click();
  }

  // --- Delete ------------------------------------------------------------

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

  async countRows(nama: string): Promise<number> {
    return this.rowByName(nama).count();
  }
}
