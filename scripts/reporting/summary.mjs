/**
 * Reconcile execution records against the full approved baseline and compute
 * metrics. Every approved scenario produces exactly one row.
 */
import { STATUS, statusForRecord, worstStatus } from './status.mjs';

const truncate = (value, max = 600) => {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text;
};

const reasonFor = (status, records) => {
  if (status === STATUS.FAILED || status === STATUS.ERROR) {
    for (let i = records.length - 1; i >= 0; i -= 1) {
      const attempts = records[i].attempts ?? [];
      for (let j = attempts.length - 1; j >= 0; j -= 1) {
        if (
          attempts[j].status === 'failed' ||
          attempts[j].status === 'timedOut' ||
          attempts[j].status === 'interrupted'
        ) {
          return truncate(attempts[j].errorMessage);
        }
      }
    }
  }
  if (status === STATUS.SKIPPED || status === STATUS.BLOCKED) {
    const withReason = [...records].reverse().find((r) => r.skipReason);
    return truncate(withReason?.skipReason ?? null);
  }
  return null;
};

export const buildSummary = ({ baseline, records, runId, generatedAt }) => {
  const byScenario = new Map();
  for (const record of records) {
    if (!byScenario.has(record.scenarioId)) byScenario.set(record.scenarioId, []);
    byScenario.get(record.scenarioId).push(record);
  }

  const rows = baseline.scenarios.map((scenario) => {
    const recs = byScenario.get(scenario.id) ?? [];
    const status = recs.length
      ? worstStatus(recs.map(statusForRecord))
      : STATUS.NOT_RUN;
    const batchIds = [...new Set(recs.map((r) => r.batchId).filter(Boolean))];
    const flaky = recs.some((r) => r.testStatus === 'flaky');
    const durationMs = recs.reduce((n, r) => n + r.totalDurationMs, 0);
    const attempts = recs.reduce((n, r) => n + r.attemptsCount, 0);
    const evidence = recs.map((r) => r.reportFile).filter(Boolean);

    return {
      id: scenario.id,
      journey: scenario.journey,
      journeyName: scenario.journeyName,
      requirementIds: scenario.requirementIds,
      scenarioType: scenario.scenarioType,
      scenario: scenario.scenario,
      expectedResult: scenario.expectedResult,
      status,
      flaky,
      attempts,
      durationMs,
      batchIds,
      reason: reasonFor(status, recs),
      evidence: [...new Set(evidence)],
      // True when the scenario produced a record in this run (executed, or
      // registered-and-skipped/blocked). Used for the "Current Run" scope.
      hasRecord: recs.length > 0,
    };
  });

  const count = (status) => rows.filter((r) => r.status === status).length;

  const approved = rows.length;
  const passed = count(STATUS.PASSED);
  const failed = count(STATUS.FAILED);
  const skipped = count(STATUS.SKIPPED);
  const blocked = count(STATUS.BLOCKED);
  const error = count(STATUS.ERROR);
  const notRun = count(STATUS.NOT_RUN);

  // Executed = the scenario produced a real execution attempt.
  const executed = passed + failed + error;
  // Accounted = every scenario Playwright knows about or that was registered.
  const accounted = passed + failed + skipped + blocked + error;

  const metrics = {
    approved,
    passed,
    failed,
    skipped,
    blocked,
    error,
    notRun,
    executed,
    accounted,
    // Coverage = executed / approved (does NOT count discovered-but-skipped).
    coverageExecuted: approved ? executed / approved : 0,
    // Registration coverage = accounted / approved (discovered + not-run gaps).
    coverageAccounted: approved ? accounted / approved : 0,
    // Pass rate denominator is the EXECUTED scenarios (passed+failed+error).
    passRateDenominator: executed,
    passRate: executed ? passed / executed : null,
    // A discovered test is NOT "tested"; only executed counts.
    reconciles: accounted + notRun === approved,
    flakyScenarios: rows.filter((r) => r.flaky).length,
  };

  const byJourney = baseline.flowUnits.map((unit) => {
    const unitRows = rows.filter((r) => r.journey === unit.journey);
    const jc = (status) => unitRows.filter((r) => r.status === status).length;
    const jExecuted = jc(STATUS.PASSED) + jc(STATUS.FAILED) + jc(STATUS.ERROR);
    return {
      journey: unit.journey,
      journeyName: unit.journeyName,
      approved: unitRows.length,
      passed: jc(STATUS.PASSED),
      failed: jc(STATUS.FAILED),
      skipped: jc(STATUS.SKIPPED),
      blocked: jc(STATUS.BLOCKED),
      error: jc(STATUS.ERROR),
      notRun: jc(STATUS.NOT_RUN),
      executed: jExecuted,
      passRate: jExecuted ? jc(STATUS.PASSED) / jExecuted : null,
    };
  });

  const runIds = [
    ...new Set(records.map((r) => r.runId).filter(Boolean)),
  ];
  const batchIds = [
    ...new Set(records.map((r) => r.batchId).filter(Boolean)),
  ];

  return {
    runId,
    generatedAt,
    runIds,
    batchIds,
    run: metrics,
    journeys: byJourney,
    rows,
    lists: {
      // Scope A - only scenarios covered by this run (have a record).
      currentRun: rows.filter((r) => r.hasRecord),
      // Scope B - approved scenarios not covered by this run.
      notRun: rows.filter((r) => r.status === STATUS.NOT_RUN),
      failed: rows.filter((r) => r.status === STATUS.FAILED),
      skippedOrBlocked: rows.filter(
        (r) => r.status === STATUS.SKIPPED || r.status === STATUS.BLOCKED
      ),
      flaky: rows.filter((r) => r.flaky),
    },
  };
};
