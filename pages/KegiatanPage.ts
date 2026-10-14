import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Timeline Kegiatan" (journeys J-K2, J-SU1, J-P1).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Routes: `routes/web.php` -> `kegiatan` resource + `kegiatan.export.*`.
 *   index GET `/kegiatan`, create GET `/kegiatan/create`, store POST `/kegiatan`,
 *   edit GET `/kegiatan/{id}/edit`, update PUT `/kegiatan/{id}`,
 *   destroy DELETE `/kegiatan/{id}`. NOTE: no `show()` method / no show view.
 * - Index view `resources/views/kegiatan/index.blade.php`: heading
 *   `<h1>Timeline Kegiatan</h1>`; create link "Tambah Agenda" inside
 *   `@can('create')`; export menu "Ekspor Data"; filter form with
 *   `input[name="search"]`, `select[name="bidang_id"]` (only when the user
 *   `canViewAllData()`), `select[name="tahap"]`, `select[name="status"]`,
 *   submit "Terapkan Filter"; per-card edit/delete controls gated by `@can`.
 * - Create view `resources/views/kegiatan/create.blade.php`: heading
 *   "Tambah Agenda Kegiatan"; fields `nama_kegiatan`, `bidang_id`, `khidmah_id`,
 *   `tanggal_mulai`, `tanggal_selesai`, `tahap`, `status`; submit "Simpan Agenda".
 * - Edit view: heading "Ubah Agenda Kegiatan"; submit "Perbarui Agenda".
 * - Flash (controller): 'Agenda kegiatan berhasil dibuat.' / 'diperbarui.' /
 *   'dihapus.'; validation error alert from `components/alert.blade.php`.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class KegiatanPage {
  readonly page: Page;

  readonly indexPath: string;
  readonly createPath: string;

  readonly heading: Locator;
  readonly addAgenda: Locator;
  readonly bidangSelect: Locator;
  readonly tahapSelect: Locator;
  readonly statusSelect: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;

  readonly createHeading: Locator;
  readonly editHeading: Locator;
  readonly namaInput: Locator;
  readonly tanggalMulaiInput: Locator;
  readonly tanggalSelesaiInput: Locator;
  readonly submitCreate: Locator;
  readonly submitEdit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indexPath = process.env.KEGIATAN_PATH || '/kegiatan';
    this.createPath = `${this.indexPath}/create`;
    this.heading = page.getByRole('heading', {
      name: 'Timeline Kegiatan',
      exact: true,
    });
    this.addAgenda = page.getByRole('link', {
      name: 'Tambah Agenda',
      exact: true,
    });
    this.bidangSelect = page.locator('select[name="bidang_id"]');
    this.tahapSelect = page.locator('select[name="tahap"]');
    this.statusSelect = page.locator('select[name="status"]');
    this.searchInput = page.locator('input[name="search"]');
    this.filterButton = page.getByRole('button', {
      name: 'Terapkan Filter',
      exact: true,
    });

    this.createHeading = page.getByRole('heading', {
      name: 'Tambah Agenda Kegiatan',
      exact: true,
    });
    this.editHeading = page.getByRole('heading', {
      name: 'Ubah Agenda Kegiatan',
      exact: true,
    });
    this.namaInput = page.locator('input[name="nama_kegiatan"]');
    this.tanggalMulaiInput = page.locator('input[name="tanggal_mulai"]');
    this.tanggalSelesaiInput = page.locator('input[name="tanggal_selesai"]');
    this.submitCreate = page.getByRole('button', {
      name: 'Simpan Agenda',
      exact: true,
    });
    this.submitEdit = page.getByRole('button', {
      name: 'Perbarui Agenda',
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.indexPath);
    await expect(this.heading).toBeVisible();
  }

  /** Open the create form; returns false when redirected (no active periode). */
  async gotoCreate(): Promise<boolean> {
    await this.page.goto(this.createPath);
    if (this.page.url().includes('/dashboard')) return false;
    await expect(this.createHeading).toBeVisible();
    return true;
  }

  /** The unrestricted "Semua Bidang" filter option (available to view-all roles). */
  bidangAllOption(): Locator {
    return this.bidangSelect.locator('option[value=""]');
  }

  /** First edit link rendered in the timeline (only when update is allowed). */
  editLink(id: number): Locator {
    return this.page.locator(`a[href*="/kegiatan/${id}/edit"]`);
  }

  async submitCreateForm(fields: {
    nama: string;
    bidang?: string;
    khidmah?: string;
    mulai: string;
    selesai: string;
    tahap?: string;
    status?: string;
  }): Promise<void> {
    await this.namaInput.fill(fields.nama);
    if (fields.bidang)
      await this.page.locator('select[name="bidang_id"]').selectOption(fields.bidang);
    if (fields.khidmah)
      await this.page.locator('select[name="khidmah_id"]').selectOption(fields.khidmah);
    await this.tanggalMulaiInput.fill(fields.mulai);
    await this.tanggalSelesaiInput.fill(fields.selesai);
    if (fields.tahap)
      await this.page.locator('select[name="tahap"]').selectOption(fields.tahap);
    if (fields.status)
      await this.page.locator('select[name="status"]').selectOption(fields.status);
    await this.submitCreate.first().click();
  }
}
