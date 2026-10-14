import { expect, Locator, Page } from '@playwright/test';

/**
 * Page object for "Pengaturan > Backup & Restore" (approved journey J-S8
 * "Pantau & Audit", LR-7 / SR-9 — scenario TC-REQ-062, on-demand snapshot).
 *
 * LOCATOR PROVENANCE (grounded in development source):
 * - Routes: `routes/web.php` -> `pengaturan.backup.*` (`BackupController`,
 *   in the Superadmin `@can` sidebar block): index GET `/pengaturan/backup`,
 *   POST `backup/run`, POST `backup/delete/{filename}` (native confirm()),
 *   GET `backup/download/{filename}`, POST `backup/restore` (modal typed
 *   "RESTORE").
 * - Index view: `resources/views/pengaturan/backup/index.blade.php`. Heading
 *   `<h1>Backup & Restore</h1>`. Snapshot trigger: a `<form>` POST to
 *   `backup.run` whose submit button contains the label span "Buat Snapshot
 *   Baru" (loading label "Membuat Backup..."). The backup table columns:
 *   Nama Berkas / Ukuran / Tanggal Dibuat / Aksi (Download link, Restore
 *   button, Hapus = DELETE form + `onsubmit` confirm()).
 * - Success feedback (verbatim): `BackupController::create` flashes
 *   'Snapshot backup database & storage berhasil dibuat.'; delete flashes
 *   'File backup berhasil dihapus.'. Rendered by
 *   `resources/views/components/alert.blade.php`.
 *
 * NOTE: this module creates real on-demand snapshots (database + storage). The
 * created snapshot is deleted in a best-effort cleanup right after the
 * assertion, so no test artifact is left on the environment.
 *
 * UI interaction only; no business rules or scenario expectations here.
 */
export class BackupPage {
  readonly page: Page;

  readonly indexPath: string;

  readonly heading: Locator;
  readonly createButton: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.indexPath = process.env.BACKUP_PATH || '/pengaturan/backup';
    this.heading = page.getByRole('heading', {
      name: 'Backup & Restore',
      exact: true,
    });
    this.createButton = page.getByRole('button', {
      name: 'Buat Snapshot Baru',
      exact: true,
    });
    this.table = page.getByRole('table');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.indexPath);
    await expect(this.heading).toBeVisible();
  }

  async rowCount(): Promise<number> {
    return this.table.locator('tbody tr').count();
  }

  async createSnapshot(): Promise<void> {
    await this.createButton.click();
  }

  /** Delete the snapshot row identified by its filename (native confirm). */
  async deleteByFilename(filename: string): Promise<void> {
    const row = this.table.locator('tbody tr').filter({ hasText: filename });
    await expect(row.first()).toBeVisible();
    this.page.once('dialog', (dialog) => dialog.accept());
    await row.first().getByRole('button', { name: 'Hapus', exact: true }).click();
  }

  /** Best-effort cleanup of the newest (first row) snapshot when present. */
  async deleteNewestIfPresent(beforeCount: number): Promise<void> {
    if ((await this.rowCount()) <= beforeCount) {
      return;
    }
    const firstRow = this.table.locator('tbody tr').first();
    if ((await firstRow.count()) === 0) {
      return;
    }
    const filename = (await firstRow.locator('td').first().textContent())?.trim() ?? '';
    if (filename) {
      this.page.once('dialog', (dialog) => dialog.accept());
      await firstRow.getByRole('button', { name: 'Hapus', exact: true }).click();
    }
  }

  async expectSuccess(message: string): Promise<void> {
    await expect(
      this.page.getByText(message, { exact: false }).first()
    ).toBeVisible();
  }
}