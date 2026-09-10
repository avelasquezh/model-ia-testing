import type { SemanticEvaluationOutput } from '../../domain/evaluation/SemanticEvaluator.js';

export type SemanticModelEvaluationResult = {
  readonly caseId: string;
  readonly repetition: number;
  readonly turn: number;
  readonly conversationId: string;
  readonly outcome: SemanticEvaluationOutput['outcome'];
  readonly evidenceInsufficient: boolean;
  readonly evidenceIds: readonly string[];
};

export type SemanticModelDescriptor = {
  readonly modelId: string;
  readonly modelVersion: string;
};

export type SemanticModelComparison = {
  readonly key: string;
  readonly caseId: string;
  readonly repetition: number;
  readonly turn: number;
  readonly conversationId: string;
  readonly agreement: 'AGREEMENT' | 'DISAGREEMENT';
  readonly models: readonly {
    readonly model: SemanticModelDescriptor;
    readonly outcome: SemanticEvaluationOutput['outcome'];
    readonly evidenceInsufficient: boolean;
    readonly evidenceIds: readonly string[];
  }[];
};

export type SemanticModelComparisonSummary = {
  readonly totalCases: number;
  readonly agreements: number;
  readonly disagreements: number;
  readonly agreementRate: number | null;
};

export type SemanticModelComparisonResult = {
  readonly status: 'COMPARISON_COMPLETED';
  readonly models: readonly SemanticModelDescriptor[];
  readonly comparisons: readonly SemanticModelComparison[];
  readonly summary: SemanticModelComparisonSummary;
};

const resultKey = (result: SemanticModelEvaluationResult): string =>
  [result.caseId, result.repetition, result.turn, result.conversationId].join('::');

const assertUniqueKeys = (
  model: SemanticModelDescriptor,
  results: readonly SemanticModelEvaluationResult[],
): Map<string, SemanticModelEvaluationResult> => {
  const map = new Map<string, SemanticModelEvaluationResult>();
  for (const result of results) {
    const key = resultKey(result);
    if (map.has(key)) throw new Error(`Duplicate semantic evaluation result for ${model.modelId}: ${key}`);
    map.set(key, result);
  }
  return map;
};

export class CompareSemanticModelResults {
  public compare(
    modelResults: readonly {
      readonly model: SemanticModelDescriptor;
      readonly results: readonly SemanticModelEvaluationResult[];
    }[],
  ): SemanticModelComparisonResult {
    if (modelResults.length < 2) {
      throw new Error('Semantic model comparison requires at least two evaluators');
    }

    const indexed = modelResults.map(({ model, results }) => ({
      model,
      results: assertUniqueKeys(model, results),
    }));

    const baseline = indexed[0];
    if (!baseline) {
      throw new Error('Semantic model comparison requires at least one baseline evaluator');
    }

    for (const candidate of indexed.slice(1)) {
      if (candidate.results.size !== baseline.results.size) {
        throw new Error('Semantic model result sets are not aligned: different observation counts');
      }
      for (const key of baseline.results.keys()) {
        if (!candidate.results.has(key)) {
          throw new Error(`Semantic model result sets are not aligned: missing ${key} in ${candidate.model.modelId}`);
        }
      }
    }

    const comparisons = [...baseline.results.values()]
      .map((reference) => {
        const key = resultKey(reference);
        const aligned = indexed.map(({ model, results }) => {
          const result = results.get(key);
          if (!result) throw new Error(`Missing semantic model result: ${key}`);
          return {
            model,
            outcome: result.outcome,
            evidenceInsufficient: result.evidenceInsufficient,
            evidenceIds: [...result.evidenceIds],
          };
        });

        const outcomes = new Set(aligned.map((result) => result.outcome));
        return {
          key,
          caseId: reference.caseId,
          repetition: reference.repetition,
          turn: reference.turn,
          conversationId: reference.conversationId,
          agreement: outcomes.size === 1 ? 'AGREEMENT' : 'DISAGREEMENT',
          models: aligned,
        } satisfies SemanticModelComparison;
      })
      .sort((left, right) => left.key.localeCompare(right.key));

    const agreements = comparisons.filter((comparison) => comparison.agreement === 'AGREEMENT').length;
    const disagreements = comparisons.length - agreements;

    return {
      status: 'COMPARISON_COMPLETED',
      models: indexed.map(({ model }) => model),
      comparisons,
      summary: {
        totalCases: comparisons.length,
        agreements,
        disagreements,
        agreementRate: comparisons.length === 0 ? null : agreements / comparisons.length,
      },
    };
  }
}
