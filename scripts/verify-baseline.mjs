#!/usr/bin/env node
/**
 * Drift check for the committed baseline snapshot.
 *
 * Regenerates the credential-free snapshot from the APPROVED workbook (when
 * available) and compares it against the committed baseline/scenarios.json. If
 * they differ, the committed snapshot is stale or was hand-edited and the
 * command exits non-zero. The workbook is only READ; nothing is written.
 *
 * Usage:
 *   node scripts/verify-baseline.mjs [--workbook path.xlsx] [--require]
 *
 *   --workbook <p>  Use exactly this workbook (no fallback). Useful to force
 *                   the "workbook missing" path in tests.
 *   --require       Treat a missing workbook as an error (exit 2) instead of
 *                   a graceful skip (exit 0). Use this in CI where the
 *                   workbook is expected to be present.
 *
 * Exit codes: 0 = match or graceful skip, 1 = drift, 2 = missing workbook
 * (when --require), or 2 = missing committed snapshot.
 */
import { existsSync, readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSnapshot } from './reporting/snapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const WORKBOOK_NAME = 'SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx';

const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
};

const requireWorkbook = process.argv.includes('--require');
const explicitWorkbook = argValue('--workbook');
const explicitSnapshot = argValue('--snapshot');

const workbookCandidates = explicitWorkbook
  ? [explicitWorkbook]
  : [
      process.env.SCENARIO_BASELINE_PATH,
      path.join(repoRoot, 'docs', WORKBOOK_NAME),
      path.join(repoRoot, '..', 'docs', WORKBOOK_NAME),
      path.join(repoRoot, 'baseline', WORKBOOK_NAME),
    ].filter(Boolean);

const workbookPath = workbookCandidates.find((p) => existsSync(p));
const snapshotPath =
  explicitSnapshot ?? path.join(repoRoot, 'baseline', 'scenarios.json');

const main = async () => {
  if (!workbookPath) {
    const message =
      'Approved workbook not found; skipped drift check. Tried:\n' +
      workbookCandidates.map((c) => '  - ' + c).join('\n');
    if (requireWorkbook) {
      console.error(message);
      process.exitCode = 2;
    } else {
      console.log(message + '\n(pass --require to make this fatal)');
    }
    return;
  }

  if (!existsSync(snapshotPath)) {
    console.error(
      `Committed snapshot not found: ${snapshotPath}\n` +
        'Run: node scripts/build-baseline.mjs'
    );
    process.exitCode = 2;
    return;
  }

  const { snapshot: expected } = await buildSnapshot(workbookPath);
  const actual = JSON.parse(readFileSync(snapshotPath, 'utf8'));

  const problems = [];

  if (actual.scenarioCount !== expected.scenarioCount) {
    problems.push(
      `scenarioCount: committed=${actual.scenarioCount} workbook=${expected.scenarioCount}`
    );
  }
  if (actual.flowUnitCount !== expected.flowUnitCount) {
    problems.push(
      `flowUnitCount: committed=${actual.flowUnitCount} workbook=${expected.flowUnitCount}`
    );
  }

  const actualScenarios = Array.isArray(actual.scenarios) ? actual.scenarios : [];
  const expectedScenarios = expected.scenarios;
  const differingIds = [];

  const byId = new Map(
    actualScenarios.filter((s) => s && s.id).map((s) => [s.id, s])
  );
  for (const exp of expectedScenarios) {
    const act = byId.get(exp.id);
    if (!act) {
      differingIds.push(`${exp.id} (missing)`);
    } else if (!isDeepStrictEqual(act, exp)) {
      differingIds.push(`${exp.id} (changed)`);
    }
  }
  for (const act of actualScenarios) {
    if (act && act.id && !expectedScenarios.some((e) => e.id === act.id)) {
      differingIds.push(`${act.id} (unexpected)`);
    }
  }

  if (differingIds.length) {
    problems.push(
      `${differingIds.length} scenario(s) differ: ` +
        differingIds.slice(0, 10).join(', ') +
        (differingIds.length > 10 ? ', …' : '')
    );
  }

  if (problems.length) {
    console.error('Baseline DRIFT detected between workbook and committed snapshot:');
    for (const p of problems) console.error('  - ' + p);
    console.error('\nRegenerate with: node scripts/build-baseline.mjs');
    process.exitCode = 1;
    return;
  }

  console.log(
    `Baseline OK: committed snapshot matches the workbook ` +
      `(${expected.scenarioCount} scenarios, ${expected.flowUnitCount} flow units).`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
