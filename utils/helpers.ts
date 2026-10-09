import { TestInfo } from '@playwright/test';
import { User, isUserConfigured } from '../test-data/users';

/** True when a BASE_URL is configured for the UAT environment. */
export const isAppConfigured = (): boolean => Boolean(process.env.BASE_URL);

/** Annotation type keys used for machine-readable traceability. */
export const ANNOTATION = {
  scenarioId: 'scenario-id',
  scenario: 'scenario',
  requirementIds: 'requirement-id',
  journey: 'journey',
  role: 'role',
} as const;

export interface ScenarioMeta {
  /** Approved scenario id from the workbook, e.g. TC-REQ-001. */
  id: string;
  /** Approved scenario title. */
  scenario: string;
  /** Approved requirement ids, e.g. ['FR-02', 'SR-6', 'SR-8']. */
  requirementIds: string[];
  /** Journey code, e.g. J-S1. */
  journey: string;
  /** Persona. */
  role: string;
  /**
   * Reason the scenario cannot be executed yet. When set, the test is
   * registered (so it is discoverable and traceable) but skipped at runtime.
   */
  deferred?: string;
}

/** Push machine-readable traceability annotations onto a test. */
export const annotateScenario = (
  testInfo: TestInfo,
  meta: ScenarioMeta
): void => {
  testInfo.annotations.push({
    type: ANNOTATION.scenarioId,
    description: meta.id,
  });
  testInfo.annotations.push({
    type: ANNOTATION.scenario,
    description: meta.scenario,
  });
  testInfo.annotations.push({
    type: ANNOTATION.requirementIds,
    description: meta.requirementIds.join(', '),
  });
  testInfo.annotations.push({
    type: ANNOTATION.journey,
    description: meta.journey,
  });
  testInfo.annotations.push({ type: ANNOTATION.role, description: meta.role });
};

/** Build a clear skip reason for missing environment/test identity. */
export const missingConfigReason = (user?: User): string | undefined => {
  if (!isAppConfigured()) {
    return 'BASE_URL is not configured; application execution skipped (see .env.example).';
  }
  if (user && !isUserConfigured(user)) {
    return 'UAT test credentials are not configured; application execution skipped (see .env.example).';
  }
  return undefined;
};
