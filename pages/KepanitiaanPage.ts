import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Kepanitiaan" (approved journeys J-S4 cascade
 * checks and J-S5 "Kelola Kepanitiaan").
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Routes: `routes/web.php` -> `pengaturan.kepanitiaan.*` resource
 *   (`KepanitiaaanController`); index `/pengaturan/kepanitiaan`,
 *   create `/pengaturan/kepanitiaan/create`, edit `/pengaturan/kepanitiaan/{id}/edit`.
 * - Index view: `resources/views/pengaturan/kepanitiaan/index.blade.php`.
 *   Heading `<h1>Struktur Panitia</h1>`; add link "Tambah Anggota Panitia";
 *   GET search `<input name="search" placeholder="Cari nama panitia...">`;
 *   row "Detail" (button), "Edit" (anchor), "Hapus" (form + native confirm()).
 *   The index paginates, so records are located via the app's own search.
 * - Create view: `resources/views/pengaturan/kepanitiaan/create.blade.php`.
 *   Heading "Tambah Anggota Panitia"; submit "Tambah Anggota". Fields
 *   `name="bidang_id"`, `name="khidmah_id"` (`:disabled="!selectedBidang"`,
 *   options filtered by parent Bidang), `x-form.input name="nama"`,
 *   `name="no_telp"`, `name="foto"` (file), cascade selects (no `name`) for
 *   Provinsi / Kota, `name="kecamatan_id"` for Kecamatan, `name="alamat_detail"`.
 *   Cascade selects are populated via `route('alamat.provinsis/kotas/kecamatans')`:
 *   `kotaSelected` clears kecamatans; both child selects are `:disabled` until
 *   their parent is chosen, so a child option can never be picked without the parent.
 * - Edit view: heading "Edit Anggota Panitia"; submit "Perbarui Anggota".
 * - Feedback: `resources/views/components/alert.blade.php`.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class KepanitiaanPage {
  readonly page: Page;

  readonly indexPath: string;
  readonly createPath: string;

  readonly heading: Locator;
  readonly addLink: Locator;
  readonly table: Locator;

  readonly searchInput: Locator;
  readonly searchButton: Locator;

  /** Create-form field wrappers (labels have no `for`, so xpath siblings). */
  readonly provinsiSelect: Locator;
  readonly kotaSelect: Locator;
  readonly kecamatanSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indexPath =
      process.env.KEPANITIAAN_PATH || '/pengaturan/kepanitiaan';
    this.createPath = `${this.indexPath}/create`;
    this.heading = page.getByRole('heading', {
      name: 'Struktur Panitia',
      exact: true,
    });
    this.addLink = page.getByRole('link', {
      name: 'Tambah Anggota Panitia',
      exact: true,
    });
    this.table = page.getByRole('table');
    this.searchInput = page.getByPlaceholder(/Cari nama/i);
    this.searchButton = page.getByRole('button', { name: 'Cari', exact: true });
    this.provinsiSelect = page.locator(
      "xpath=//label[normalize-space()='Provinsi']/following-sibling::select[1]"
    );
    this.kotaSelect = page.locator(
      "xpath=//label[normalize-space()='Kota / Kabupaten']/following-sibling::select[1]"
    );
    this.kecamatanSelect = page.locator(
      "xpath=//label[normalize-space()='Kecamatan']/following-sibling::select[1]"
    );
  }

  async gotoIndex(): Promise<void> {
    await this.page.goto(this.indexPath);
    await expect(this.heading).toBeVisible();
  }

  async gotoCreate(): Promise<void> {
    await this.page.goto(this.createPath);
    await expect(
      this.page.getByRole('heading', {
        name: 'Tambah Anggota Panitia',
        exact: true,
      })
    ).toBeVisible();
  }

  // --- Search ------------------------------------------------------------

  async searchNama(nama: string): Promise<void> {
    await this.searchInput.fill(nama);
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).pathname.endsWith(this.indexPath) &&
          new URL(response.url()).searchParams.get('search') === nama
      ),
      this.searchButton.click(),
    ]);
    await expect(this.table).toBeVisible();
  }

  // --- Create form -------------------------------------------------------

  /** Select a serving Bidang then a Khidmah nested under it. */
  async selectBidangKhidmah(bidang: string, khidmah: string): Promise<void> {
    const bidangSelect = this.page.locator('select[name="bidang_id"]');
    await bidangSelect.selectOption({ label: bidang });
    const khidmahSelect = this.page.locator('select[name="khidmah_id"]');
    await expect(khidmahSelect).toBeEnabled();
    await khidmahSelect.selectOption({ label: khidmah });
  }

  async fillNama(nama: string): Promise<void> {
    const input = this.page.locator('input[name="nama"]');
    await input.fill(nama);
  }

  /** Exercise the cascading Provinsi -> Kota -> Kecamatan selects. */
  async fillAlamatCascade(input: {
    provinsi: string;
    kota: string;
    kecamatan: string;
  }): Promise<void> {
    await this.provinsiSelect.selectOption({ label: input.provinsi });
    await expect(this.kotaSelect).toBeEnabled();
    await expect
      .poll(() => this.kotaSelect.locator('option').count(), {
        message: 'Kota options should load after selecting a Province',
      })
      .toBeGreaterThan(1);
    await this.kotaSelect.selectOption({ label: input.kota });
    await expect(this.kecamatanSelect).toBeEnabled();
    await expect
      .poll(() => this.kecamatanSelect.locator('option').count(), {
        message: 'Kecamatan options should load after selecting a City',
      })
      .toBeGreaterThan(1);
    await this.kecamatanSelect.selectOption({ label: input.kecamatan });
  }

  async submitCreate(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Tambah Anggota', exact: true })
      .click();
  }

  async addKepanitiaan(input: {
    nama: string;
    bidang: string;
    khidmah: string;
    noTelp?: string;
  }): Promise<void> {
    await this.gotoCreate();
    await this.selectBidangKhidmah(input.bidang, input.khidmah);
    await this.fillNama(input.nama);
    if (input.noTelp) {
      await this.page.locator('input[name="no_telp"]').fill(input.noTelp);
    }
    await this.submitCreate();
  }

  // --- Edit --------------------------------------------------------------

  async editNama(currentNama: string, newNama: string): Promise<void> {
    await this.gotoIndex();
    await this.searchNama(currentNama);
    const row = this.rowByNama(currentNama).first();
    await expect(row).toBeVisible();
    await row.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(
      this.page.getByRole('heading', {
        name: 'Edit Anggota Panitia',
        exact: true,
      })
    ).toBeVisible();
    await this.page.locator('input[name="nama"]').fill(newNama);
    await this.page
      .getByRole('button', { name: 'Perbarui Anggota', exact: true })
      .click();
  }

  // --- Delete ------------------------------------------------------------

  async deleteByName(nama: string): Promise<void> {
    await this.searchNama(nama);
    const row = this.rowByNama(nama).first();
    await expect(row).toBeVisible();
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  /** Best-effort cleanup: search, then delete only when the row is present. */
  async deleteByNameIfPresent(nama: string): Promise<void> {
    await this.gotoIndex();
    await this.searchNama(nama);
    const row = this.rowByNama(nama).first();
    if ((await row.count()) === 0) {
      return;
    }
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  // --- Assertions --------------------------------------------------------

  rowByNama(nama: string): Locator {
    return this.page.getByRole('row').filter({ hasText: nama });
  }

  async expectRow(nama: string): Promise<void> {
    await this.searchNama(nama);
    await expect(this.rowByNama(nama).first()).toBeVisible();
  }

  async expectRowAbsent(nama: string): Promise<void> {
    await this.searchNama(nama);
    await expect(this.rowByNama(nama)).toHaveCount(0);
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
}