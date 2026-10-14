import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Haul Akbar" (approved journey J-S3).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Route: `routes/web.php` -> `pengaturan/haul-akbar` resource
 *   (`HaulAkbarController`); index path `/pengaturan/haul-akbar`.
 * - View: `resources/views/pengaturan/haul-akbar/index.blade.php`.
 * - Heading: `<h1>Haul Akbar</h1>`.
 * - Add button: "Tambah Haul Akbar" (opens Alpine add modal, `addModalOpen`).
 * - Add form: submit "Simpan"; fields `name="nama"`, `name="singkatan"`.
 * - Edit modal (`editModalOpen`) opened from the row's "Edit" button; submit
 *   "Perbarui". The form action is bound to `activeItem.id`.
 * - Delete: row-level "Hapus" (rendered ONLY when `periodes_count === 0`)
 *   inside a form guarded by native `confirm()`.
 * - The index has NO search field and paginates (`HaulAkbarService::paginate`).
 * - Feedback: `resources/views/components/alert.blade.php`.
 *
 * LOCATOR NOTE (shared form component):
 * `resources/views/components/form/input.blade.php` renders `id="{{ $name }}"`.
 * The add AND edit modals both contain `name="nama"`/`name="singkatan"`, so
 * DUPLICATE ids exist and `getByLabel` only binds to the first match. Fields are
 * addressed by the stable `name` attribute scoped to the correct form instead.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class HaulAkbarPage {
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

  readonly addNamaInput: Locator;
  readonly addSingkatanInput: Locator;
  readonly editNamaInput: Locator;
  readonly editSingkatanInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = process.env.HAUL_AKBAR_PATH || '/pengaturan/haul-akbar';
    this.heading = page.getByRole('heading', {
      name: 'Haul Akbar',
      exact: true,
    });
    this.addButton = page.getByRole('button', {
      name: 'Tambah Haul Akbar',
      exact: true,
    });
    this.table = page.getByRole('table');
    this.addForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Simpan', exact: true }) });
    this.editForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Perbarui', exact: true }) });

    // CSS fallbacks (duplicate id="nama"/id="singkatan" across add/edit modals).
    this.addNamaInput = this.addForm.locator('input[name="nama"]');
    this.addSingkatanInput = this.addForm.locator('input[name="singkatan"]');
    this.editNamaInput = this.editForm.locator('input[name="nama"]');
    this.editSingkatanInput = this.editForm.locator('input[name="singkatan"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await expect(this.heading).toBeVisible();
  }

  // --- Add ---------------------------------------------------------------

  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await expect(this.addNamaInput).toBeVisible();
  }

  /**
   * Dismiss the open add modal via its "Batal" button.
   *
   * A native HTML5 `required` rejection blocks the submit client-side, so no
   * navigation occurs and the modal (and its full-viewport overlay) stays open.
   */
  async closeAddForm(): Promise<void> {
    await this.addForm
      .getByRole('button', { name: 'Batal', exact: true })
      .click();
    await expect(this.addForm).toBeHidden();
  }

  async addHaulAkbar(nama: string, singkatan: string): Promise<void> {
    await this.openAddForm();
    await this.addNamaInput.fill(nama);
    await this.addSingkatanInput.fill(singkatan);
    await this.addForm
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  // --- Edit --------------------------------------------------------------

  async editHaulAkbar(
    currentNama: string,
    newNama: string,
    newSingkatan?: string
  ): Promise<void> {
    const row = this.rowByName(currentNama).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(this.editNamaInput).toBeVisible();
    await this.editNamaInput.fill(newNama);
    if (newSingkatan !== undefined) {
      await this.editSingkatanInput.fill(newSingkatan);
    }
    await this.editForm
      .getByRole('button', { name: 'Perbarui', exact: true })
      .click();
  }

  // --- Delete ------------------------------------------------------------

  async deleteByName(nama: string): Promise<void> {
    const row = this.rowByName(nama).first();
    await expect(row).toBeVisible();
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  /** Best-effort cleanup: delete only when the row is actually present. */
  async deleteByNameIfPresent(nama: string): Promise<void> {
    const row = this.rowByName(nama).first();
    if ((await row.count()) === 0) {
      return;
    }
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  // --- Assertions --------------------------------------------------------

  rowByName(nama: string): Locator {
    return this.page.getByRole('row').filter({ hasText: nama });
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
