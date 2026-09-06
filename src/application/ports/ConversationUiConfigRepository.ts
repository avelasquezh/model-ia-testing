export type ConversationUiLocator =
  | { readonly kind: 'role'; readonly role: string; readonly name?: string }
  | { readonly kind: 'label'; readonly value: string }
  | { readonly kind: 'placeholder'; readonly value: string }
  | { readonly kind: 'testId'; readonly value: string }
  | { readonly kind: 'css'; readonly value: string };

export type ConversationUiConfig = {
  readonly composer: ConversationUiLocator;
  readonly sendButton?: ConversationUiLocator;
  readonly response: ConversationUiLocator;
  readonly responseTimeoutMs?: number;
  readonly pollIntervalMs?: number;
};

export interface ConversationUiConfigRepository {
  findByTargetUrl(targetUrl: string): Promise<ConversationUiConfig | null>;
}
