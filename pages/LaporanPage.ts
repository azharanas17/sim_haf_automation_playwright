import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Laporan & Ekspor" (approved journey J-K1).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Routes: `routes/web.php` -> `laporan.*` (`LaporanController`):
 *   GET `/laporan` (index, `authorize('viewAny')` = true for any auth user),
 *   POST `/laporan/generate` (policy `generate` per report type),
 *   GET `/laporan/preview/{jenis}`, GET `/laporan/download/{export}`
 *   (owner-only via `download` policy).
 * - Index view: `resources/views/laporan/index.blade.php`. Heading
 *   `<h1>Laporan & Ekspor</h1>`; generate form:
 *   `select[name="jenis_laporan"]` (option values are LaporanType enum values
 *   rp1..rp7), `input[name="format"]` radios pdf/excel, `select[name="bidang_id"]`
 *   (default option "— Semua Bidang —"), `select[name="akun_penerimaan_id"]`
 *   ("— Semua Akun —"), submit button "Generate Laporan". Right column
 *   "Riwayat Export Saya" lists exports with an "Unduh" download link.
 * - Feedback: `components/alert.blade.php`. `LaporanController::generate`
 *   flashes 'Laporan berhasil diproses dan siap diunduh.'.
 *
 * Report types relevant to J-K1: rp2 (Rekap Penerimaan) and rp3 (Detail
 * Transaksi) - both require canViewAllData (Ketua Umum qualifies) per
 * `app/Policies/LaporanPolicy.php`.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class LaporanPage {
  readonly page: Page;

  readonly indexPath: string;

  readonly heading: Locator;
  readonly jenisSelect: Locator;
  readonly formatPdf: Locator;
  readonly formatExcel: Locator;
  readonly bidangSelect: Locator;
  readonly generateButton: Locator;
  readonly historyHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indexPath = process.env.LAPORAN_PATH || '/laporan';
    this.heading = page.getByRole('heading', {
      name: 'Laporan & Ekspor',
      exact: true,
    });
    this.jenisSelect = page.locator('select[name="jenis_laporan"]');
    this.formatPdf = page.locator('input[name="format"][value="pdf"]');
    this.formatExcel = page.locator('input[name="format"][value="excel"]');
    this.bidangSelect = page.locator('select[name="bidang_id"]');
    this.generateButton = page.getByRole('button', {
      name: 'Generate Laporan',
      exact: true,
    });
    this.historyHeading = page.getByText('Riwayat Export Saya', {
      exact: false,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(this.indexPath);
    await expect(this.heading).toBeVisible();
  }

  async generate(input: {
    jenis: 'rp1' | 'rp2' | 'rp3' | 'rp4' | 'rp5' | 'rp6' | 'rp7';
    format: 'pdf' | 'excel';
  }): Promise<void> {
    await this.jenisSelect.selectOption(input.jenis);
    if (input.format === 'pdf') {
      await this.formatPdf.check();
    } else {
      await this.formatExcel.check();
    }
    await this.generateButton.click();
  }

  async expectSuccess(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }).first()
    ).toBeVisible();
  }
}