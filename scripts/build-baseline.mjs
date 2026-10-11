#!/usr/bin/env node
/**
 * Build a derived, machine-readable snapshot of the APPROVED scenario baseline.
 *
 * The approved source of truth is the workbook
 *   SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx  (sheet: SCENARIOS)
 * It is NEVER modified by this script. This script only READS the workbook and
 * writes a derived JSON snapshot so that the reporting system (and CI, which may
 * not have the workbook) can reconcile results against every approved scenario.
 *
 * Usage:
 *   node scripts/build-baseline.mjs [path/to/workbook.xlsx]
 *
 * Resolution order for the workbook path:
 *   1. CLI argument
 *   2. SCENARIO_BASELINE_PATH environment variable
 *   3. A list of conventional locations (see candidates below)
 *
 * Output: baseline/scenarios.json
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSnapshot } from './reporting/snapshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const WORKBOOK_NAME = 'SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx';

const candidates = [
  process.argv[2],
  process.env.SCENARIO_BASELINE_PATH,
  path.join(repoRoot, 'docs', WORKBOOK_NAME),
  path.join(repoRoot, '..', 'docs', WORKBOOK_NAME),
  path.join(repoRoot, 'baseline', WORKBOOK_NAME),
].filter(Boolean);

const workbookPath = candidates.find((p) => existsSync(p));

if (!workbookPath) {
  console.error('Could not locate the approved workbook. Tried:');
  for (const c of candidates) console.error('  - ' + c);
  console.error(
    '\nSet SCENARIO_BASELINE_PATH or pass the workbook path as an argument.'
  );
  process.exit(2);
}

const main = async () => {
  const { snapshot, duplicates } = await buildSnapshot(workbookPath);

  const outDir = path.join(repoRoot, 'baseline');
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'scenarios.json');
  writeFileSync(outFile, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

  console.log(
    `Wrote ${outFile}\n  scenarios: ${snapshot.scenarioCount}\n  flow units: ${snapshot.flowUnitCount}`
  );
  if (duplicates.length) {
    console.error(`WARNING: duplicate scenario ids: ${duplicates.join(', ')}`);
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
