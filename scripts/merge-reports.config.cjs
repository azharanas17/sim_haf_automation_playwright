/**
 * Config used only by `playwright merge-reports` (see scripts/merge-reports.mjs).
 * Lets the consolidated HTML report be written to a run-specific folder via
 * HTML_REPORT_DIR, instead of the default playwright-report/.
 */
module.exports = {
  reporter: [
    [
      'html',
      {
        open: 'never',
        outputFolder:
          process.env.HTML_REPORT_DIR || 'playwright-report',
      },
    ],
  ],
};
