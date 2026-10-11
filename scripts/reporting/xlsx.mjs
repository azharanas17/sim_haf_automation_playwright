/**
 * Render a readable Excel workbook (+ CSV exports) from a computed summary.
 *
 * One row per approved scenario. The workbook is designed to be read by
 * non-technical stakeholders while remaining faithful to the baseline.
 */
import ExcelJS from 'exceljs';

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F3864' },
};
const HEADER_FONT = { color: { argb: 'FFFFFFFF' }, bold: true };

const STATUS_TONE = {
  PASSED: 'FFC6EFCE',
  FAILED: 'FFFFC7CE',
  SKIPPED: 'FFFFEB9C',
  BLOCKED: 'FFFFD8A8',
  ERROR: 'FFF4B084',
  'NOT RUN': 'FFE7E6E6',
};

const seconds = (ms) =>
  ms === null || ms === undefined ? null : Math.round((ms / 1000) * 10) / 10;

const addSheet = (workbook, name, columns, rows, { widths } = {}) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
  }));
  const headerRow = sheet.getRow(1);
  headerRow.font = HEADER_FONT;
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: 'middle' };
  headerRow.commit();

  for (const row of rows) sheet.addRow(row);

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  if (widths) {
    for (const [key, width] of Object.entries(widths)) {
      const col = sheet.getColumn(key);
      if (col) col.width = width;
    }
  }
  return sheet;
};

const paintStatus = (sheet, statusColumnKey) => {
  const col = sheet.getColumn(statusColumnKey);
  if (!col) return;
  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const cell = sheet.getCell(i, col.number);
    const tone = STATUS_TONE[cell.value];
    if (tone) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tone } };
    }
  }
};

const scenarioColumns = [
  { header: 'Scenario ID', key: 'id', width: 14 },
  { header: 'Journey', key: 'journey', width: 10 },
  { header: 'Flow Unit', key: 'journeyName', width: 42 },
  { header: 'Requirement ID(s)', key: 'requirementIds', width: 20 },
  { header: 'Type', key: 'scenarioType', width: 12 },
  { header: 'Scenario', key: 'scenario', width: 52 },
  { header: 'Expected Result', key: 'expectedResult', width: 42 },
  { header: 'Status', key: 'status', width: 11 },
  { header: 'Duration (s)', key: 'durationS', width: 12 },
  { header: 'Attempts', key: 'attempts', width: 9 },
  { header: 'Flaky', key: 'flaky', width: 7 },
  { header: 'Batch(es)', key: 'batches', width: 18 },
  { header: 'Reason', key: 'reason', width: 60 },
  { header: 'Evidence', key: 'evidence', width: 40 },
];

const toScenarioRow = (row) => ({
  id: row.id,
  journey: row.journey,
  journeyName: row.journeyName,
  requirementIds: row.requirementIds,
  scenarioType: row.scenarioType,
  scenario: row.scenario,
  expectedResult: row.expectedResult,
  status: row.status,
  durationS: seconds(row.durationMs),
  attempts: row.attempts,
  flaky: row.flaky ? 'yes' : '',
  batches: row.batchIds.join(', '),
  reason: row.reason,
  evidence: row.evidence.join('\n'),
});

