import { describe, expect, it } from 'vitest';
import type { EvaluationOutcome } from '../../src/domain/evaluation/EvaluationMethodology.js';

type SemanticEvaluationInput = {
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

type SemanticEvaluationOutput = {
  readonly outcome: EvaluationOutcome;
  readonly justification: string;
  readonly evidenceInsufficient: boolean;
  readonly criterionId: string;
  readonly criterionVersion: string;
  readonly evidenceIds: readonly string[];
  readonly modelId: string;
  readonly modelVersion: string;
  readonly promptVersion: string;
  readonly methodVersion: string;
};

type ControlledSemanticCase = {
  readonly id: 'ALIGNED' | 'NOT_ALIGNED' | 'AMBIGUOUS';
  readonly input: SemanticEvaluationInput;
  readonly expectedOutcome: EvaluationOutcome;
};

const assertInputContract = (input: SemanticEvaluationInput): void => {
  const requiredText = [
    input.criterionId,
    input.criterionVersion,
    input.userInput,
    input.expectedIntent,
    input.expectedIntentVersion,
    input.observedResponse,
    input.modelId,
    input.modelVersion,
    input.promptVersion,
    input.methodVersion,
  ];

  if (requiredText.some((value) => value.trim().length === 0)) {
    throw new Error('Semantic evaluation input contains empty required text');
  }
  if (input.evidenceIds.length === 0) {
    throw new Error('Semantic evaluation input requires primary evidence references');
  }
}

const evaluateWithControlledModel = (input: SemanticEvaluationInput): SemanticEvaluationOutput => {
  assertInputContract(input);

  let outcome: EvaluationOutcome;
  let justification: string;
  let evidenceInsufficient = false;

  if (input.observedResponse === 'La intención fue atendida.') {
    outcome = 'PASS';
    justification = 'La respuesta satisface la intención declarada.';
  } else if (input.observedResponse === 'No puedo determinarlo con la evidencia disponible.') {
    outcome = 'INCONCLUSIVE';
    justification = 'La evidencia no permite establecer correspondencia con suficiente confianza.';
    evidenceInsufficient = true;
  } else {
    outcome = 'FAIL';
    justification = 'La respuesta no satisface la intención declarada.';
  }

  return {
    outcome,
    justification,
    evidenceInsufficient,
    criterionId: input.criterionId,
    criterionVersion: input.criterionVersion,
    evidenceIds: input.evidenceIds,
    modelId: input.modelId,
    modelVersion: input.modelVersion,
    promptVersion: input.promptVersion,
    methodVersion: input.methodVersion,
  };
};

const baseInput = {
  criterionId: 'D2-C01',
  criterionVersion: 'candidate-0.1',
  evidenceIds: ['evidence-turn-1'],
  userInput: 'Quiero comprar una camisa azul talla M',
  expectedIntent: 'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  expectedIntentVersion: 'intent-0.1',
  allowedContext: [],
  modelId: 'controlled-semantic-evaluator',
  modelVersion: 'double-0.1',
  promptVersion: 'semantic-prompt-0.1',
  methodVersion: 'AI-METHOD-0.1',
} as const;

const controlledCases: readonly ControlledSemanticCase[] = [
  {
    id: 'ALIGNED',
    input: { ...baseInput, observedResponse: 'La intención fue atendida.' },
    expectedOutcome: 'PASS',
  },
  {
    id: 'NOT_ALIGNED',
    input: { ...baseInput, observedResponse: 'No puedo procesar esa solicitud.' },
    expectedOutcome: 'FAIL',
  },
  {
    id: 'AMBIGUOUS',
    input: {
      ...baseInput,
      observedResponse: 'No puedo determinarlo con la evidencia disponible.',
    },
    expectedOutcome: 'INCONCLUSIVE',
  },
];

describe('F2-44 semantic evaluation protocol spike', () => {
  it('requires a deterministic, traceable input contract', () => {
    expect(() => assertInputContract(baseInput)).not.toThrow();
    expect(() => assertInputContract({ ...baseInput, evidenceIds: [] })).toThrow(
      'Semantic evaluation input requires primary evidence references',
    );
  });

  it('keeps the expected intent explicit instead of inferring it from the observed response', () => {
    const result = evaluateWithControlledModel(controlledCases[0].input);
    expect(result.outcome).toBe('PASS');
    expect(controlledCases[0].input.expectedIntent).toContain('intención de compra');
    expect(result.evidenceIds).toEqual(['evidence-turn-1']);
  });

  it('distinguishes aligned, non-aligned and ambiguous controlled cases', () => {
    for (const testCase of controlledCases) {
      const result = evaluateWithControlledModel(testCase.input);
      expect(result.outcome).toBe(testCase.expectedOutcome);
      expect(result.criterionId).toBe('D2-C01');
      expect(result.criterionVersion).toBe('candidate-0.1');
      expect(result.modelId).toBe('controlled-semantic-evaluator');
      expect(result.modelVersion).toBe('double-0.1');
      expect(result.promptVersion).toBe('semantic-prompt-0.1');
      expect(result.methodVersion).toBe('AI-METHOD-0.1');
      expect(result.justification.trim().length).toBeGreaterThan(0);
    }

    expect(evaluateWithControlledModel(controlledCases[2].input).evidenceInsufficient).toBe(true);
  });

  it('preserves evidence identity and does not replace primary evidence with AI output', () => {
    const result = evaluateWithControlledModel(controlledCases[0].input);
    expect(result.evidenceIds).toEqual(controlledCases[0].input.evidenceIds);
    expect(result.justification).not.toContain('evidence-transcript-replaced-by-ai');
  });

  it('is deterministic for repeated evaluation under identical controlled conditions', () => {
    const first = evaluateWithControlledModel(controlledCases[0].input);
    const repetitions = [
      evaluateWithControlledModel(controlledCases[0].input),
      evaluateWithControlledModel(controlledCases[0].input),
      evaluateWithControlledModel(controlledCases[0].input),
    ];

    for (const result of repetitions) {
      expect(result).toEqual(first);
    }
  });

  it('does not introduce product-level scoring or regression semantics', () => {
    const serialized = JSON.stringify(controlledCases.map((testCase) => evaluateWithControlledModel(testCase.input)));
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('REGRESSION');
    expect(serialized).not.toContain('IMPROVEMENT');
  });
});
