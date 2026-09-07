import { describe, expect, it } from 'vitest';
import { Criterion } from '../../domain/evaluation/Criterion.js';
import { EvaluationSelectionContext } from '../../domain/evaluation/EvaluationSelectionContext.js';
import { ComposeEvaluationPlan, type CriterionCatalog } from './ComposeEvaluationPlan.js';

class InMemoryCriterionCatalog implements CriterionCatalog {
  public constructor(private readonly criteria: readonly Criterion[]) {}
  public async findAll(): Promise<readonly Criterion[]> {
    return this.criteria;
  }
}

const criteria: Criterion[] = [
  new Criterion({
    id: 'D1-C01',
    dimensionId: 'D1',
    type: 'BOOLEAN',
    applicableContexts: ['web-chatbot'],
    requiredEvidence: ['TRANSCRIPT'],
    ruleVersion: '1.0',
  }),
  new Criterion({
    id: 'D6-C01',
    dimensionId: 'D6',
    type: 'NUMERIC',
    applicableContexts: ['web-chatbot'],
    requiredEvidence: ['TIMING'],
    ruleVersion: '1.2',
  }),
  new Criterion({
    id: 'D6-C05',
    dimensionId: 'D6',
    type: 'NUMERIC',
    applicableContexts: ['load-test'],
    requiredEvidence: ['TIMING'],
    ruleVersion: '0.1',
  }),
];

describe('ComposeEvaluationPlan', () => {
  it('composes an auditable plan by execution context', async () => {
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(criteria));

    const plan = await useCase.compose({
      executionId: 'execution-18-001',
      context: 'web-chatbot',
    });

    expect(plan.props.executionId).toBe('execution-18-001');
    expect(plan.props.context).toBe('web-chatbot');
    expect(plan.props.scope).toBe('CATALOG');
    expect(plan.applicableCriteria.map((item) => item.criterionId)).toEqual(['D1-C01', 'D6-C01']);
    expect(plan.notApplicableCriteria.map((item) => item.criterionId)).toEqual(['D6-C05']);
    expect(plan.props.items[0]).toMatchObject({
      criterionId: 'D1-C01',
      dimensionId: 'D1',
      applicability: 'APPLICABLE',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: '1.0',
    });
  });

  it('composes only the explicit MVP core scope', async () => {
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(criteria));
    const plan = await useCase.compose({
      executionId: 'execution-24-001',
      context: 'web-chatbot',
      scope: 'MVP_CORE',
    });

    expect(plan.props.scope).toBe('MVP_CORE');
    expect(plan.props.items.map((item) => item.criterionId)).toEqual(['D1-C01', 'D6-C01']);
    expect(plan.props.items.every((item) => item.criterionId !== 'D6-C05')).toBe(true);
  });

  it('composes only criteria explicitly selected for a scenario execution', async () => {
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(criteria));
    const selection = new EvaluationSelectionContext({
      scenarioId: 'scenario-25-001',
      scenarioVersion: 3,
      executionContext: 'web-chatbot',
      scope: 'MVP_CORE',
      selectedCriterionIds: ['D1-C01'],
    });

    const plan = await useCase.compose({
      executionId: 'execution-25-001',
      context: 'web-chatbot',
      selection,
    });

    expect(plan.props.scope).toBe('MVP_CORE');
    expect(plan.props.selectionContext).toEqual(selection.props);
    expect(plan.props.items.map((item) => item.criterionId)).toEqual(['D1-C01']);
    expect(plan.applicableCriteria.map((item) => item.criterionId)).toEqual(['D1-C01']);
  });

  it('rejects a selected criterion outside the declared scope', async () => {
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(criteria));
    const selection = new EvaluationSelectionContext({
      scenarioId: 'scenario-25-002',
      scenarioVersion: 1,
      executionContext: 'web-chatbot',
      scope: 'MVP_CORE',
      selectedCriterionIds: ['D6-C05'],
    });

    await expect(
      useCase.compose({ executionId: 'execution-25-002', context: 'web-chatbot', selection }),
    ).rejects.toThrow('Selected criterion is outside evaluation scope or missing from catalog: D6-C05');
  });

  it('does not turn a non-applicable criterion into FAIL', async () => {
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(criteria));
    const plan = await useCase.compose({ executionId: 'execution-18-002', context: 'api-chatbot' });

    expect(plan.applicableCriteria).toHaveLength(0);
    expect(plan.notApplicableCriteria).toHaveLength(3);
    expect(plan.notApplicableCriteria.every((item) => item.applicability === 'NOT_APPLICABLE')).toBe(true);
  });

  it('preserves evidence and rule version for every criterion', async () => {
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(criteria));
    const plan = await useCase.compose({ executionId: 'execution-18-003', context: 'web-chatbot' });

    expect(plan.props.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ criterionId: 'D1-C01', requiredEvidence: ['TRANSCRIPT'], ruleVersion: '1.0' }),
        expect.objectContaining({ criterionId: 'D6-C01', requiredEvidence: ['TIMING'], ruleVersion: '1.2' }),
      ]),
    );
  });

  it('rejects duplicate criterion identifiers in the catalog', async () => {
    const firstCriterion = criteria[0];
    if (!firstCriterion) throw new Error('Expected test criterion to exist');
    const duplicated: Criterion[] = [firstCriterion, firstCriterion];
    const useCase = new ComposeEvaluationPlan(new InMemoryCriterionCatalog(duplicated));

    await expect(useCase.compose({ executionId: 'execution-18-004', context: 'web-chatbot' })).rejects.toThrow(
      'Duplicate criterion in catalog: D1-C01',
    );
  });
});
