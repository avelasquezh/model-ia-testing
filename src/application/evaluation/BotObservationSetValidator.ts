import type { BotObservation, BotObservationSet } from '../../domain/evaluation/BotObservation.js';

const SCHEMA_VERSION = 'bot-observation-0.1';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);

const assertObservation = (value: unknown, index: number): asserts value is BotObservation => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Observation ${index} must be an object`);
  }

  const observation = value as Record<string, unknown>;
  const requiredStrings = [
    'caseId',
    'conversationId',
    'userInput',
    'observedResponse',
    'expectedIntent',
    'expectedIntentVersion',
  ];

  for (const field of requiredStrings) {
    if (!isNonEmptyString(observation[field])) {
      throw new Error(`Observation ${index} requires non-empty string field: ${field}`);
    }
  }

  if (!isPositiveInteger(observation.repetition)) {
    throw new Error(`Observation ${index} requires a positive integer repetition`);
  }

  if (!isPositiveInteger(observation.turn)) {
    throw new Error(`Observation ${index} requires a positive integer turn`);
  }

  if (!isStringArray(observation.evidenceIds)) {
    throw new Error(`Observation ${index} requires a non-empty evidenceIds string array`);
  }
};

export const parseBotObservationSet = (raw: unknown): BotObservationSet => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Bot observation set must be a JSON object');
  }

  const set = raw as Record<string, unknown>;
  if (set.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported bot observation schema version: ${String(set.schemaVersion ?? 'missing')}`);
  }

  if (!Array.isArray(set.observations) || set.observations.length === 0) {
    throw new Error('Bot observation set must contain observations');
  }

  set.observations.forEach(assertObservation);
  return set as BotObservationSet;
};

export { SCHEMA_VERSION as BOT_OBSERVATION_SCHEMA_VERSION };
