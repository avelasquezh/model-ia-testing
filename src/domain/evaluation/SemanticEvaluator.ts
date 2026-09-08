import type { EvaluationOutcome } from './EvaluationMethodology.js';

export type SemanticEvaluationInput = {
  readonly criterionId: string;
  readonly criterionVersion: string;
  readonly evidenceIds: readonly string[];
  readonly userInput: string;
  readonly expectedIntent: string;
  readonly expectedIntentVersion: string;
  readonly observedResponse: string;
  readonly allowedContext: readonly string[];
  readonly modelId: string;
  readonly modelVersion: string;
  readonly promptVersion: string;
  readonly methodVersion: string;
};

export type SemanticEvaluationOutput = {
  readonly outcome: EvaluationOutcome;
  readonly justification: string;
  readonly evidenceInsufficient: boolean;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly promptVersion: string;
  readonly methodVersion: string;
  readonly criterionId: string;
  readonly criterionVersion: string;
  readonly evidenceIds: readonly string[];
};

export interface SemanticEvaluatorPort {
  evaluate(input: SemanticEvaluationInput): Promise<SemanticEvaluationOutput>;
}
