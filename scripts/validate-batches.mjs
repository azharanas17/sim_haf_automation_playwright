#!/usr/bin/env node
/**
 * Validate the batch selection in reporting.config.json WITHOUT executing tests.
 *
 * It lists tests only (`playwright test --list`), so it never touches staging.
 * Checks that:
 *   - every batch's declared scenarioIds are exactly the tests it selects;
 *   - the union of all batches equals every implemented scenario;
 *   - no scenario is selected by more than one batch;
 *   - the declared loginPolicy is internally consistent and respects the
 *     application login throttle (see validateLoginPolicy);
 *   - no scenario is REGISTERED more than once. Duplicate detection runs on the
 *     raw --list output, line by line, so a scenario registered twice is visible
 *     even though the ids are identical (a Set-based parser hides this);
 *   - every registered scenario id exists in the approved baseline, and every
 *     approved baseline scenario is registered (traceability both ways);
 *   - every discovered test line carries exactly one scenario id (an idless or
 *     multi-id line is untraceable metadata).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const playwrightBin = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright'
);

const config = JSON.parse(
  readFileSync(path.join(repoRoot, 'reporting.config.json'), 'utf8')
);

const baselinePath = path.join(repoRoot, 'baseline', 'scenarios.json');

const loadApprovedIds = () => {
  let baseline;
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    return { error: `Cannot read approved baseline ${baselinePath}: ${error.message}` };
  }
  const scenarios = Array.isArray(baseline.scenarios) ? baseline.scenarios : [];
  const ids = scenarios
    .filter((s) => s && typeof s.id === 'string')
    .map((s) => s.id)
    .sort();
  return { ids };
};

/**
 * Validate the declared login budget against the application throttle.
 *
 * The throttle (routes/web.php:33 -> AppServiceProvider Limit::perMinute) is a
 * fixed 60s window of `loginAttemptsPerMinutePerIdentity` attempts per
 * email+IP. `expectedLogins` counts ALL login POSTs (successful and failed)
 * because the throttle counts both. We keep a safety margin below the throttle
 * so a stray retry or manual login cannot push a batch over the limit.
 */
const validateLoginPolicy = (config) => {
  const problems = [];
  const policy = config.loginPolicy;
  if (!policy) {
    return ['reporting.config.json is missing "loginPolicy".'];
  }

  const throttle = policy.loginAttemptsPerMinutePerIdentity;
  const max = policy.maxLoginsPerBatch;
  const cooldown = policy.cooldownSecondsAfterBatch;
  const workers = policy.workersPerBatch;

  if (!Number.isInteger(throttle) || throttle <= 0)
    problems.push(
      `loginPolicy.loginAttemptsPerMinutePerIdentity must be a positive integer (got ${throttle}).`
    );
  if (!Number.isInteger(max) || max <= 0)
    problems.push(
      `loginPolicy.maxLoginsPerBatch must be a positive integer (got ${max}).`
    );
  else if (Number.isInteger(throttle) && max >= throttle)
    problems.push(
      `loginPolicy.maxLoginsPerBatch (${max}) must be < the throttle (${throttle}) to leave a safety margin.`
    );
  if (!Number.isInteger(cooldown) || cooldown < 60)
    problems.push(
      `loginPolicy.cooldownSecondsAfterBatch must be an integer >= 60 (got ${cooldown}); the throttle window is 60s.`
    );
  if (workers !== 1)
    problems.push(
      `loginPolicy.workersPerBatch must be 1 (got ${workers}); parallel logins bunch inside the 60s window.`
    );

  for (const batch of config.batches ?? []) {
    const n = batch.expectedLogins;
    if (!Number.isInteger(n) || n < 0)
      problems.push(
        `Batch "${batch.id}" expectedLogins must be a non-negative integer (got ${n}).`
      );
    else if (Number.isInteger(max) && n > max)
      problems.push(
        `Batch "${batch.id}" expectedLogins (${n}) exceeds loginPolicy.maxLoginsPerBatch (${max}).`
      );
  }

  return problems;
};

/**
 * A single test entry in `playwright test --list` output looks like:
 *   "  [chromium] › tests/auth/auth.spec.ts:12:3 › TC-REQ-001 - ..."
 * We match the bracketed project marker + bullet, then read the ids from that
 * line only. This keeps the raw registration structure (one line per test) so
 * duplicates can be counted, instead of collapsing everything into a Set.
 */
const TEST_LINE = /^\s*\[[^\]]+\]\s+›/u;
const SCENARIO_ID = /TC-REQ-\d{3}/g;

