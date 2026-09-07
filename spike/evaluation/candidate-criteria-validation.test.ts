import { describe, expect, it } from 'vitest';
import { EvaluationMethodology } from '../../src/domain/evaluation/EvaluationMethodology.js';

type ControlledCase = {
  readonly caseId: string;
  readonly dimensionId: string;
  readonly criterionId: string;
  readonly type: 'BOOLEAN' | 'ORDINAL' | 'NUMERIC';
  readonly requiredEvidence: readonly ('TRANSCRIPT' | 'DOM' | 'TIMING' | 'INTERACTION' | 'AI_ANALYSIS')[];
  readonly observationMechanism: string;
  readonly expected: string;
  readonly decisionRule: string;
};

const cases: readonly ControlledCase[] = [
  {
    caseId: 'C01', dimensionId: 'D1', criterionId: 'D1-C01', type: 'BOOLEAN',
    requiredEvidence: ['TRANSCRIPT', 'INTERACTION'],
    observationMechanism: 'external interaction and transcript',
    expected: 'all expected response outcomes are present',
    decisionRule: 'PASS when all expected outcomes are satisfied',
  },
  {
    caseId: 'C02', dimensionId: 'D2', criterionId: 'D2-C01', type: 'ORDINAL',
    requiredEvidence: ['TRANSCRIPT', 'AI_ANALYSIS'],
    observationMechanism: 'transcript with declared semantic comparison method',
    expected: 'response corresponds to the declared conversational intent',
    decisionRule: 'classify only according to the declared ordinal rule',
  },
  {
    caseId: 'C03', dimensionId: 'D3', criterionId: 'D3-C01', type: 'BOOLEAN',
    requiredEvidence: ['TRANSCRIPT'],
    observationMechanism: 'multi-turn transcript',
    expected: 'previously established datum is used correctly',
    decisionRule: 'PASS when the referenced datum is resolved correctly',
  },
  {
    caseId: 'C04', dimensionId: 'D4', criterionId: 'D4-C01', type: 'BOOLEAN',
    requiredEvidence: ['TRANSCRIPT', 'INTERACTION'],
    observationMechanism: 'controlled reformulations of the same intent',
    expected: 'expected behavior remains stable across covered variants',
    decisionRule: 'PASS when each covered variant satisfies the declared expectation',
  },
  {
    caseId: 'C05', dimensionId: 'D5', criterionId: 'D5-C01', type: 'BOOLEAN',
    requiredEvidence: ['TRANSCRIPT'],
    observationMechanism: 'authorized out-of-scope request',
    expected: 'declared refusal or redirection is returned',
    decisionRule: 'PASS when the predefined boundary behavior is observed',
  },
  {
    caseId: 'C06', dimensionId: 'D6', criterionId: 'D6-C01', type: 'NUMERIC',
    requiredEvidence: ['TIMING'],
    observationMechanism: 'timestamps with explicit start and end events',
    expected: 'observable response time is measurable',
    decisionRule: 'evaluate the measured value against the criterion rule',
  },
  {
    caseId: 'C07', dimensionId: 'D7', criterionId: 'D7-C02', type: 'BOOLEAN',
    requiredEvidence: ['DOM', 'INTERACTION'],
    observationMechanism: 'browser interaction over the conversation input',
    expected: 'message can be entered and sent under the scenario conditions',
    decisionRule: 'PASS when the declared interaction completes successfully',
  },
] as const;

const methodology = new EvaluationMethodology({
  id: 'f2-41-controlled-candidates',
  version: 'f2-41-0.1',
  status: 'DRAFT',
  dimensions: [
    ['D1', 'Corrección funcional observable'],
    ['D2', 'Adecuación conversacional'],
    ['D3', 'Continuidad contextual'],
    ['D4', 'Robustez conversacional'],
    ['D5', 'Seguridad observable'],
    ['D6', 'Rendimiento conversacional observable'],
    ['D7', 'Calidad de interacción e interfaz'],
  ].map(([id, name]) => ({ id, name, objective: `controlled validation for ${id}` })),
  criteria: cases.map((item) => ({
    id: item.criterionId,
    dimensionId: item.dimensionId,
    type: item.type,
    objective: `controlled validation of ${item.criterionId}`,
    preconditions: ['controlled scenario is configured', 'input is reproducible'],
    input: `controlled input for ${item.caseId}`,
    expected: item.expected,
    requiredEvidence: item.requiredEvidence,
    decisionRule: item.decisionRule,
    limitations: ['candidate validation only', 'does not define quality scoring'],
    measurementMethod: item.type === 'NUMERIC' ? 'elapsed time between declared start and end events' : undefined,
    version: 'candidate-0.1',
  })),
});

describe('F2-41 architecture spike: controlled candidate criteria validation', () => {
  it('covers one representative criterion for each candidate dimension', () => {
    expect(new Set(cases.map((item) => item.dimensionId)).size).toBe(7);
    expect(cases).toHaveLength(7);
    expect(methodology.props.criteria).toHaveLength(7);
  });

  it('keeps candidate criteria structurally evaluable without approving the taxonomy', () => {
    expect(methodology.props.status).toBe('DRAFT');
    for (const item of methodology.props.criteria) {
      expect(item.input.trim()).not.toBe('');
      expect(item.expected.trim()).not.toBe('');
      expect(item.decisionRule.trim()).not.toBe('');
      expect(item.requiredEvidence.length).toBeGreaterThan(0);
      expect(item.preconditions.length).toBeGreaterThan(0);
      expect(item.limitations.length).toBeGreaterThan(0);
    }
  });

  it('requires a measurement method for the numeric candidate and preserves primary evidence for AI-assisted criteria', () => {
    const numeric = methodology.props.criteria.find((item) => item.id === 'D6-C01');
    const aiAssisted = methodology.props.criteria.find((item) => item.id === 'D2-C01');

    expect(numeric?.measurementMethod).toContain('elapsed time');
    expect(aiAssisted?.requiredEvidence).toContain('TRANSCRIPT');
    expect(aiAssisted?.requiredEvidence).toContain('AI_ANALYSIS');
  });

  it('does not encode product quality as the output of the controlled validation', () => {
    const serialized = JSON.stringify(cases);
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('REGRESSION');
    expect(serialized).not.toContain('IMPROVEMENT');
  });
});
