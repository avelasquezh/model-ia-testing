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
import { PlaywrightChatDiscovery } from './PlaywrightChatDiscovery.js';
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
    if (!config && !browserSession.page) {
      return new PlaywrightConversationSession(
        browserSession,
        new UnconfiguredConversationUi(),
        timeoutMs,
      );
    }

    const uiConfig = config
      ? this.toPlaywrightConfig(config)
      : await new PlaywrightChatDiscovery(browserSession.page).discover();

    const ui = new PlaywrightConversationUi(browserSession.page, uiConfig);
    return new PlaywrightConversationSession(browserSession, ui, timeoutMs);
  }

  private toPlaywrightConfig(config: ConversationUiConfig): PlaywrightConversationUiConfig {
    return {
      composer: this.toPlaywrightLocator(config.composer),
      response: this.toPlaywrightLocator(config.response),
      ...(config.sendButton !== undefined
        ? { sendButton: this.toPlaywrightLocator(config.sendButton) }
        : {}),
      ...(config.responseTimeoutMs !== undefined
        ? { responseTimeoutMs: config.responseTimeoutMs }
        : {}),
      ...(config.pollIntervalMs !== undefined
        ? { pollIntervalMs: config.pollIntervalMs }
        : {}),
    };
  }

  private toPlaywrightLocator(locator: ConversationUiLocator): PlaywrightConversationUiConfig['composer'] {
    switch (locator.kind) {
      case 'role':
        return { kind: 'role', role: locator.role as Parameters<Page['getByRole']>[0], ...(locator.name !== undefined ? { name: locator.name } : {}) };
      case 'label': return { kind: 'label', value: locator.value };
      case 'placeholder': return { kind: 'placeholder', value: locator.value };
      case 'testId': return { kind: 'testId', value: locator.value };
      case 'css': return { kind: 'css', value: locator.value };
    }
  }
}

class UnconfiguredConversationUi implements ConversationUi {
  public async sendMessage(_input: string, _timeoutMs: number): Promise<string> {
    throw new Error('Conversation UI interaction is not configured yet');
  }
}

interface ConversationUi {
  sendMessage(input: string, timeoutMs: number): Promise<string>;
}

class PlaywrightConversationSession implements ConversationSession {
  public constructor(
    private readonly browserSession: PlaywrightBrowserSession,
    private readonly ui: ConversationUi,
    private readonly timeoutMs: number,
  ) {}

  public async send(input: { readonly value: string }, timeoutMs: number): Promise<ConversationResponse> {
    void this.timeoutMs;
    const value = await this.ui.sendMessage(input.value, timeoutMs);
    const observedAt = new Date();
    const screenshot = new Uint8Array(await this.browserSession.page.screenshot({ type: 'png' }));
    return { value, observedAt, screenshot };
  }

  public async close(): Promise<void> {
    await this.browserSession.close();
  }
}
