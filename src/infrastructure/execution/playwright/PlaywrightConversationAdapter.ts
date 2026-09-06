import type { Page } from '@playwright/test';
import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../../application/ports/ConversationPort.js';
import type {
  ConversationUiConfig,
  ConversationUiConfigRepository,
  ConversationUiLocator,
} from '../../../application/ports/ConversationUiConfigRepository.js';
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
    const ui = config
      ? new PlaywrightConversationUi(browserSession.page, this.toPlaywrightConfig(config))
      : undefined;

    return new PlaywrightConversationSession(browserSession, ui, timeoutMs);
  }

  private toPlaywrightConfig(config: ConversationUiConfig): PlaywrightConversationUiConfig {
    return {
      composer: this.toPlaywrightLocator(config.composer),
      sendButton: config.sendButton ? this.toPlaywrightLocator(config.sendButton) : undefined,
      response: this.toPlaywrightLocator(config.response),
      responseTimeoutMs: config.responseTimeoutMs,
      pollIntervalMs: config.pollIntervalMs,
    };
  }

  private toPlaywrightLocator(locator: ConversationUiLocator): PlaywrightConversationUiConfig['composer'] {
    switch (locator.kind) {
      case 'role':
        return {
          kind: 'role',
          role: locator.role as Parameters<Page['getByRole']>[0],
          name: locator.name,
        };
      case 'label':
        return { kind: 'label', value: locator.value };
      case 'placeholder':
        return { kind: 'placeholder', value: locator.value };
      case 'testId':
        return { kind: 'testId', value: locator.value };
      case 'css':
        return { kind: 'css', value: locator.value };
    }
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
