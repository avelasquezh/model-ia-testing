import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
  SemanticEvaluatorPort,
} from '../../domain/evaluation/SemanticEvaluator.js';

export type SemanticEvaluatorHttpResponse = {
  readonly status: number;
  readonly json: () => Promise<unknown>;
};

export type SemanticEvaluatorHttpTransport = (
  endpoint: string,
  init: {
    readonly method: 'POST';
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
  },
) => Promise<SemanticEvaluatorHttpResponse>;

export type SemanticEvaluatorResponseMapper = (
  input: SemanticEvaluationInput,
  payload: unknown,
) => SemanticEvaluationOutput;

export type HttpSemanticEvaluatorAdapterOptions = {
  readonly endpoint: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly transport?: SemanticEvaluatorHttpTransport;
  readonly mapResponse: SemanticEvaluatorResponseMapper;
};

/**
 * Infrastructure boundary for an external semantic evaluator.
 *
 * Provider-specific request/response formats remain outside the domain. A
 * provider adapter supplies only a mapper and, when required, its transport.
 * Credentials are supplied through headers by the composition root and are
 * never stored by this class.
 */
export class HttpSemanticEvaluatorAdapter implements SemanticEvaluatorPort {
  private readonly endpoint: string;
  private readonly headers: Readonly<Record<string, string>>;
  private readonly transport: SemanticEvaluatorHttpTransport;
  private readonly mapResponse: SemanticEvaluatorResponseMapper;

  public constructor(options: HttpSemanticEvaluatorAdapterOptions) {
    if (!options.endpoint.trim()) throw new Error('Evaluator endpoint is required');

    this.endpoint = options.endpoint;
    this.headers = {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    };
    this.transport = options.transport ?? defaultHttpTransport;
    this.mapResponse = options.mapResponse;
  }

  public async evaluate(input: SemanticEvaluationInput): Promise<SemanticEvaluationOutput> {
    const response = await this.transport(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(input),
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Semantic evaluator request failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    return this.mapResponse(input, payload);
  }
}

const defaultHttpTransport: SemanticEvaluatorHttpTransport = async (endpoint, init) => {
  const response = await fetch(endpoint, init);
  return {
    status: response.status,
    json: () => response.json() as Promise<unknown>,
  };
};