export const writeWorkbook = async (summary, baseline, outFile) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIM HAF UAT reporting';
  workbook.created = new Date(summary.generatedAt);

  const m = summary.run;

  // --- Run Summary -------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Run Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 42 },
    { header: 'Value', key: 'value', width: 60 },
  ];
  summarySheet.getRow(1).font = HEADER_FONT;
  summarySheet.getRow(1).fill = HEADER_FILL;
  const summaryRows = [
    ['Run ID', summary.runId],
    ['Generated at', summary.generatedAt],
    ['Baseline workbook', baseline.sourceWorkbook ?? baseline.source],
    ['Baseline source', baseline.source],
    ['Approved scenarios (total)', m.approved],
    ['Passed', m.passed],
    ['Failed', m.failed],
    ['Skipped (deferred by design)', m.skipped],
    ['Blocked (prerequisite/env unavailable)', m.blocked],
    ['Error (interrupted)', m.error],
    ['Not run (no execution record)', m.notRun],
    ['Executed (passed+failed+error)', m.executed],
    ['Accounted (executed+skipped+blocked)', m.accounted],
    ['Execution coverage = executed / approved', pct(m.coverageExecuted)],
    ['Registration coverage = accounted / approved', pct(m.coverageAccounted)],
    ['Pass rate = passed / executed (denominator)', `${pct(m.passRate)} (denominator ${m.passRateDenominator})`],
    ['Flaky scenarios (passed on retry)', m.flakyScenarios],
    ['Counts reconcile (accounted + notRun = approved)', m.reconciles ? 'YES' : 'NO'],
    ['Batches in run', summary.batchIds.join(', ')],
    [
      'Consolidated HTML report',
      `reports/html/${summary.runId}/index.html`,
    ],
    [
      'Per-batch evidence (JSON)',
      summary.sources?.map((s) => s.ref).join('; ') ?? '',
    ],
  ];
  for (const [metric, value] of summaryRows) summarySheet.addRow({ metric, value });

  // --- Scenarios ---------------------------------------------------------
  const scenariosSheet = addSheet(
    workbook,
    'Scenarios',
    scenarioColumns,
    summary.rows.map(toScenarioRow)
  );
  paintStatus(scenariosSheet, 'status');

  // --- Current Run (scope A: only scenarios covered by this run) ---------
  const currentRunSheet = addSheet(
    workbook,
    'Current Run',
    scenarioColumns,
    summary.lists.currentRun.map(toScenarioRow)
  );
  paintStatus(currentRunSheet, 'status');

  // --- Journeys ----------------------------------------------------------
  const journeyColumns = [
    { header: 'Journey', key: 'journey', width: 10 },
    { header: 'Flow Unit', key: 'journeyName', width: 48 },
    { header: 'Approved', key: 'approved', width: 10 },
    { header: 'Passed', key: 'passed', width: 9 },
    { header: 'Failed', key: 'failed', width: 9 },
    { header: 'Skipped', key: 'skipped', width: 9 },
    { header: 'Blocked', key: 'blocked', width: 9 },
    { header: 'Error', key: 'error', width: 8 },
    { header: 'Not Run', key: 'notRun', width: 9 },
    { header: 'Executed', key: 'executed', width: 10 },
    { header: 'Pass Rate', key: 'passRate', width: 12 },
  ];
  addSheet(
    workbook,
    'Journeys',
    journeyColumns,
    summary.journeys.map((j) => ({ ...j, passRate: pct(j.passRate) }))
  );

  // --- Failures / Skipped / Not Run -------------------------------------
  addSheet(
    workbook,
    'Failures',
    [
      { header: 'Scenario ID', key: 'id', width: 14 },
      { header: 'Journey', key: 'journey', width: 10 },
      { header: 'Scenario', key: 'scenario', width: 52 },
      { header: 'Status', key: 'status', width: 11 },
      { header: 'Reason', key: 'reason', width: 80 },
      { header: 'Evidence', key: 'evidence', width: 40 },
    ],
    summary.lists.failed.map((r) => ({
      id: r.id,
      journey: r.journey,
      scenario: r.scenario,
      status: r.status,
      reason: r.reason,
      evidence: r.evidence.join('\n'),
    }))
  );

  addSheet(
    workbook,
    'Skipped',
    [
      { header: 'Scenario ID', key: 'id', width: 14 },
      { header: 'Journey', key: 'journey', width: 10 },
      { header: 'Scenario', key: 'scenario', width: 52 },
      { header: 'Status', key: 'status', width: 11 },
      { header: 'Reason', key: 'reason', width: 80 },
    ],
    summary.lists.skippedOrBlocked.map((r) => ({
      id: r.id,
      journey: r.journey,
      scenario: r.scenario,
      status: r.status,
      reason: r.reason,
    }))
  );

  addSheet(
    workbook,
    'Not Run',
    [
      { header: 'Scenario ID', key: 'id', width: 14 },
      { header: 'Journey', key: 'journey', width: 10 },
      { header: 'Flow Unit', key: 'journeyName', width: 48 },
      { header: 'Requirement ID(s)', key: 'requirementIds', width: 22 },
      { header: 'Scenario', key: 'scenario', width: 60 },
    ],
    summary.lists.notRun.map((r) => ({
      id: r.id,
      journey: r.journey,
      journeyName: r.journeyName,
      requirementIds: r.requirementIds,
      scenario: r.scenario,
    }))
  );

  // --- Methodology -------------------------------------------------------
  const method = workbook.addWorksheet('Methodology');
  method.columns = [
    { header: 'Item', key: 'item', width: 30 },
    { header: 'Definition', key: 'definition', width: 100 },
  ];
  method.getRow(1).font = HEADER_FONT;
  method.getRow(1).fill = HEADER_FILL;
  const methodRows = [
    ['Baseline', 'Approved workbook SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx (sheet SCENARIOS). Never modified.'],
    ['One row per scenario', 'Every approved scenario appears once, whether or not a Playwright test exists for it.'],
    ['PASSED', 'Executed and all assertions passed (includes flaky-recovered tests).'],
    ['FAILED', 'Executed and an assertion/test failed (final attempt unexpected).'],
    ['SKIPPED', 'Registered but intentionally not executed (deferred by design).'],
    ['BLOCKED', 'Not executed because a prerequisite/environment was unavailable (BASE_URL/credentials/TOTP).'],
    ['ERROR', 'Execution was interrupted or produced an unexpected harness outcome.'],
    ['NOT RUN', 'Approved scenario with no execution record in this run.'],
    ['Status precedence (multiple records)', 'FAILED > ERROR > PASSED > BLOCKED > SKIPPED > NOT RUN.'],
    ['Retries', 'Retries are attempts of the same scenario. They are never counted as extra scenarios.'],
    ['Flaky', 'Failed on an earlier attempt, passed on retry. Status PASSED; flag flaky=yes.'],
    ['Execution coverage', 'executed / approved, where executed = passed + failed + error.'],
    ['Registration coverage', 'accounted / approved, where accounted = executed + skipped + blocked.'],
    ['Pass rate', 'passed / executed (denominator = passed + failed + error). Null if executed = 0.'],
    ['Reconciliation', 'accounted + notRun = approved (must always hold).'],
    ['Discovered != tested', 'A test listed by `playwright test --list` is NOT counted as tested until executed.'],
    ['Duration', 'Sum of all attempt durations for the scenario (milliseconds).'],
  ];
  for (const [item, definition] of methodRows) method.addRow({ item, definition });

  await workbook.xlsx.writeFile(outFile);
  return outFile;
};

