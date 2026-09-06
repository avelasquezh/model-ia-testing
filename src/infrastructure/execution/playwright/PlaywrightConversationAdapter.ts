import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../../application/ports/ConversationPort.js';
import type { BrowserAutomationPort } from '../../../application/ports/BrowserAutomationPort.js';

export class PlaywrightConversationAdapter implements ConversationPort {
  public constructor(private readonly browser: BrowserAutomationPort) {}

  public async open(targetUrl: string, timeoutMs: number): Promise<ConversationSession> {
    const browserSession = await this.browser.open();
    await browserSession.navigate(targetUrl, timeoutMs);
    return new PlaywrightConversationSession(browserSession, timeoutMs);
  }
}

class PlaywrightConversationSession implements ConversationSession {
  public constructor(
    private readonly browserSession: Awaited<ReturnType<BrowserAutomationPort['open']>>,
    private readonly timeoutMs: number,
  ) {}

  public async send(
    input: { readonly value: string },
    timeoutMs: number,
  ): Promise<ConversationResponse> {
    void timeoutMs;
    throw new Error(
      `Conversation UI interaction is not configured yet for input: ${input.value.slice(0, 80)} (timeout ${this.timeoutMs}ms)`,
    );
  }

  public async close(): Promise<void> {
    await this.browserSession.close();
  }
}
