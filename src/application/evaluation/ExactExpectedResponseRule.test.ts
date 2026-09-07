import { describe, expect, it } from 'vitest';
import { ExactExpectedResponseRule } from './ExactExpectedResponseRule.js';

describe('ExactExpectedResponseRule', () => {
  it('returns PASS when the observable transcript response matches exactly', () => {
    const rule = new ExactExpectedResponseRule('rule-exact-response-v1', 'Bot response: Quiero una camisa azul talla M');

    const decision = rule.decide({
      criterionId: 'D1-C01',
      evidence: [
        {
          id: 'e-transcript-1',
          executionId: 'execution-1',
          evidenceType: 'TRANSCRIPT',
          contentReference: JSON.stringify({ input: 'Quiero una camisa azul talla M', response: 'Bot response: Quiero una camisa azul talla M' }),
        },
        {
          id: 'e-screenshot-1',
          executionId: 'execution-1',
          evidenceType: 'SCREENSHOT',
          contentReference: 'memory://execution-1/turn-0.png',
        },
      ],
    });

    expect(decision).toEqual({
      status: 'PASS',
      reason: 'Observed chatbot response matches the deterministic expected response',
    });
  });

  it('returns FAIL when the observable response differs', () => {
    const rule = new ExactExpectedResponseRule('rule-exact-response-v1', 'Bot response: respuesta esperada');

    const decision = rule.decide({
      criterionId: 'D1-C01',
      evidence: [
        {
          id: 'e-transcript-1',
          executionId: 'execution-1',
          evidenceType: 'TRANSCRIPT',
          contentReference: JSON.stringify({ input: 'mensaje', response: 'Bot response: respuesta diferente' }),
        },
      ],
    });

    expect(decision.status).toBe('FAIL');
  });

  it('returns INCONCLUSIVE when transcript evidence cannot expose a response', () => {
    const rule = new ExactExpectedResponseRule('rule-exact-response-v1', 'Bot response: esperado');

    const decision = rule.decide({
      criterionId: 'D1-C01',
      evidence: [
        {
          id: 'e-transcript-1',
          executionId: 'execution-1',
          evidenceType: 'TRANSCRIPT',
          contentReference: 'not-json',
        },
      ],
    });

    expect(decision.status).toBe('INCONCLUSIVE');
  });
});
