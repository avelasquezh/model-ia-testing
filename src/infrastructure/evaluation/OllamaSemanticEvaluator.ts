import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
  SemanticEvaluatorPort,
} from '../../domain/evaluation/SemanticEvaluator.js';

export type OllamaSemanticEvaluatorConfig = {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly promptVersion: string;
  readonly methodVersion: string;
};

type OllamaChatResponse = {
  readonly message?: {
    readonly content?: string;
  };
};

type NormalizedModelOutput = {
  readonly outcome: SemanticEvaluationOutput['outcome'];
  readonly justification: string;
  readonly evidenceInsufficient: boolean;
};

const VALID_OUTCOMES = new Set<SemanticEvaluationOutput['outcome']>([
  'PASS',
  'FAIL',
  'PARTIAL',
  'INCONCLUSIVE',
  'NOT_EVALUABLE',
]);

export class OllamaSemanticEvaluator implements SemanticEvaluatorPort {
  public constructor(private readonly config: OllamaSemanticEvaluatorConfig) {
    if (!config.baseUrl.trim()) throw new Error('Ollama base URL is required');
    if (!config.modelId.trim()) throw new Error('Ollama model id is required');
    if (!config.modelVersion.trim()) throw new Error('Ollama model version is required');
    if (!config.promptVersion.trim()) throw new Error('Prompt version is required');
    if (!config.methodVersion.trim()) throw new Error('Method version is required');
    if (config.timeoutMs <= 0) throw new Error('Ollama timeout must be greater than zero');
  }

  public async evaluate(input: SemanticEvaluationInput): Promise<SemanticEvaluationOutput> {
    if (input.modelId !== this.config.modelId) {
      throw new Error(`Model mismatch: input=${input.modelId}, configured=${this.config.modelId}`);
    }
    if (input.modelVersion !== this.config.modelVersion) {
      throw new Error(`Model version mismatch: input=${input.modelVersion}, configured=${this.config.modelVersion}`);
    }
    if (input.promptVersion !== this.config.promptVersion) {
      throw new Error(`Prompt version mismatch: input=${input.promptVersion}, configured=${this.config.promptVersion}`);
    }
    if (input.methodVersion !== this.config.methodVersion) {
      throw new Error(`Method version mismatch: input=${input.methodVersion}, configured=${this.config.methodVersion}`);
    }
    if (input.evidenceIds.length === 0) {
      throw new Error('Semantic evaluation requires primary evidence references');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.modelId,
          stream: false,
          format: 'json',
          messages: [
            {
              role: 'system',
              content:
                'Evalúa únicamente la correspondencia entre la intención esperada y la respuesta observada. No inventes intención ni evidencia. Devuelve JSON con outcome, justification y evidenceInsufficient. outcome debe ser PASS, FAIL, PARTIAL, INCONCLUSIVE o NOT_EVALUABLE.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                userInput: input.userInput,
                expectedIntent: input.expectedIntent,
                allowedContext: input.allowedContext,
                observedResponse: input.observedResponse,
              }),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with HTTP ${response.status}`);
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const content = payload.message?.content?.trim();
      if (!content) throw new Error('Ollama response did not contain message.content');

      const parsed = this.parseModelOutput(content);

      return {
        ...parsed,
        modelId: this.config.modelId,
        modelVersion: this.config.modelVersion,
        promptVersion: this.config.promptVersion,
        methodVersion: this.config.methodVersion,
        criterionId: input.criterionId,
        criterionVersion: input.criterionVersion,
        evidenceIds: input.evidenceIds,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseModelOutput(content: string): NormalizedModelOutput {
    let value: unknown;
    try {
      value = JSON.parse(content);
    } catch {
      throw new Error('Ollama evaluator returned non-JSON content');
    }

    if (!value || typeof value !== 'object') {
      throw new Error('Ollama evaluator returned an invalid JSON object');
    }

    const record = value as Record<string, unknown>;
    const outcome = record.outcome;
    const justification = record.justification;
    const evidenceInsufficient = record.evidenceInsufficient;

    if (typeof outcome !== 'string' || !VALID_OUTCOMES.has(outcome as SemanticEvaluationOutput['outcome'])) {
      throw new Error('Ollama evaluator returned an unsupported outcome');
    }
    if (typeof justification !== 'string' || !justification.trim()) {
      throw new Error('Ollama evaluator returned an empty justification');
    }
    if (typeof evidenceInsufficient !== 'boolean') {
      throw new Error('Ollama evaluator must declare evidenceInsufficient');
    }

    return {
      outcome: outcome as SemanticEvaluationOutput['outcome'],
      justification: justification.trim(),
      evidenceInsufficient,
    };
  }
}
