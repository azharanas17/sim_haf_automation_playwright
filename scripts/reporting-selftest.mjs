#!/usr/bin/env node
/**
 * Reporting self-test.
 *
 * Runs the reporting pipeline against SYNTHETIC Playwright JSON (never staging)
 * and asserts status reconciliation, the Excel workbook structure and the CSV
 * export. Also unit-checks the status precedence rules.
 *
 * Usage: node scripts/reporting-selftest.mjs
 */
import ExcelJS from 'exceljs';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBaseline } from './reporting/baseline.mjs';
import { loadBatchReports } from './reporting/collect.mjs';
import { buildSummary } from './reporting/summary.mjs';
import { writeWorkbook, scenarioCsv } from './reporting/xlsx.mjs';
import { STATUS, worstStatus, classifySkip } from './reporting/status.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ' - ' + detail : ''}`);
  }
};

const RUN_ID = '20990101-000000';
const fixture = path.join(
  repoRoot,
  'scripts',
  '__fixtures__',
  'json',
  `${RUN_ID}__synthetic-a.json`
);

const main = async () => {
  console.log('Reporting self-test (synthetic data, no staging)');

  // Unit checks for the status model.
  check(
    'precedence FAILED > PASSED',
    worstStatus([STATUS.PASSED, STATUS.FAILED]) === STATUS.FAILED
  );
  check(
    'precedence PASSED > SKIPPED',
    worstStatus([STATUS.SKIPPED, STATUS.PASSED]) === STATUS.PASSED
  );
  check(
    'classify env skip as BLOCKED',
    classifySkip('BASE_URL is not configured; ...') === STATUS.BLOCKED
  );
  check(
    'classify deferred skip as SKIPPED',
    classifySkip('Requires a valid TOTP secret') === STATUS.SKIPPED
  );

  const baseline = await loadBaseline(
    path.join(repoRoot, 'baseline', 'scenarios.json')
  );
  const { records } = loadBatchReports([
    { file: fixture, ref: 'synthetic', runId: RUN_ID, batchId: 'synthetic-a' },
  ]);
  const summary = buildSummary({
    baseline,
    records,
    runId: RUN_ID,
    generatedAt: new Date().toISOString(),
  });
  const m = summary.run;

  check('one row per approved scenario', summary.rows.length === 339,
    `got ${summary.rows.length}`);
  check('reconciles', m.reconciles === true);
  check('passed = 2', m.passed === 2, `got ${m.passed}`);
  check('failed = 1', m.failed === 1, `got ${m.failed}`);
  check('skipped = 1', m.skipped === 1, `got ${m.skipped}`);
  check('blocked = 1', m.blocked === 1, `got ${m.blocked}`);
  check('notRun = 334', m.notRun === 334, `got ${m.notRun}`);
  check('flaky scenarios = 1', m.flakyScenarios === 1);
  check('pass rate = passed/executed',
    Math.abs(m.passRate - 2 / 3) < 1e-9, `got ${m.passRate}`);
  check('pass rate denominator = 3', m.passRateDenominator === 3);

  const byId = new Map(summary.rows.map((r) => [r.id, r]));
  check('TC-REQ-001 PASSED', byId.get('TC-REQ-001').status === STATUS.PASSED);
  check('TC-REQ-002 SKIPPED (deferred)',
    byId.get('TC-REQ-002').status === STATUS.SKIPPED);
  check('TC-REQ-003 PASSED + flaky',
    byId.get('TC-REQ-003').status === STATUS.PASSED &&
      byId.get('TC-REQ-003').flaky === true);
  check('TC-REQ-006 FAILED', byId.get('TC-REQ-006').status === STATUS.FAILED);
  check('TC-REQ-012 BLOCKED (env)',
    byId.get('TC-REQ-012').status === STATUS.BLOCKED);
  check('a NOT RUN scenario has no record',
    byId.get('TC-REQ-100').status === STATUS.NOT_RUN);

  // Workbook structure.
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'simhaf-selftest-'));
  try {
    const xlsxPath = path.join(tmp, 'summary.xlsx');
    await writeWorkbook(summary, baseline, xlsxPath);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(xlsxPath);
    const expectedSheets = [
      'Run Summary',
      'Scenarios',
      'Current Run',
      'Journeys',
      'Failures',
      'Skipped',
      'Not Run',
      'Methodology',
    ];
    for (const name of expectedSheets) {
      check(`workbook has sheet "${name}"`, Boolean(wb.getWorksheet(name)));
    }
    const scenariosSheet = wb.getWorksheet('Scenarios');
    check(
      'Scenarios sheet has header + 339 rows',
      scenariosSheet.rowCount === 340,
      `got ${scenariosSheet.rowCount}`
    );
    check(
      'Current Run sheet lists 5 covered scenarios',
      wb.getWorksheet('Current Run').rowCount === 6,
      `got ${wb.getWorksheet('Current Run').rowCount}`
    );
    check(
      'Failures sheet lists 1 scenario',
      (wb.getWorksheet('Failures').rowCount ?? 1) === 2
    );

    const csv = scenarioCsv(summary);
    const csvRows = csv.trim().split('\n').length;
    check('summary.csv has header + 339 rows', csvRows === 340,
      `got ${csvRows}`);
    check('summary.csv contains TC-REQ-001', csv.includes('TC-REQ-001'));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  if (failures) {
    console.error(`\nReporting self-test FAILED (${failures} check(s)).`);
    process.exit(1);
  }
  console.log('\nReporting self-test PASSED.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
