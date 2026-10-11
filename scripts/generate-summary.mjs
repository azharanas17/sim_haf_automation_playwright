#!/usr/bin/env node
/**
 * Generate the readable scenario execution summary (Excel + CSV + JSON) by
 * reconciling Playwright JSON report(s) against the full approved baseline.
 *
 * Usage:
 *   node scripts/generate-summary.mjs \
 *     [--run-id RUN_ID] \
 *     [--json reports/json/RUN__batch.json ...] \
 *     [--json-dir reports/json] \
 *     [--baseline baseline/scenarios.json] \
 *     [--out-dir reports/summary]
 *
 * Defaults:
 *   --run-id   $RUN_ID, else a timestamp.
 *   --json     every file in --json-dir whose name starts with the run id.
 *   --baseline $SCENARIO_BASELINE_PATH, else baseline/scenarios.json, else the
 *              approved workbook if present.
 *
 * Writes into --out-dir: summary.xlsx, summary.csv, journeys.csv,
 * metrics.csv, summary.json.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBaseline, resolveBaselinePath } from './reporting/baseline.mjs';
import { loadBatchReports } from './reporting/collect.mjs';
import { buildSummary } from './reporting/summary.mjs';
import {
  writeWorkbook,
  scenarioCsv,
  metricsCsv,
  journeysCsv,
} from './reporting/xlsx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const parseArgs = (argv) => {
  const args = { json: [], unknown: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--run-id':
        args.runId = next();
        break;
      case '--json':
        args.json.push(next());
        break;
      case '--json-dir':
        args.jsonDir = next();
        break;
      case '--baseline':
        args.baseline = next();
        break;
      case '--out-dir':
        args.outDir = next();
        break;
      default:
        if (a.startsWith('--')) args.unknown.push(a);
        else args.json.push(a);
    }
  }
  return args;
};

const defaultRunId = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  );
};

const batchIdFromFile = (file, runId) => {
  const base = path.basename(file).replace(/\.json$/i, '');
  const parts = base.split('__');
  if (parts.length >= 2) return parts.slice(1).join('__');
  return base.replace(`${runId}`, '').replace(/^[-_]+|[-_]+$/g, '') || base;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const runId = args.runId || process.env.RUN_ID || defaultRunId();
  const jsonDir = path.resolve(repoRoot, args.jsonDir || 'reports/json');
  const outDir = path.resolve(repoRoot, args.outDir || 'reports/summary');

  let jsonFiles = args.json.map((f) => path.resolve(f));
  if (!jsonFiles.length) {
    if (!exists(jsonDir)) {
      console.error(`No JSON reports found and ${jsonDir} does not exist.`);
      process.exit(2);
    }
    jsonFiles = readdirSync(jsonDir)
      .filter((f) => f.toLowerCase().endsWith('.json'))
      .filter((f) => f.startsWith(`${runId}__`) || f.startsWith(runId))
      .map((f) => path.join(jsonDir, f))
      .sort();
  }

  if (!jsonFiles.length) {
    console.error(`No Playwright JSON reports matched run id "${runId}".`);
    process.exit(2);
  }

  const pivot = resolveBaselinePath(repoRoot, args.baseline);
  if (!pivot) {
    console.error(
      'No baseline found. Run scripts/build-baseline.mjs or pass --baseline.'
    );
    process.exit(2);
  }

  const baseline = await loadBaseline(pivot);
  const files = jsonFiles.map((file) => ({
    file,
    ref: path.relative(repoRoot, file),
    runId,
    batchId: batchIdFromFile(file, runId),
  }));
  const { records, unannotated, sources } = loadBatchReports(files);

  const summary = buildSummary({
    baseline,
    records,
    runId,
    generatedAt: new Date().toISOString(),
  });
  summary.sources = sources;

  mkdirSync(outDir, { recursive: true });
  const written = [];
  const write = (name, content) => {
    const target = path.join(outDir, name);
    writeFileSync(target, content, 'utf8');
    written.push(target);
  };

  await writeWorkbook(summary, baseline, path.join(outDir, 'summary.xlsx'));
  written.push(path.join(outDir, 'summary.xlsx'));
  write('summary.csv', scenarioCsv(summary));
  write('journeys.csv', journeysCsv(summary));
  write('metrics.csv', metricsCsv(summary));
  write('summary.json', JSON.stringify(summary, null, 2) + '\n');

  const m = summary.run;
  console.log(`Run ${runId} - baseline coverage report`);
  console.log(
    `  approved=${m.approved} passed=${m.passed} failed=${m.failed} ` +
      `skipped=${m.skipped} blocked=${m.blocked} error=${m.error} notRun=${m.notRun}`
  );
  console.log(
    `  executed=${m.executed} coverage=${(m.coverageExecuted * 100).toFixed(2)}% ` +
      `passRate=${m.passRate === null ? 'n/a' : (m.passRate * 100).toFixed(2) + '%'}`
  );
  console.log(`  reconciles=${m.reconciles}`);
  if (unannotated.length) {
    console.warn(
      `  WARNING: ${unannotated.length} test(s) had no scenario-id annotation.`
    );
  }
  console.log('  wrote:');
  for (const w of written) console.log('    ' + path.relative(repoRoot, w));
};

const exists = (p) => {
  try {
    return readdirSync(p) !== undefined;
  } catch {
    return false;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