const listTests = (args) => {
  let output = '';
  try {
    output = execFileSync(playwrightBin, ['test', ...args, '--list'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env },
    });
  } catch (error) {
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }

  const lines = output.split(/\r?\n/).filter((line) => TEST_LINE.test(line));
  const counts = new Map();
  const idless = [];
  const multiId = [];

  for (const line of lines) {
    const ids = [...new Set(line.match(SCENARIO_ID) ?? [])];
    if (ids.length === 0) {
      idless.push(line.trim());
      continue;
    }
    if (ids.length > 1) multiId.push(line.trim());
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return {
    counts,
    ids: [...counts.keys()].sort(),
    idless,
    multiId,
    testLineCount: lines.length,
  };
};

const main = () => {
  const full = listTests([]);
  const fullIds = full.ids;
  const fullSet = new Set(fullIds);
  const seen = new Map();
  const problems = validateLoginPolicy(config);
  const policy = config.loginPolicy ?? {};

  const approved = loadApprovedIds();
  if (approved.error) {
    problems.push(approved.error);
  }
  const approvedIds = approved.ids ?? [];
  const approvedSet = new Set(approvedIds);

  // Duplicate registrations: the same scenario id appearing on more than one
  // test line means it is implemented (and would run) twice.
  const duplicates = fullIds.filter((id) => (full.counts.get(id) ?? 0) > 1);
  if (duplicates.length)
    problems.push(
      `Registered more than once: ${duplicates
        .map((id) => `${id} x${full.counts.get(id)}`)
        .join(', ')}`
    );

  // Untraceable test metadata.
  if (full.idless.length)
    problems.push(
      `${full.idless.length} discovered test line(s) carry no TC-REQ id:\n      ` +
        full.idless.slice(0, 10).join('\n      ') +
        (full.idless.length > 10 ? `\n      …and ${full.idless.length - 10} more` : '')
    );
  if (full.multiId.length)
    problems.push(
      `${full.multiId.length} discovered test line(s) carry multiple TC-REQ ids:\n      ` +
        full.multiId.slice(0, 10).join('\n      ') +
        (full.multiId.length > 10 ? `\n      …and ${full.multiId.length - 10} more` : '')
    );

  // Traceability against the approved baseline, both directions.
  const unknown = fullIds.filter((id) => !approvedSet.has(id));
  if (unknown.length)
    problems.push(`Registered but not in the approved baseline: ${unknown.join(', ')}`);

  const missing = approvedIds.filter((id) => !full.counts.has(id));
  if (missing.length)
    problems.push(`Approved baseline scenarios not registered: ${missing.join(', ')}`);

  console.log(
    `Discovered: ${full.testLineCount} test line(s) / ${fullIds.length} unique scenario id(s)`
  );
  console.log(
    `Approved baseline: ${approvedIds.length} scenario(s)` +
      (approved.error ? ' (UNREADABLE)' : '')
  );
  console.log(
    `Login policy: throttle=${policy.loginAttemptsPerMinutePerIdentity}/min ` +
      `maxPerBatch=${policy.maxLoginsPerBatch} ` +
      `cooldown=${policy.cooldownSecondsAfterBatch}s ` +
      `workers=${policy.workersPerBatch}`
  );

  for (const batch of config.batches) {
    const selector =
      batch.scenarioIds.length === 1
        ? batch.scenarioIds[0]
        : batch.scenarioIds.join('|');
    const actual = listTests([batch.spec, '--grep', selector]).ids;
    const declared = [...batch.scenarioIds].sort();

    const missingFromBatch = declared.filter((id) => !actual.includes(id));
    const extraInBatch = actual.filter((id) => !declared.includes(id));

    for (const id of actual) {
      if (seen.has(id)) {
        problems.push(
          `Scenario ${id} selected by both batch "${seen.get(id)}" and "${batch.id}".`
        );
      } else {
        seen.set(id, batch.id);
      }
    }

    if (missingFromBatch.length)
      problems.push(
        `Batch "${batch.id}" declares but does not select: ${missingFromBatch.join(', ')}`
      );
    if (extraInBatch.length)
      problems.push(
        `Batch "${batch.id}" selects but does not declare: ${extraInBatch.join(', ')}`
      );

    console.log(
      `  ${batch.id.padEnd(16)} declared=${declared.length} selected=${actual.length}` +
        `  tests: ${actual.join(', ')}`
    );
  }

  const union = [...seen.keys()].sort();
  const notInAnyBatch = fullIds.filter((id) => !seen.has(id));
  const inBatchNotDiscovered = union.filter((id) => !fullSet.has(id));

  if (notInAnyBatch.length)
    problems.push(`Not covered by any batch: ${notInAnyBatch.join(', ')}`);
  if (inBatchNotDiscovered.length)
    problems.push(
      `Selected by a batch but not discovered by Playwright: ${inBatchNotDiscovered.join(', ')}`
    );

  if (problems.length) {
    console.error('\nBatch validation FAILED:');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }

  console.log(
    `\nBatch validation OK: ${union.length}/${fullIds.length} discovered tests ` +
      `covered exactly once across ${config.batches.length} batches.`
  );
};

main();
