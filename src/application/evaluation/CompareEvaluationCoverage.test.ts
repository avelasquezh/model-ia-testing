import { describe, expect, it } from 'vitest';
import { EvaluationComparability } from '../../domain/evaluation/EvaluationComparability.js';
import { EvaluationCoverageMetrics } from '../../domain/evaluation/EvaluationCoverageMetrics.js';
import { EvaluationVersionContext } from '../../domain/versioning/EvaluationVersionContext.js';
import { Execution } from '../../domain/execution/Execution.js';
import { CompareEvaluationCoverage } from './CompareEvaluationCoverage.js';

const execution = (id: string, productVersion: string) => new Execution({
  id,
  scenarioId: 'scenario-1',
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

const metrics = (executionId: string, evaluatedCount: number, applicableCount = 2) =>
  new EvaluationCoverageMetrics({
    executionId,
    applicableCount,
    evaluatedCount,
    notEvaluatedCount: applicableCount - evaluatedCount,
    insufficientEvidenceCount: 0,
    inconclusiveCount: 0,
    notApplicableCount: 1,
    evaluatedCoverageRatio: evaluatedCount / applicableCount,
    incompleteCoverageRatio: (applicableCount - evaluatedCount) / applicableCount,
    unresolvedCoverageRatio: 0,
  });

const comparable = (left: Execution, right: Execution) => new EvaluationComparability({
  leftExecutionId: left.props.id,
  rightExecutionId: right.props.id,
  status: 'COMPARABLE',
  reasons: [],
  basis: 'same methodology',
});

describe('CompareEvaluationCoverage', () => {
  const compare = new CompareEvaluationCoverage();

  it('calculates right-minus-left descriptive deltas and preserves product versions', () => {
    const left = execution('left', '0.1.0');
    const right = execution('right', '0.2.0');
    const result = compare.compare({
      leftExecution: left,
      rightExecution: right,
      leftMetrics: metrics('left', 1),
      rightMetrics: metrics('right', 2),
      comparability: comparable(left, right),
    });

    expect(result.props.evaluatedCountDelta).toBe(1);
    expect(result.props.evaluatedCoverageRatioDelta).toBe(0.5);
    expect(result.props.incompleteCoverageRatioDelta).toBe(-0.5);
    expect(result.props.leftProductVersion).toBe('0.1.0');
    expect(result.props.rightProductVersion).toBe('0.2.0');
  });

  it('does not compare executions when methodological comparability is not established', () => {
    const left = execution('left', '0.1.0');
    const right = execution('right', '0.2.0');
    const notComparable = new EvaluationComparability({
      leftExecutionId: 'left',
      rightExecutionId: 'right',
      status: 'NON_COMPARABLE',
      reasons: ['CONDITION_FINGERPRINT_MISMATCH'],
      basis: 'different conditions',
    });

    expect(() => compare.compare({
      leftExecution: left,
      rightExecution: right,
      leftMetrics: metrics('left', 1),
      rightMetrics: metrics('right', 2),
      comparability: notComparable,
    })).toThrow('Coverage comparison requires COMPARABLE executions');
  });
});