const pct = (value) =>
  value === null || value === undefined ? '' : `${(value * 100).toFixed(2)}%`;

// --- CSV helpers -------------------------------------------------------

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers, rows) => {
  const lines = [headers.map((h) => csvEscape(h.header)).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h.key])).join(','));
  }
  return lines.join('\n') + '\n';
};

export const scenarioCsv = (summary) =>
  toCsv(scenarioColumns, summary.rows.map(toScenarioRow));

export const metricsCsv = (summary) => {
  const m = summary.run;
  const rows = [
    ['run_id', summary.runId],
    ['generated_at', summary.generatedAt],
    ['approved', m.approved],
    ['passed', m.passed],
    ['failed', m.failed],
    ['skipped', m.skipped],
    ['blocked', m.blocked],
    ['error', m.error],
    ['not_run', m.notRun],
    ['executed', m.executed],
    ['accounted', m.accounted],
    ['coverage_executed', (m.coverageExecuted * 100).toFixed(2) + '%'],
    ['coverage_accounted', (m.coverageAccounted * 100).toFixed(2) + '%'],
    ['pass_rate', m.passRate === null ? '' : (m.passRate * 100).toFixed(2) + '%'],
    ['pass_rate_denominator', m.passRateDenominator],
    ['flaky', m.flakyScenarios],
    ['reconciles', m.reconciles ? 'YES' : 'NO'],
  ];
  return toCsv(
    [
      { header: 'metric', key: 'metric' },
      { header: 'value', key: 'value' },
    ],
    rows.map(([metric, value]) => ({ metric, value }))
  );
};

export const journeysCsv = (summary) =>
  toCsv(
    [
      { header: 'journey', key: 'journey' },
      { header: 'flow_unit', key: 'journeyName' },
      { header: 'approved', key: 'approved' },
      { header: 'passed', key: 'passed' },
      { header: 'failed', key: 'failed' },
      { header: 'skipped', key: 'skipped' },
      { header: 'blocked', key: 'blocked' },
      { header: 'error', key: 'error' },
      { header: 'not_run', key: 'notRun' },
      { header: 'executed', key: 'executed' },
      { header: 'pass_rate', key: 'passRate' },
    ],
    summary.journeys.map((j) => ({ ...j, passRate: pct(j.passRate) }))
  );
