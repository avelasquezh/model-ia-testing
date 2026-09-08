export type BotObservation = {
  caseId: string;
  conversationId: string;
  turn: number;
  userInput: string;
  observedResponse: string;
  expectedIntent: string;
  expectedIntentVersion: string;
  evidenceIds: string[];
  channel?: string;
  transport?: string;
  botId?: string;
  botVersion?: string;
  executionId?: string;
  observedAt?: string;
};

export type BotObservationSet = {
  schemaVersion: string;
  observations: BotObservation[];
};
