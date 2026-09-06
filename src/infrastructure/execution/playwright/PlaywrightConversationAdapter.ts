import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../../application/ports/ConversationPort.js';
import type { ConversationUiConfigRepository } from '../../../application/ports/ConversationUiConfigRepository.js';
import type { BrowserAutomationPort } from '../../../application/ports/BrowserAutomationPort.js';
import { PlaywrightConversationUi, type PlaywrightConversationUiConfig } from './PlaywrightConversationUi.js';
import { type PlaywrightBrowserSession } from './PlaywrightBrowserAdapter.js';

export class PlaywrightConversationAdapter implements ConversationPort {
  public constructor(
    private readonly browser: BrowserAutomationPort,
    private readonly uiConfigs: ConversationUiConfigRepository,
  ) {}

  public async open(targetUrl: string, timeoutMs: number): Promise<ConversationSession> {
    const browserSession = (await this.browser.open()) as PlaywrightBrowserSession;
    await browserSession.navigate(targetUrl, timeoutMs);

    const config = await this.uiConfigs.findByTargetUrl(targetUrl);
    const uiConfig = config ? this.toPlaywrightConfig(config) : undefined;
    const ui = uiConfig
      ? new PlaywrightConversationUi(browserSession.page, uiConfig)
      : undefined;

    return new PlaywrightConversationSession(browserSession, ui, timeoutMs);
  }

  private toPlaywrightConfig(config: Awaited<ReturnType<ConversationUiConfigRepository['findByTargetUrl']>>): PlaywrightConversationUiConfig | undefined {
    if (!config) return undefined;

    const toLocator = (locator: typeof config.composer): PlaywrightConversationUiConfig['composer'] => locator;

    return {
      composer: toLocator(config.composer),
      sendButton: config.sendButton ? toLocator(config.sendButton) : undefined,
      response: toLocator(config.response),
      responseTimeoutMs: config.responseTimeoutMs,
      pollIntervalMs: config.pollIntervalMs,
    };
  }
}

class PlaywrightConversationSession implements ConversationSession {
  public constructor(
    private readonly browserSession: Awaited<ReturnType<BrowserAutomationPort['open']>>,
    private readonly ui: PlaywrightConversationUi | undefined,
    private readonly timeoutMs: number,
  ) {}

  public async send(
    input: { readonly value: string },
    timeoutMs: number,
  ): Promise<ConversationResponse> {
    if (!this.ui) {
      void timeoutMs;
      throw new Error(
        `Conversation UI interaction is not configured yet for input: ${input.value.slice(0, 80)} (timeout ${this.timeoutMs}ms)`,
      );
    }

    const value = await this.ui.sendMessage(input.value, timeoutMs);
    return { value, observedAt: new Date() };
  }

  public async close(): Promise<void> {
    await this.browserSession.close();
  }
}
