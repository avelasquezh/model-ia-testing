import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../../application/ports/ConversationPort.js';
import type { BrowserAutomationPort } from '../../../application/ports/BrowserAutomationPort.js';
import { PlaywrightConversationUi, type PlaywrightConversationUiConfig } from './PlaywrightConversationUi.js';
import { type PlaywrightBrowserSession } from './PlaywrightBrowserAdapter.js';

export class PlaywrightConversationAdapter implements ConversationPort {
  public constructor(
    private readonly browser: BrowserAutomationPort,
    private readonly uiConfig?: PlaywrightConversationUiConfig,
  ) {}

  public async open(targetUrl: string, timeoutMs: number): Promise<ConversationSession> {
    const browserSession = (await this.browser.open()) as PlaywrightBrowserSession;
    await browserSession.navigate(targetUrl, timeoutMs);

    const ui = this.uiConfig
      ? new PlaywrightConversationUi(browserSession.page, this.uiConfig)
      : undefined;

    return new PlaywrightConversationSession(browserSession, ui, timeoutMs);
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
