/**
 * Collect execution records from Playwright JSON reporter output.
 *
 * One record is produced per discovered TEST (a scenario), carrying every
 * attempt for that test. Retries are preserved as additional attempts and are
 * NEVER expanded into extra scenarios.
 */
import { readFileSync } from 'node:fs';

/** Remove ANSI colour/style escape codes so report text is plain. */
const stripAnsi = (value) => {
  if (value === null || value === undefined) return value;
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/\u001b\[[0-9;]*m/g, '');
};

const annotationMap = (annotations = []) => {
  const map = {};
  for (const a of annotations) {
    if (a && a.type && map[a.type] === undefined) {
      map[a.type] = a.description;
    }
  }
  return map;
};

/**
 * Flatten a Playwright JSON report into scenario records.
 *
 * @param {object} report parsed JSON report
 * @param {{ runId?: string, batchId?: string, reportRef?: string }} ctx
 * @returns {{ records: object[], unannotated: object[] }}
 */
export const collectRecords = (report, ctx = {}) => {
  const records = [];
  const unannotated = [];

  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const ann = annotationMap(test.annotations);
        const attempts = (test.results ?? []).map((r) => ({
          status: r.status,
          retry: r.retry ?? 0,
          durationMs: r.duration ?? 0,
          errorMessage: stripAnsi(r.error?.message ?? null),
          attachments: (r.attachments ?? []).map((a) => ({
            name: a.name,
            contentType: a.contentType,
            path: a.path ?? null,
          })),
        }));

        const scenarioId = ann['scenario-id'];
        if (!scenarioId) {
          unannotated.push({
            title: spec.title,
            file: spec.file,
            status: test.status,
          });
          continue;
        }

        records.push({
          scenarioId,
          scenario: ann['scenario'] ?? spec.title,
          requirementIds: ann['requirement-id'] ?? null,
          journey: ann['journey'] ?? null,
          role: ann['role'] ?? null,
          testStatus: test.status,
          skipReason: ann['skip'] ?? null,
          title: spec.title,
          file: spec.file,
          projectName: test.projectName,
          batchId: ctx.batchId ?? null,
          runId: ctx.runId ?? null,
          reportFile: ctx.reportRef ?? null,
          attempts,
          attemptsCount: attempts.length,
          totalDurationMs: attempts.reduce((sum, a) => sum + a.durationMs, 0),
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child);
  };

  for (const suite of report.suites ?? []) walk(suite);

  return { records, unannotated };
};

/** Load and flatten one or more Playwright JSON report files. */
export const loadBatchReports = (files) => {
  const records = [];
  const unannotated = [];
  const sources = [];

  for (const { file, ref, runId, batchId } of files) {
    let report;
    try {
      report = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to parse JSON report ${file}: ${error.message}`);
    }
    const result = collectRecords(report, {
      runId,
      batchId,
      reportRef: ref ?? file,
    });
    records.push(...result.records);
    unannotated.push(...result.unannotated.map((u) => ({ ...u, file })));
    sources.push({ file, ref: ref ?? file, runId, batchId });
  }

  return { records, unannotated, sources };
};
