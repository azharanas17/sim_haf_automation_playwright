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
 *     application login throttle (see validateLoginPolicy).
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

const listIds = (args) => {
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
  return [...new Set(output.match(/TC-REQ-\d{3}/g) ?? [])].sort();
};

const main = () => {
  const fullIds = listIds([]);
  const fullSet = new Set(fullIds);
  const seen = new Map();
  const problems = validateLoginPolicy(config);
  const policy = config.loginPolicy ?? {};

  console.log(`Discovered tests: ${fullIds.length}`);
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
    const actual = listIds([batch.spec, '--grep', selector]);
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
