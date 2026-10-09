import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { User, isUserConfigured } from '../test-data/users';
import {
  ScenarioMeta,
  annotateScenario,
  isAppConfigured,
} from '../utils/helpers';

type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

/**
 * Narrow authentication fixture.
 *
 * Deliberately does NOT establish global storageState / session caching in
 * Phase 1: the approved workbook records the Superadmin account as
 * "2FA enabled" and the 2FA adapter is unresolved, so a persisted
 * authenticated state cannot be produced responsibly yet.
 */
export const authTest = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export interface ScenarioOptions {
  /** Scenario needs a configured test identity (email + password). */
  requiresCredentials?: boolean;
  /** Scenario needs an already authenticated session (thus the 2FA flow). */
  requiresSession?: boolean;
  /** Identity used when a session/credential guard is evaluated. */
  user?: User;
}

/**
 * Declare an approved scenario at the top of a test body.
 *
 * Pushes machine-readable traceability annotations and applies the shared
 * execution guards (deferred / unconfigured environment / missing identity).
 *
 * Tests are registered directly in the spec with `authTest(...)` so Playwright
 * reports the real spec location; this helper keeps the scenario id and the
 * guard policy centralized. The approved scenario intent/expected result must
 * be preserved verbatim in `meta.scenario`; this helper does not design
 * behavior.
 */
export const declareScenario = (
  meta: ScenarioMeta,
  options: ScenarioOptions = {}
): void => {
  annotateScenario(authTest.info(), meta);

  if (meta.deferred) {
    authTest.skip(true, meta.deferred);
    return;
  }

  if (!isAppConfigured()) {
    authTest.skip(
      true,
      'BASE_URL is not configured; application execution skipped (see .env.example).'
    );
    return;
  }

  const user = options.user;
  if (options.requiresCredentials || options.requiresSession) {
    if (!user || !isUserConfigured(user)) {
      authTest.skip(
        true,
        'UAT test credentials are not configured; application execution skipped (see .env.example).'
      );
      return;
    }
  }

  if (options.requiresSession && !user?.totpSecret) {
    authTest.skip(
      true,
      'Login requires the unresolved 2FA/OTP adapter; a TOTP secret must be configured (see .env.example).'
    );
  }
};

/** Approved scenario id + title formatted as a Playwright test title. */
export const testTitle = (meta: ScenarioMeta): string =>
  `${meta.id} - ${meta.scenario}`;
