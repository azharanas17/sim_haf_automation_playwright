import { defineConfig, devices } from '@playwright/test';
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

  /* HTML report for human review + list reporter for CLI output. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  /* Artifacts from failed runs are written here. */
  outputDir: 'test-results',

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
