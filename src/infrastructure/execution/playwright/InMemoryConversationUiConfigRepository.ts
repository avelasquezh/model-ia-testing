import type {
  ConversationUiConfig,
  ConversationUiConfigRepository,
} from '../../../application/ports/ConversationUiConfigRepository.js';

export class InMemoryConversationUiConfigRepository implements ConversationUiConfigRepository {
  private readonly configs = new Map<string, ConversationUiConfig>();

  public constructor(configs: ReadonlyArray<{ targetUrl: string; config: ConversationUiConfig }> = []) {
    for (const entry of configs) {
      this.configs.set(entry.targetUrl, entry.config);
    }
  }

  public async findByTargetUrl(targetUrl: string): Promise<ConversationUiConfig | null> {
    return this.configs.get(targetUrl) ?? null;
  }
}
