import { describe, expect, it } from 'vitest';
import { EvidenceUnit } from './EvidenceUnit.js';

describe('EvidenceUnit', () => {
  const validProps = {
    id: 'evidence-1',
    runId: 'execution-1',
    scenarioId: 'scenario-1',
    stepId: 'step-1',
    timestamp: new Date('2026-09-06T18:00:00.000Z'),
    evidenceType: 'TRANSCRIPT' as const,
    source: 'conversation-adapter',
    contentReference: 'transcript://execution-1/step-1',
    captureMethod: 'adapter-observation',
  };

  it('creates a minimum evidence unit with traceability context', () => {
    const evidence = new EvidenceUnit(validProps);

    expect(evidence.props).toEqual(validProps);
    expect(evidence.isPrimaryEvidence).toBe(true);
  });

  it('accepts evidence without a step when the evidence belongs to the run', () => {
    const { stepId: _stepId, ...runLevelEvidenceProps } = validProps;
    const evidence = new EvidenceUnit({
      ...runLevelEvidenceProps,
      id: 'evidence-2',
      evidenceType: 'BROWSER_METADATA',
    });

    expect(evidence.props.stepId).toBeUndefined();
  });

  it('marks AI analysis as non-primary evidence', () => {
    const evidence = new EvidenceUnit({
      ...validProps,
      id: 'evidence-3',
      evidenceType: 'AI_ANALYSIS',
      source: 'evaluation-assistant',
      contentReference: 'analysis://execution-1/step-1',
    });

    expect(evidence.isPrimaryEvidence).toBe(false);
  });

  it.each([
    ['id', { id: ' ' }, 'Evidence unit id is required'],
    ['run id', { runId: '' }, 'Evidence unit run id is required'],
    ['scenario id', { scenarioId: ' ' }, 'Evidence unit scenario id is required'],
    ['step id', { stepId: ' ' }, 'Evidence unit step id cannot be empty'],
    ['timestamp', { timestamp: new Date('invalid') }, 'Evidence unit timestamp must be a valid date'],
    ['source', { source: '' }, 'Evidence unit source is required'],
    ['content reference', { contentReference: ' ' }, 'Evidence unit content reference is required'],
    ['capture method', { captureMethod: '' }, 'Evidence unit capture method is required'],
  ])('rejects invalid %s', (_field, override, message) => {
    expect(() => new EvidenceUnit({ ...validProps, ...override })).toThrow(message);
  });
});
