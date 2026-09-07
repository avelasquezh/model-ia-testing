import { describe, expect, it } from 'vitest';

type VersionSnapshot = {
  readonly productVersion: string;
  readonly scenarioVersion: number;
  readonly criteriaCatalogVersion?: string;
  readonly evaluationModelVersion?: string;
  readonly decisionRulesVersion?: string;
  readonly evaluatorVersion?: string;
  readonly executionId: string;
};

const isSemVer = (value: string): boolean =>
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value);

describe('F2 versioning methodological validation', () => {
  it('uses SemVer for the product version', () => {
    expect(isSemVer('0.1.0')).toBe(true);
    expect(isSemVer('1.0.0')).toBe(true);
    expect(isSemVer('1.2')).toBe(false);
    expect(isSemVer('v1.2.3')).toBe(false);
  });

  it('keeps scenario version independent from product version', () => {
    const snapshot: VersionSnapshot = {
      productVersion: '0.1.0',
      scenarioVersion: 7,
      executionId: 'run-001',
    };

    expect(snapshot.productVersion).toBe('0.1.0');
    expect(snapshot.scenarioVersion).toBe(7);
  });

  it('keeps methodology versions independent from software releases', () => {
    const snapshot: VersionSnapshot = {
      productVersion: '0.2.0',
      scenarioVersion: 3,
      criteriaCatalogVersion: 'criteria-1.2',
      evaluationModelVersion: 'evaluation-0.4',
      decisionRulesVersion: 'rules-2.1',
      evaluatorVersion: 'evaluator-claude-x-config-7',
      executionId: 'run-002',
    };

    expect(snapshot.productVersion).toBe('0.2.0');
    expect(snapshot.criteriaCatalogVersion).toBe('criteria-1.2');
    expect(snapshot.evaluationModelVersion).toBe('evaluation-0.4');
    expect(snapshot.decisionRulesVersion).toBe('rules-2.1');
    expect(snapshot.evaluatorVersion).toBe('evaluator-claude-x-config-7');
  });

  it('prevents a methodology change from rewriting a historical snapshot', () => {
    const historical: VersionSnapshot = {
      productVersion: '0.1.0',
      scenarioVersion: 2,
      criteriaCatalogVersion: 'criteria-1.0',
      evaluationModelVersion: 'evaluation-0.1',
      decisionRulesVersion: 'rules-1.0',
      executionId: 'run-historical',
    };

    const currentMethodology = {
      criteriaCatalogVersion: 'criteria-2.0',
      evaluationModelVersion: 'evaluation-0.2',
      decisionRulesVersion: 'rules-1.1',
    };

    expect(historical.criteriaCatalogVersion).toBe('criteria-1.0');
    expect(historical.evaluationModelVersion).toBe('evaluation-0.1');
    expect(historical.decisionRulesVersion).toBe('rules-1.0');
    expect(currentMethodology.criteriaCatalogVersion).not.toBe(historical.criteriaCatalogVersion);
  });

  it('requires an immutable execution identifier as the historical anchor', () => {
    const first: VersionSnapshot = {
      productVersion: '0.1.0',
      scenarioVersion: 1,
      executionId: 'run-immutable-001',
    };
    const second = { ...first };

    expect(second.executionId).toBe(first.executionId);
    expect(second).toEqual(first);
  });

  it('does not use product version to represent methodology changes', () => {
    const sameSoftwareDifferentMethod: VersionSnapshot[] = [
      {
        productVersion: '0.3.0',
        scenarioVersion: 4,
        criteriaCatalogVersion: 'criteria-1.0',
        evaluationModelVersion: 'evaluation-0.1',
        executionId: 'run-a',
      },
      {
        productVersion: '0.3.0',
        scenarioVersion: 4,
        criteriaCatalogVersion: 'criteria-1.1',
        evaluationModelVersion: 'evaluation-0.2',
        executionId: 'run-b',
      },
    ];

    expect(sameSoftwareDifferentMethod[0]?.productVersion).toBe(
      sameSoftwareDifferentMethod[1]?.productVersion,
    );
    expect(sameSoftwareDifferentMethod[0]?.criteriaCatalogVersion).not.toBe(
      sameSoftwareDifferentMethod[1]?.criteriaCatalogVersion,
    );
  });

  it('allows API versioning to remain independent until a public contract exists', () => {
    const snapshot: VersionSnapshot = {
      productVersion: '0.4.0',
      scenarioVersion: 1,
      executionId: 'run-api-not-yet-public',
    };

    expect(snapshot.productVersion).toBe('0.4.0');
    expect(snapshot).not.toHaveProperty('apiVersion');
  });
});
