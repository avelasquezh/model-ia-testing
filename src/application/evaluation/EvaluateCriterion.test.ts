import { describe, expect, it } from 'vitest';
import { Criterion } from '../../domain/evaluation/Criterion.js';
import { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { EvaluateCriterion, type CriterionDecisionRule } from './EvaluateCriterion.js';
import { InMemoryEvidenceCatalog } from '../../infrastructure/evaluation/InMemoryEvidenceCatalog.js';

const criterion = new Criterion({
  id: 'D1-C01',
  dimensionId: 'D1',
  type: 'BOOLEAN',
  applicableContexts: ['web-chatbot'],
  requiredEvidence: ['TRANSCRIPT', 'SCREENSHOT'],
  ruleVersion: 'rule-1',
});

const plan = new EvaluationPlan({
  executionId: 'execution-1',
  context: 'web-chatbot',
  items: [{
    criterionId: criterion.props.id,
    dimensionId: criterion.props.dimensionId,
    type: criterion.props.type,
    applicability: 'APPLICABLE',
    reason: 'applicable',
    requiredEvidence: criterion.props.requiredEvidence,
    ruleVersion: criterion.props.ruleVersion,
  }],
});

const passingRule: CriterionDecisionRule = {
  version: 'rule-1',
  decide: () => ({ status: 'PASS', reason: 'Controlled evidence satisfies the decision rule.' }),
};

describe('EvaluateCriterion', () => {
  it('returns INCONCLUSIVE when required evidence is incomplete', async () => {
    const evaluator = new EvaluateCriterion(
      new InMemoryEvidenceCatalog([
        { id: 'e1', executionId: 'execution-1', evidenceType: 'TRANSCRIPT', contentReference: 'transcript-1' },
      ]),
      new Map([[criterion.props.id, passingRule]]),
    );

    const evaluation = await evaluator.evaluate({ executionId: 'execution-1', plan, criterionId: criterion.props.id });

    expect(evaluation.props.status).toBe('INCONCLUSIVE');
    expect(evaluation.props.rule).toBe('rule-1');
  });

  it('returns PASS when required evidence exists and the versioned rule passes', async () => {
    const evaluator = new EvaluateCriterion(
      new InMemoryEvidenceCatalog([
        { id: 'e1', executionId: 'execution-1', evidenceType: 'TRANSCRIPT', contentReference: 'transcript-1' },
        { id: 'e2', executionId: 'execution-1', evidenceType: 'SCREENSHOT', contentReference: 'screenshot-1' },
      ]),
      new Map([[criterion.props.id, passingRule]]),
    );

    const evaluation = await evaluator.evaluate({ executionId: 'execution-1', plan, criterionId: criterion.props.id });

    expect(evaluation.props.status).toBe('PASS');
    expect(evaluation.props.evidenceId).toBe('e1');
  });

  it('returns NOT_EVALUABLE when no decision rule is registered', async () => {
    const evaluator = new EvaluateCriterion(
      new InMemoryEvidenceCatalog([
        { id: 'e1', executionId: 'execution-1', evidenceType: 'TRANSCRIPT', contentReference: 'transcript-1' },
        { id: 'e2', executionId: 'execution-1', evidenceType: 'SCREENSHOT', contentReference: 'screenshot-1' },
      ]),
      new Map(),
    );

    const evaluation = await evaluator.evaluate({ executionId: 'execution-1', plan, criterionId: criterion.props.id });

    expect(evaluation.props.status).toBe('NOT_EVALUABLE');
  });

  it('does not evaluate a plan belonging to another execution', async () => {
    const evaluator = new EvaluateCriterion(new InMemoryEvidenceCatalog([]), new Map());

    await expect(
      evaluator.evaluate({ executionId: 'execution-2', plan, criterionId: criterion.props.id }),
    ).rejects.toThrow('Evaluation plan execution id does not match execution');
  });
});
