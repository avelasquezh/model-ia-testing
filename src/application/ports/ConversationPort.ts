export type ConversationMessage = {
  readonly value: string;
};

export type ConversationResponse = {
  readonly value: string;
  readonly observedAt: Date;
  readonly screenshot?: Uint8Array;
};

export type ConversationSession = {
  send(
    input: ConversationMessage,
    timeoutMs: number,
  ): Promise<ConversationResponse>;
  close(): Promise<void>;
};

export interface ConversationPort {
  open(targetUrl: string, timeoutMs: number): Promise<ConversationSession>;
}
