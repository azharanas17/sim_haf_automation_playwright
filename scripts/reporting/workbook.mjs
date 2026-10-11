/**
 * Read the approved scenario workbook (READ-ONLY) into plain records.
 *
 * This module never writes the workbook. It is shared by the baseline snapshot
 * builder and by the reporting loader (when a .xlsx baseline is supplied).
 */
import ExcelJS from 'exceljs';

export const DEFAULT_SHEET = 'SCENARIOS';

/** Map approved workbook headers to stable keys used everywhere downstream. */
export const HEADER_MAP = {
  'Scenario ID': 'id',
  'Role / Persona': 'role',
  Journey: 'journey',
  'Journey Name': 'journeyName',
  'Requirement ID(s)': 'requirementIds',
  'Scenario Type': 'scenarioType',
  Scenario: 'scenario',
  Precondition: 'precondition',
  'Test Steps': 'testSteps',
  'Test Data': 'testData',
  'Expected Result': 'expectedResult',
  'Source Document': 'sourceDocument',
  'Source Section': 'sourceSection',
  'Source Evidence': 'sourceEvidence',
  Approval: 'approval',
  Readiness: 'readiness',
  Notes: 'notes',
};

/** Coerce an ExcelJS cell value to a plain string (or null). */
export const asText = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (Array.isArray(value.richText))
      return value.richText.map((r) => r.text).join('');
    if ('text' in value) return String(value.text);
    if ('result' in value) return String(value.result);
    if ('hyperlink' in value) return String(value.text ?? value.hyperlink);
  }
  return String(value);
};

/**
 * Read the SCENARIOS sheet. Returns { sourceWorkbook, sourceSheet, scenarios,
 * flowUnits }. Throws on a missing sheet or missing expected columns.
 */
export const readScenarioWorkbook = async (
  workbookPath,
  sheetName = DEFAULT_SHEET
) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${workbookPath}.`);
  }

  const columns = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = asText(cell.value)?.trim();
    if (header) columns.push({ colNumber, header, key: HEADER_MAP[header] });
  });

  const missing = Object.keys(HEADER_MAP).filter(
    (h) => !columns.some((c) => c.header === h)
  );
  if (missing.length) {
    throw new Error(
      `Workbook header is missing expected column(s): ${missing.join(', ')}`
    );
  }

  const scenarios = [];
  const seen = new Set();
  const duplicates = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const record = {};
    for (const col of columns) {
      record[col.key] = asText(row.getCell(col.colNumber).value);
    }
    if (!record.id) continue;
    if (seen.has(record.id)) duplicates.push(record.id);
    seen.add(record.id);
    scenarios.push(record);
  }

  const journeys = new Map();
  for (const s of scenarios) {
    if (!journeys.has(s.journey)) {
      journeys.set(s.journey, {
        journey: s.journey,
        journeyName: s.journeyName,
        scenarioCount: 0,
      });
    }
    journeys.get(s.journey).scenarioCount += 1;
  }

  return {
    sourceWorkbook: workbookPath,
    sourceSheet: sheetName,
    scenarioCount: scenarios.length,
    flowUnitCount: journeys.size,
    flowUnits: [...journeys.values()],
    scenarios,
    duplicates,
  };
};
