import { describe, expect, it } from 'vitest';
import { EvaluationComparability } from '../../src/domain/evaluation/EvaluationComparability.js';
import { EvaluationCoverageMetrics } from '../../src/domain/evaluation/EvaluationCoverageMetrics.js';
import { EvaluationVersionContext } from '../../src/domain/versioning/EvaluationVersionContext.js';
import { Execution } from '../../src/domain/execution/Execution.js';
import { CompareEvaluationCoverage } from '../../src/application/evaluation/CompareEvaluationCoverage.js';

const execution = (id: string, productVersion: string) => new Execution({
  id,
  scenarioId: 'spike-scenario',
  scenarioVersion: 1,
  targetId: `target-${id}`,
  targetUrl: 'https://example.com',
  status: 'PASSED',
  versionContext: new EvaluationVersionContext({
    productVersion,
    evaluationMethodVersion: 'method-1',
    criterionCatalogVersion: 'criteria-1',
    decisionRulesVersion: 'rules-1',
  }),
});

const metrics = (executionId: string, evaluatedCount: number) => new EvaluationCoverageMetrics({
  executionId,
  applicableCount: 2,
  evaluatedCount,
  notEvaluatedCount: 2 - evaluatedCount,
  insufficientEvidenceCount: 0,
  inconclusiveCount: 0,
  notApplicableCount: 1,
  evaluatedCoverageRatio: evaluatedCount / 2,
  incompleteCoverageRatio: (2 - evaluatedCount) / 2,
  unresolvedCoverageRatio: 0,
});

describe('F2-39 architecture spike: descriptive coverage comparison', () => {
  it('compares coverage only after methodological comparability and preserves product versions', () => {
    const left = execution('spike-left', '0.1.0');
    const right = execution('spike-right', '0.2.0');
    const comparability = new EvaluationComparability({
      leftExecutionId: left.props.id,
      rightExecutionId: right.props.id,
      status: 'COMPARABLE',
      reasons: [],
      basis: 'same methodological conditions',
    });

    const result = new CompareEvaluationCoverage().compare({
      leftExecution: left,
      rightExecution: right,
      leftMetrics: metrics(left.props.id, 1),
      rightMetrics: metrics(right.props.id, 2),
      comparability,
    });

    expect(result.props.evaluatedCountDelta).toBe(1);
    expect(result.props.evaluatedCoverageRatioDelta).toBe(0.5);
    expect(result.props.leftProductVersion).toBe('0.1.0');
    expect(result.props.rightProductVersion).toBe('0.2.0');
  });
});
