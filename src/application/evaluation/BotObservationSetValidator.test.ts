import { describe, expect, it } from 'vitest';
import { parseBotObservationSet } from './BotObservationSetValidator.js';

describe('BotObservationSetValidator', () => {
  const validObservation = {
    caseId: 'CASE-01',
    conversationId: 'conversation-01',
    repetition: 1,
    turn: 1,
    userInput: 'Quiero una camisa azul',
    observedResponse: 'La intención fue atendida.',
    expectedIntent: 'Identificar intención de compra y conservar atributos explícitos.',
    expectedIntentVersion: '1.0',
    evidenceIds: ['evidence-01'],
  };

  it('accepts a valid observation set', () => {
    const result = parseBotObservationSet({
      schemaVersion: 'bot-observation-0.1',
      observations: [validObservation],
    });

    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]).toEqual(validObservation);
  });

  it('rejects an unsupported schema version', () => {
    expect(() => parseBotObservationSet({
      schemaVersion: 'bot-observation-9.9',
      observations: [validObservation],
    })).toThrow('Unsupported bot observation schema version');
  });

  it('rejects missing required textual fields', () => {
    const invalid = { ...validObservation, observedResponse: '   ' };

    expect(() => parseBotObservationSet({
      schemaVersion: 'bot-observation-0.1',
      observations: [invalid],
    })).toThrow('observedResponse');
  });

  it('rejects invalid repetition and turn values', () => {
    expect(() => parseBotObservationSet({
      schemaVersion: 'bot-observation-0.1',
      observations: [{ ...validObservation, repetition: 0 }],
    })).toThrow('positive integer repetition');

    expect(() => parseBotObservationSet({
      schemaVersion: 'bot-observation-0.1',
      observations: [{ ...validObservation, turn: 1.5 }],
    })).toThrow('positive integer turn');
  });

  it('rejects an empty evidence set', () => {
    expect(() => parseBotObservationSet({
      schemaVersion: 'bot-observation-0.1',
      observations: [{ ...validObservation, evidenceIds: [] }],
    })).toThrow('evidenceIds');
  });
});
