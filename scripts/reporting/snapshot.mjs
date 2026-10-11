/**
 * Builds the derived, credential-free snapshot object from the APPROVED
 * workbook. Shared by scripts/build-baseline.mjs (writes it) and
 * scripts/verify-baseline.mjs (drift check) so both agree byte-for-byte.
 *
 * The workbook is only ever READ here. Fields that can hold environment
 * specific sample data / credentials (Precondition, Test Steps, Test Data,
 * Source Evidence, Notes) are intentionally excluded.
 */
import path from 'node:path';
import { readScenarioWorkbook } from './workbook.mjs';

export const SNAPSHOT_FIELDS = [
  'id',
  'role',
  'journey',
  'journeyName',
  'requirementIds',
  'scenarioType',
  'scenario',
  'expectedResult',
  'sourceDocument',
  'sourceSection',
];

export const SNAPSHOT_COMMENT =
  'DERIVED, read-only snapshot of the approved baseline. Do not edit by ' +
  'hand; regenerate with scripts/build-baseline.mjs (verify with ' +
  'scripts/verify-baseline.mjs). The approved workbook remains the source of ' +
  'truth. Only traceability/expected-result fields are included; columns that ' +
  'can hold environment-specific sample data (Precondition, Test Steps, Test ' +
  'Data, Source Evidence, Notes) are intentionally omitted.';

/**
 * @param {string} workbookPath
 * @returns {Promise<{snapshot: object, duplicates: string[]}>}
 */
export const buildSnapshot = async (workbookPath) => {
  const result = await readScenarioWorkbook(workbookPath);

  const scenarios = result.scenarios.map((row) => {
    const picked = {};
    for (const key of SNAPSHOT_FIELDS) picked[key] = row[key] ?? null;
    return picked;
  });

  const snapshot = {
    $comment: SNAPSHOT_COMMENT,
    sourceWorkbook: path.basename(workbookPath),
    sourceSheet: result.sourceSheet,
    scenarioCount: scenarios.length,
    flowUnitCount: result.flowUnitCount,
    flowUnits: result.flowUnits,
    scenarios,
  };

  return { snapshot, duplicates: result.duplicates ?? [] };
};
