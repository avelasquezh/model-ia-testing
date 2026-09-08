import { mkdir, writeFile } from 'node:fs/promises';
import { OllamaSemanticEvaluator } from '../../src/infrastructure/evaluation/OllamaSemanticEvaluator.js';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
} from '../../src/domain/evaluation/SemanticEvaluator.js';

type LiveRun = {
  readonly repetition: number;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly outcome: SemanticEvaluationOutput['outcome'];
  readonly justification: string;
  readonly evidenceInsufficient: boolean;
};

type LiveEvidence = {
  readonly protocol: 'F2-EXT-07';
  readonly caseId: 'D2-C01';
  readonly repetitions: number;
  readonly configuration: {
    readonly baseUrl: string;
    readonly modelId: string;
    readonly modelVersion: string;
    readonly promptVersion: string;
    readonly methodVersion: string;
    readonly timeoutMs: number;
  };
  readonly input: {
    readonly criterionId: string;
    readonly criterionVersion: string;
    readonly evidenceIds: readonly string[];
    readonly userInput: string;
    readonly expectedIntent: string;
    readonly expectedIntentVersion: string;
    readonly observedResponse: string;
    readonly allowedContext: readonly string[];
  };
  readonly runs: readonly LiveRun[];
};

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const enabled = process.env.F2_46_LIVE_AI === 'true';
if (!enabled) {
  throw new Error('Live validation is disabled. Set F2_46_LIVE_AI=true explicitly.');
}

const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
const modelId = process.env.OLLAMA_MODEL ?? 'llama3.2';
const modelVersion = process.env.OLLAMA_MODEL_VERSION ?? 'unknown-unpinned';
const promptVersion = 'semantic-prompt-0.1';
const methodVersion = 'AI-METHOD-0.1';
const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? '30000');
const repetitions = Number(process.env.F2_EXT_07_REPETITIONS ?? '3');
const outputPath = process.env.F2_EXT_07_OUTPUT ?? 'artifacts/f2-ext-07-live-evidence.json';

if (!Number.isInteger(repetitions) || repetitions < 3) {
  throw new Error('F2_EXT_07_REPETITIONS must be an integer greater than or equal to 3');
}
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error('OLLAMA_TIMEOUT_MS must be a positive number');
}

const expectedIntent = required('F2_EXT_07_EXPECTED_INTENT');
const observedResponse = required('F2_EXT_07_OBSERVED_RESPONSE');

const input: SemanticEvaluationInput = {
  criterionId: 'D2-C01',
  criterionVersion: 'candidate-0.1',
  evidenceIds: ['primary-turn-1'],
  userInput: process.env.F2_EXT_07_USER_INPUT ?? 'Quiero comprar una camisa azul talla M',
  expectedIntent,
  expectedIntentVersion: 'intent-0.1',
  observedResponse,
  allowedContext: [],
  modelId,
  modelVersion,
  promptVersion,
  methodVersion,
};

const evaluator = new OllamaSemanticEvaluator({
  baseUrl,
  timeoutMs,
  modelId,
  modelVersion,
  promptVersion,
  methodVersion,
});

const runs: LiveRun[] = [];
for (let repetition = 1; repetition <= repetitions; repetition += 1) {
  const startedAt = new Date().toISOString();
  const result = await evaluator.evaluate(input);
  const finishedAt = new Date().toISOString();

  runs.push({
    repetition,
    startedAt,
    finishedAt,
    outcome: result.outcome,
    justification: result.justification,
    evidenceInsufficient: result.evidenceInsufficient,
  });
}

const evidence: LiveEvidence = {
  protocol: 'F2-EXT-07',
  caseId: 'D2-C01',
  repetitions,
  configuration: {
    baseUrl,
    modelId,
    modelVersion,
    promptVersion,
    methodVersion,
    timeoutMs,
  },
  input: {
    criterionId: input.criterionId,
    criterionVersion: input.criterionVersion,
    evidenceIds: input.evidenceIds,
    userInput: input.userInput,
    expectedIntent: input.expectedIntent,
    expectedIntentVersion: input.expectedIntentVersion,
    observedResponse: input.observedResponse,
    allowedContext: input.allowedContext,
  },
  runs,
};

await mkdir(outputPath.includes('/') ? outputPath.slice(0, outputPath.lastIndexOf('/')) : '.', { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(`F2-EXT-07 live evidence written to ${outputPath}`);
