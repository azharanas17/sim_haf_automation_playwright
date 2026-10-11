/**
 * Baseline loader.
 *
 * Resolves and loads the approved scenario baseline used for FULL baseline
 * coverage reconciliation. Accepts either the derived JSON snapshot or the
 * original .xlsx workbook (read-only). The workbook is never modified.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { readScenarioWorkbook } from './workbook.mjs';

export const DEFAULT_WORKBOOK_NAME =
  'SIM_HAF_Requirement_Based_Test_Scenarios_v4.xlsx';

/** Resolve a baseline path from an explicit value, env, or conventional spots. */
export const resolveBaselinePath = (repoRoot, explicit) => {
  const candidates = [
    explicit,
    process.env.SCENARIO_BASELINE_PATH,
    path.join(repoRoot, 'baseline', 'scenarios.json'),
    path.join(repoRoot, 'docs', DEFAULT_WORKBOOK_NAME),
    path.join(repoRoot, '..', 'docs', DEFAULT_WORKBOOK_NAME),
    path.join(repoRoot, 'baseline', DEFAULT_WORKBOOK_NAME),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? null;
};

/** Load the baseline from a .xlsx workbook or a derived .json snapshot. */
export const loadBaseline = async (baselinePath) => {
  if (!baselinePath) {
    throw new Error(
      'No baseline available. Build baseline/scenarios.json ' +
        '(node scripts/build-baseline.mjs) or set SCENARIO_BASELINE_PATH.'
    );
  }

  if (baselinePath.toLowerCase().endsWith('.xlsx')) {
    const result = await readScenarioWorkbook(baselinePath);
    return normalize(result.scenarios, {
      source: baselinePath,
      sourceWorkbook: path.basename(baselinePath),
      flowUnits: result.flowUnits,
    });
  }

  const data = JSON.parse(readFileSync(baselinePath, 'utf8'));
  if (!Array.isArray(data.scenarios)) {
    throw new Error(`Baseline ${baselinePath} has no "scenarios" array.`);
  }
  return normalize(data.scenarios, {
    source: baselinePath,
    sourceWorkbook: data.sourceWorkbook ?? path.basename(baselinePath),
    flowUnits: data.flowUnits ?? deriveFlowUnits(data.scenarios),
  });
};

const deriveFlowUnits = (scenarios) => {
  const map = new Map();
  for (const s of scenarios) {
    if (!map.has(s.journey))
      map.set(s.journey, {
        journey: s.journey,
        journeyName: s.journeyName,
        scenarioCount: 0,
      });
    map.get(s.journey).scenarioCount += 1;
  }
  return [...map.values()];
};

const normalize = (scenarios, meta) => {
  const missingId = scenarios.filter((s) => !s?.id);
  if (missingId.length) {
    throw new Error(`Baseline contains ${missingId.length} row(s) without an id.`);
  }
  return {
    source: meta.source,
    sourceWorkbook: meta.sourceWorkbook,
    scenarioCount: scenarios.length,
    flowUnitCount: meta.flowUnits.length,
    flowUnits: meta.flowUnits,
    scenarios,
  };
};
