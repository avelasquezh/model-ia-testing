import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../../application/ports/ConversationPort.js';
import type { BrowserAutomationPort } from '../../../application/ports/BrowserAutomationPort.js';

export class PlaywrightConversationAdapter implements ConversationPort {
  public constructor(private readonly browser: BrowserAutomationPort) {}

  public async open(timeoutMs: number): Promise<ConversationSession> {
    const browserSession = await this.browser.open();
    return new PlaywrightConversationSession(browserSession, timeoutMs);
  }
}

class PlaywrightConversationSession implements ConversationSession {
  public constructor(
    private readonly browserSession: Awaited<ReturnType<BrowserAutomationPort['open']>>,
    private readonly timeoutMs: number,
  ) {}

  public async send(input: { readonly value: string }): Promise<ConversationResponse> {
    throw new Error(
      `Conversation UI interaction is not configured yet for input: ${input.value.slice(0, 80)} (timeout ${this.timeoutMs}ms)`,
    );
  }

  public async close(): Promise<void> {
    await this.browserSession.close();
  }
}
