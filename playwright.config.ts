import {
  defineConfig,
  devices,
  ReporterDescription,
} from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const parseWorkers = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parseRetries = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const headless = process.env.HEADLESS !== 'false';

/**
 * Reporters are environment-driven so the same project supports two modes:
 *
 *  - Local / single run (default): `list` + a consolidated `html` report.
 *  - Batched CI run: each batch writes a UNIQUE `blob` report (BLOB_DIR) plus a
 *    machine-readable `json` report (JSON_REPORT) that the scenario summary
 *    consumes. Blobs from every batch are later combined with
 *    `playwright merge-reports`.
 *
 * Blob output MUST be unique per batch (BLOB_DIR) so a later batch never
 * overwrites an earlier one.
 */
const reporters: ReporterDescription[] = [['list']];

if (process.env.BLOB_DIR) {
  reporters.push(['blob', { outputDir: process.env.BLOB_DIR }]);
} else {
  reporters.push([
    'html',
    {
      open: 'never',
      outputFolder: process.env.HTML_REPORT_DIR || 'playwright-report',
    },
  ]);
}

if (process.env.JSON_REPORT) {
  reporters.push(['json', { outputFile: process.env.JSON_REPORT }]);
}

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Test files are discovered in parallel. */
  fullyParallel: true,

  /* Fail the run if test.only is accidentally committed. */
  forbidOnly: !!process.env.CI,

  /* Retries are configurable through the environment. */
  retries: parseRetries(process.env.RETRIES),

  /* Worker count is configurable through the environment. */
  workers: parseWorkers(process.env.WORKERS),

  /*
   * Reporters for human review (html) and machine consumption (blob/json).
   * See the `reporters` block above; defaults are unchanged for local runs.
   */
  reporter: reporters,

  /*
   * Raw artifacts (traces/screenshots/videos) for failed runs. A batched run
   * sets PW_OUTPUT_DIR per batch so evidence is not overwritten across batches.
   */
  outputDir: process.env.PW_OUTPUT_DIR || 'test-results',

  use: {
    /* Base URL comes from the environment; never hardcoded. */
    baseURL: process.env.BASE_URL,

    /* Capture diagnostics on failure only. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    headless,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Web server is intentionally not configured in Phase 1. */
});
