import { describe, expect, it } from 'vitest';
import { Criterion } from './Criterion.js';
import { isMvpCoreCriterion, MVP_CORE_CRITERION_IDS } from './MvpEvaluationScope.js';

describe('MVP evaluation scope', () => {
  it('declares a stable explicit core criterion set', () => {
    expect(MVP_CORE_CRITERION_IDS).toEqual([
      'D1-C01',
      'D1-C02',
      'D1-C03',
      'D1-C04',
      'D2-C01',
      'D2-C02',
      'D2-C04',
      'D2-C05',
      'D3-C01',
      'D3-C02',
      'D3-C03',
      'D3-C04',
      'D4-C01',
      'D4-C03',
      'D4-C04',
      'D6-C01',
      'D6-C03',
      'D6-C04',
    ]);
  });

  it('includes only explicitly selected MVP core criteria', () => {
    const criterion = new Criterion({
      id: 'D1-C01',
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicableContexts: ['web-chatbot'],
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: '1.0',
    });

    expect(isMvpCoreCriterion(criterion)).toBe(true);
  });

  it('rejects criteria that are candidates but not part of the MVP core', () => {
    const criterion = new Criterion({
      id: 'D6-C05',
      dimensionId: 'D6',
      type: 'NUMERIC',
      applicableContexts: ['load-test'],
      requiredEvidence: ['TIMING'],
      ruleVersion: '0.1',
    });

    expect(isMvpCoreCriterion(criterion)).toBe(false);
  });
});
