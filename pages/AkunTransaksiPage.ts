import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Keuangan > Master Akun Transaksi" (approved journey J-S7).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Routes: `routes/web.php` -> `keuangan.akun-transaksi.*`
 *   (`AkunTransaksiController`, nested under `/pengaturan/keuangan`),
 *   Superadmin-only in the sidebar (`@if isSuperadmin`):
 *   GET `/pengaturan/keuangan/akun-transaksi`, plus POST/PUT/DELETE
 *   `penerimaan` / `pengeluaran` / `sub-agenda`.
 * - Index view: `resources/views/keuangan/akun-transaksi/index.blade.php`
 *   (`x-data="masterAkunManager('{{ request('tab', 'penerimaan') }}')"`).
 *   Heading `<h1>Master Akun Transaksi</h1>`; tabs are role=button elements
 *   "Akun Penerimaan" / "Akun Pengeluaran" / "Sub-Agenda & Kategori"
 *   (`@click="activeTab = ..."`). Per-tab add buttons "Tambah Akun Penerimaan",
 *   "Tambah Akun Pengeluaran", "Tambah Sub-Agenda"; each tab has its own GET
 *   `name="search"` input (placeholder "Kode / Nama akun / Kategori...").
 * - Modals are `x-show="showPenerimaanModal"` / `showPengeluaranModal` /
 *   `showSubAgendaModal`, so the open modal is the ONLY visible one and is
 *   scoped here via its `x-show` attribute. Penerimaan create mode does NOT
 *   render a kode field (auto-generated kode; `template x-if=isEditPenerimaan`
 *   wraps the kode input), whereas Pengeluaran create mode DOES edit kode.
 * - Deletes are `<form>` POST + native `confirm()` per row.
 * - Feedback: `components/alert.blade.php` -- server validation failures render
 *   the global alert whose first line is 'Terdapat kesalahan validasi pada
 *   form:' followed by the per-field errors.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class AkunTransaksiPage {
  readonly page: Page;

  readonly indexPath: string;

  readonly heading: Locator;

  readonly tabPenerimaan: Locator;
  readonly tabPengeluaran: Locator;
  readonly tabSubAgenda: Locator;

  readonly addPenerimaanButton: Locator;
  readonly addPengeluaranButton: Locator;
  readonly addSubAgendaButton: Locator;

  private readonly penerimaanModal = (): Locator =>
    this.page.locator('[x-show="showPenerimaanModal"]');
  private readonly pengeluaranModal = (): Locator =>
    this.page.locator('[x-show="showPengeluaranModal"]');

  constructor(page: Page) {
    this.page = page;
    this.indexPath =
      process.env.AKUN_TRANSAKSI_PATH || '/pengaturan/keuangan/akun-transaksi';
    this.heading = page.getByRole('heading', {
      name: 'Master Akun Transaksi',
      exact: true,
    });
    this.tabPenerimaan = page.getByRole('button', { name: /Akun Penerimaan/i });
    this.tabPengeluaran = page.getByRole('button', { name: /Akun Pengeluaran/i });
    this.tabSubAgenda = page.getByRole('button', { name: /Sub-Agenda & Kategori/i });
    this.addPenerimaanButton = page.getByRole('button', {
      name: 'Tambah Akun Penerimaan',
      exact: true,
    });
    this.addPengeluaranButton = page.getByRole('button', {
      name: 'Tambah Akun Pengeluaran',
      exact: true,
    });
    this.addSubAgendaButton = page.getByRole('button', {
      name: 'Tambah Sub-Agenda',
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.indexPath);
    await expect(this.heading).toBeVisible();
  }

  // --- Tabs & search -----------------------------------------------------

  async openTab(tab: 'penerimaan' | 'pengeluaran' | 'sub_agenda'): Promise<void> {
    const target =
      tab === 'penerimaan'
        ? this.tabPenerimaan
        : tab === 'pengeluaran'
          ? this.tabPengeluaran
          : this.tabSubAgenda;
    await target.click();
  }

  async search(tab: 'penerimaan' | 'pengeluaran', text: string): Promise<void> {
    await this.openTab(tab);
    const section = this.page.locator(
      `[x-show="activeTab === '${tab}'"]`
    );
    const input = section.locator('input[name="search"]');
    await input.fill(text);
    await input.press('Enter');
    await expect(this.page.getByRole('table').first()).toBeVisible();
  }

  // --- Create ------------------------------------------------------------

  async addPenerimaan(input: { nama: string; kategori: string }): Promise<void> {
    await this.openTab('penerimaan');
    await this.addPenerimaanButton.click();
    await expect(this.penerimaanModal()).toBeVisible();
    await this.penerimaanModal().locator('input[name="nama"]').fill(input.nama);
    await this.penerimaanModal()
      .locator('input[name="kategori_wilayah"]')
      .fill(input.kategori);
    await this.penerimaanModal()
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  async addPengeluaran(input: { kode: string; nama: string; kategori: string }): Promise<void> {
    await this.openTab('pengeluaran');
    await this.addPengeluaranButton.click();
    await expect(this.pengeluaranModal()).toBeVisible();
    await this.pengeluaranModal().locator('input[name="kode"]').fill(input.kode);
    await this.pengeluaranModal().locator('input[name="nama"]').fill(input.nama);
    await this.pengeluaranModal().locator('input[name="kategori"]').fill(input.kategori);
    await this.pengeluaranModal()
      .getByRole('button', { name: 'Simpan', exact: true })
      .click();
  }

  // --- Delete (native confirm) ------------------------------------------

  async deleteByTextIfPresent(tab: 'penerimaan' | 'pengeluaran', text: string): Promise<void> {
    await this.search(tab, text);
    const row = this.rowByText(text).first();
    if ((await row.count()) === 0) {
      return;
    }
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  // --- Assertions --------------------------------------------------------

  rowByText(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  async expectRow(tab: 'penerimaan' | 'pengeluaran', text: string): Promise<void> {
    await this.search(tab, text);
    await expect(this.rowByText(text).first()).toBeVisible();
  }

  async expectSuccess(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }).first()
    ).toBeVisible();
  }

  async expectValidationError(): Promise<void> {
    await expect(
      this.page.getByText('Terdapat kesalahan validasi pada form:').first()
    ).toBeVisible();
  }
}