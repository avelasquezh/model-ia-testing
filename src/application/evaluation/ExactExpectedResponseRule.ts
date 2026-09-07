import { ResponseMatchesExpected } from '../../domain/evaluation/ResponseMatchesExpected.js';
import type { CriterionDecision, CriterionDecisionRule } from './EvaluateCriterion.js';
import type { EvaluationEvidence } from '../ports/EvidenceCatalog.js';

export class ExactExpectedResponseRule implements CriterionDecisionRule {
  public constructor(
    public readonly version: string,
    private readonly expectedResponse: string,
  ) {
    if (!version.trim()) throw new Error('Rule version is required');
    if (!expectedResponse.trim()) throw new Error('Expected response is required');
  }

  public decide(input: {
    readonly criterionId: string;
    readonly evidence: readonly EvaluationEvidence[];
  }): CriterionDecision {
    const transcript = input.evidence.find((candidate) => candidate.evidenceType === 'TRANSCRIPT');
    if (!transcript) {
      return {
        status: 'INCONCLUSIVE',
        reason: 'Transcript evidence is required by the deterministic response rule',
      };
    }

    let observedResponse: string;
    try {
      const payload: unknown = JSON.parse(transcript.contentReference);
      if (!payload || typeof payload !== 'object' || !('response' in payload)) {
        return {
          status: 'INCONCLUSIVE',
          reason: `Transcript evidence for ${input.criterionId} does not expose an observable response`,
        };
      }
      const response = (payload as { response?: unknown }).response;
      if (typeof response !== 'string') {
        return {
          status: 'INCONCLUSIVE',
          reason: `Transcript evidence for ${input.criterionId} contains a non-text response`,
        };
      }
      observedResponse = response;
    } catch {
      return {
        status: 'INCONCLUSIVE',
        reason: `Transcript evidence for ${input.criterionId} is not a valid observable response record`,
      };
    }

    const passed = ResponseMatchesExpected.evaluate({
      expected: this.expectedResponse,
      observed: observedResponse,
    });

    return {
      status: passed ? 'PASS' : 'FAIL',
      reason: passed
        ? 'Observed chatbot response matches the deterministic expected response'
        : 'Observed chatbot response does not match the deterministic expected response',
    };
  }
}
