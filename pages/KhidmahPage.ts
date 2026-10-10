import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Seksi / Khidmah" (approved journey J-S2).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Route: `routes/web.php` -> `Route::resource('khidmah', KhidmahController::class)`
 *   inside the `pengaturan` prefix; index path `/pengaturan/khidmah`.
 * - View: `resources/views/pengaturan/khidmah/index.blade.php`.
 * - Heading: `<h1>Seksi / Khidmah</h1>`.
 * - Add button: "Tambah Seksi / Khidmah".
 * - Search: GET form with `<input name="search" placeholder="Cari nama seksi...">`
 *   and a "Cari & Filter" submit button. Server filters `nama LIKE %search%`
 *   (`orderBy('nama')`, 20/page), so a new record may land on a later page.
 * - Add form: submit "Simpan"; `x-form.select name="bidang_id" label="Menaungi Bidang"`,
 *   `x-form.input name="nama" label="Nama Seksi / Khidmah"`.
 * - Edit form: submit "Perbarui"; `name="nama"` (row-level "Edit" opens the modal).
 * - Delete: row-level "Hapus" guarded by native `confirm()`.
 * - Feedback: `resources/views/components/alert.blade.php`.
 *
 * LOCATOR NOTE (shared form component):
 * `resources/views/components/form/*.blade.php` render `id="{{ $name }}"`. The
 * page renders `name="bidang_id"` twice (filter + add modal) and `name="nama"`
 * twice (add + edit modals), so DUPLICATE ids exist and a label `for="..."` only
 * associates with the FIRST match in the DOM. This is why the add Bidang select
 * and the `nama` inputs are addressed by the stable `name` attribute scoped to
 * the correct form, not by `getByLabel`.
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

  /** Add-form "Nama Seksi / Khidmah" input (scoped by `name`, see class note). */
  readonly addNamaInput: Locator;
  /** Add-form "Menaungi Bidang" select (scoped by `name`, see class note). */
  readonly addBidangSelect: Locator;

  /** Search controls from the index search card. */
  readonly searchInput: Locator;
  readonly searchButton: Locator;

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

    // CSS fallbacks (duplicate id="bidang_id" and id="nama" across modals/filter).
    this.addNamaInput = this.addForm.locator('input[name="nama"]');
    this.addBidangSelect = this.addForm.locator('select[name="bidang_id"]');

    // Placeholder is the only stable association for the search input (the
    // "Cari Nama" text is a label without a `for` attribute).
    this.searchInput = page.getByPlaceholder(/Cari nama/i);
    this.searchButton = page.getByRole('button', {
      name: 'Cari & Filter',
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  // --- Search ------------------------------------------------------------

  /**
   * Search the list by name and wait for the server-rendered results.
   *
   * The index paginates (20/page, ordered by `nama`), so a freshly created
   * record is not necessarily on the first page. This uses the application's
   * own search field (`search` GET param) rather than paging or guessing.
   */
  async searchName(nama: string): Promise<void> {
    await this.searchInput.fill(nama);
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).pathname.endsWith(this.path) &&
          new URL(response.url()).searchParams.get('search') === nama
      ),
      this.searchButton.click(),
    ]);
    await expect(this.table).toBeVisible();
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
   * List controls behind the overlay are then not clickable, so the modal must
   * be closed before any subsequent list interaction.
   */
  async closeAddForm(): Promise<void> {
    await this.addForm
      .getByRole('button', { name: 'Batal', exact: true })
      .click();
    await expect(this.addForm).toBeHidden();
  }

  /** Fill the add form and submit it. `bidang` is the visible Bidang name. */
  async addKhidmah(nama: string, bidang?: string): Promise<void> {
    await this.openAddForm();
    if (bidang) {
      await this.addBidangSelect.selectOption({ label: bidang });
    }
    await this.addNamaInput.fill(nama);
    await this.addForm
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  // --- Edit --------------------------------------------------------------

  async editName(currentName: string, newName: string): Promise<void> {
    await this.searchName(currentName);
    const row = this.rowByName(currentName).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    // CSS fallback: duplicate id="nama" (add + edit modals).
    const input = this.editForm.locator('input[name="nama"]');
    await expect(input).toBeVisible();
    await input.fill(newName);
    await this.editForm
      .getByRole('button', { name: 'Perbarui', exact: true })
      .click();
  }

  // --- Delete ------------------------------------------------------------

  async deleteByName(nama: string): Promise<void> {
    await this.searchName(nama);
    const row = this.rowByName(nama).first();
    await expect(row).toBeVisible();
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  /**
   * Best-effort cleanup variant of {@link deleteByName}: search, then delete
   * only if the row actually exists. Used from test `finally` blocks, where a
   * record may already have been renamed or removed by the scenario itself;
   * asserting visibility there would burn the full actionability timeout on an
   * expected-absent row.
   */
  async deleteByNameIfPresent(nama: string): Promise<void> {
    await this.searchName(nama);
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

  async expectDisplayed(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.addButton).toBeVisible();
  }

  async expectRow(nama: string): Promise<void> {
    await this.searchName(nama);
    await expect(this.rowByName(nama).first()).toBeVisible();
  }

  async expectRowAbsent(nama: string): Promise<void> {
    await this.searchName(nama);
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
    await this.searchName(nama);
    return this.rowByName(nama).count();
  }
}
