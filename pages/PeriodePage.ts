import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Periode" (approved journey J-S3).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Route: `routes/web.php` -> `pengaturan/periode` resource
 *   (`PeriodeController`); index path `/pengaturan/periode`.
 * - View: `resources/views/pengaturan/periode/index.blade.php`.
 * - Heading: `<h1>Periode Haul Akbar</h1>`.
 * - Add button: "Tambah Periode" (Alpine `addModalOpen`); submit "Simpan".
 *   Add fields: `select[name="haul_akbar_id"]` (pre-selected to the active HA),
 *   `input[name="tahun_masehi"]` (type=number), `input[name="tahun_hijriyah"]`,
 *   `select[name="status_periode_rab"]` (default "belum_dibuka"),
 *   `input[name="is_approval_required"]` (checkbox, checked by default).
 * - Edit modal (`editModalOpen`), opened from the row's "Edit" button; submit
 *   "Perbarui". It carries a hidden `name="haul_akbar_id"` populated from the
 *   active row via Alpine `x-model`.
 * - Delete: row-level "Hapus" inside a form guarded by native `confirm()`.
 * - The index has NO search field; it lists the periodes of the ACTIVE Haul
 *   Akbar only (`PeriodeController::index` -> `session('active_haul_akbar_id')`)
 *   and paginates (`PeriodeHaulAkbarService::paginate`).
 * - Feedback: `resources/views/components/alert.blade.php`.
 *
 * LOCATOR NOTE (shared form component):
 * `resources/views/components/form/input.blade.php` renders `id="{{ $name }}"`.
 * The add AND edit modals both contain `name="tahun_masehi"`,
 * `name="tahun_hijriyah"` and `name="status_periode_rab"`, so DUPLICATE ids
 * exist and `getByLabel` only binds to the first match. Fields are addressed by
 * the stable `name` attribute scoped to the correct form instead.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class PeriodePage {
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

  readonly addHaulSelect: Locator;
  readonly addTahunMasehi: Locator;
  readonly addTahunHijriyah: Locator;
  readonly addStatusSelect: Locator;

  readonly editTahunMasehi: Locator;
  readonly editTahunHijriyah: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = process.env.PERIODE_PATH || '/pengaturan/periode';
    this.heading = page.getByRole('heading', {
      name: 'Periode Haul Akbar',
      exact: true,
    });
    this.addButton = page.getByRole('button', {
      name: 'Tambah Periode',
      exact: true,
    });
    this.table = page.getByRole('table');
    this.addForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Simpan', exact: true }) });
    this.editForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Perbarui', exact: true }) });

    // CSS fallbacks (duplicate id across add/edit modals; see class note).
    this.addHaulSelect = this.addForm.locator('select[name="haul_akbar_id"]');
    this.addTahunMasehi = this.addForm.locator('input[name="tahun_masehi"]');
    this.addTahunHijriyah = this.addForm.locator('input[name="tahun_hijriyah"]');
    this.addStatusSelect = this.addForm.locator('select[name="status_periode_rab"]');
    this.editTahunMasehi = this.editForm.locator('input[name="tahun_masehi"]');
    this.editTahunHijriyah = this.editForm.locator('input[name="tahun_hijriyah"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await expect(this.heading).toBeVisible();
  }

  // --- Add ---------------------------------------------------------------

  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await expect(this.addTahunMasehi).toBeVisible();
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

  /**
   * Fill the add form and submit it.
   *
   * `haulAkbarLabel` is the visible Haul Akbar name; when omitted the
   * pre-selected active Haul Akbar is used (the list is scoped to it, so the
   * created Periode is then observable).
   */
  async addPeriode(input: {
    tahunMasehi: string;
    tahunHijriyah: string;
    haulAkbarLabel?: string;
    status?: string;
  }): Promise<void> {
    await this.openAddForm();
    if (input.haulAkbarLabel) {
      await this.addHaulSelect.selectOption({ label: input.haulAkbarLabel });
    }
    await this.addTahunMasehi.fill(input.tahunMasehi);
    await this.addTahunHijriyah.fill(input.tahunHijriyah);
    if (input.status) {
      await this.addStatusSelect.selectOption(input.status);
    }
    await this.addForm
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  // --- Edit --------------------------------------------------------------

  /** Edit the Periode row identified by its `tahun_masehi`. */
  async editPeriode(
    currentTahun: string,
    changes: { tahunMasehi?: string; tahunHijriyah?: string }
  ): Promise<void> {
    const row = this.rowByTahun(currentTahun).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(this.editTahunMasehi).toBeVisible();
    if (changes.tahunMasehi !== undefined) {
      await this.editTahunMasehi.fill(changes.tahunMasehi);
    }
    if (changes.tahunHijriyah !== undefined) {
      await this.editTahunHijriyah.fill(changes.tahunHijriyah);
    }
    await this.editForm
      .getByRole('button', { name: 'Perbarui', exact: true })
      .click();
  }

  // --- Delete ------------------------------------------------------------

  async deleteByTahun(tahun: string): Promise<void> {
    const row = this.rowByTahun(tahun).first();
    await expect(row).toBeVisible();
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  /** Best-effort cleanup: delete only when the row is actually present. */
  async deleteByTahunIfPresent(tahun: string): Promise<void> {
    const row = this.rowByTahun(tahun).first();
    if ((await row.count()) === 0) {
      return;
    }
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  // --- Assertions --------------------------------------------------------

  rowByTahun(tahun: string): Locator {
    return this.page.getByRole('row').filter({ hasText: String(tahun) });
  }

  async expectRow(tahun: string): Promise<void> {
    await expect(this.rowByTahun(tahun).first()).toBeVisible();
  }

  async expectRowAbsent(tahun: string): Promise<void> {
    await expect(this.rowByTahun(tahun)).toHaveCount(0);
  }

  /** Assert the row for `tahun` shows the given RAB status label. */
  async expectStatus(tahun: string, statusLabel: string): Promise<void> {
    const row = this.rowByTahun(tahun).first();
    await expect(row.getByText(statusLabel, { exact: false })).toBeVisible();
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

  async countRows(tahun: string): Promise<number> {
    return this.rowByTahun(tahun).count();
  }
}
