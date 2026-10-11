/**
 * Status model + precedence.
 *
 * Statuses:
 *   PASSED  - executed, all assertions passed (final attempt expected).
 *   FAILED  - executed, an assertion/test failed (final attempt unexpected).
 *   SKIPPED - registered but intentionally not executed (deferred by design).
 *   BLOCKED - not executed because a prerequisite/environment was unavailable
 *             (e.g. BASE_URL / credentials / TOTP secret not configured).
 *   ERROR   - attempt interrupted/unexpected harness outcome.
 *   NOT RUN - approved scenario with no execution record in this run.
 *
 * Flaky (failed then passed on retry) is reported as PASSED with a `flaky`
 * flag and the failing attempts preserved for investigation.
 */

export const STATUS = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  BLOCKED: 'BLOCKED',
  ERROR: 'ERROR',
  NOT_RUN: 'NOT RUN',
};

/** Skip reasons that indicate an unavailable prerequisite/environment. */
const BLOCKED_PATTERNS = [
  /BASE_URL is not configured/i,
  /credentials are not configured/i,
  /no TOTP secret is configured/i,
  /requires a 2FA\/OTP step/i,
];

export const classifySkip = (reason) => {
  if (!reason) return STATUS.SKIPPED;
  return BLOCKED_PATTERNS.some((re) => re.test(reason))
    ? STATUS.BLOCKED
    : STATUS.SKIPPED;
};

/** Map a single collected record to a status. */
export const statusForRecord = (record) => {
  const attempts = record.attempts ?? [];
  if (!attempts.length) return STATUS.ERROR;

  const last = attempts[attempts.length - 1];
  if (last.status === 'interrupted') return STATUS.ERROR;

  switch (record.testStatus) {
    case 'expected':
      return STATUS.PASSED;
    case 'flaky':
      return STATUS.PASSED;
    case 'unexpected':
      return STATUS.FAILED;
    case 'skipped':
      return classifySkip(record.skipReason);
    default:
      // Fall back to the final attempt's own status.
      if (last.status === 'passed') return STATUS.PASSED;
      if (last.status === 'failed' || last.status === 'timedOut')
        return STATUS.FAILED;
      if (last.status === 'skipped') return classifySkip(record.skipReason);
      return STATUS.ERROR;
  }
};

/**
 * Precedence when a scenario has multiple records (e.g. it appeared in more
 * than one batch). Highest wins. PASSED outranks SKIPPED/BLOCKED so a genuine
 * pass is not masked by a duplicate skip; FAILED/ERROR always win.
 */
const SEVERITY = {
  [STATUS.FAILED]: 6,
  [STATUS.ERROR]: 5,
  [STATUS.PASSED]: 4,
  [STATUS.BLOCKED]: 3,
  [STATUS.SKIPPED]: 2,
  [STATUS.NOT_RUN]: 1,
};

export const worstStatus = (statuses) => {
  if (!statuses.length) return STATUS.NOT_RUN;
  return statuses.reduce((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a));
};
