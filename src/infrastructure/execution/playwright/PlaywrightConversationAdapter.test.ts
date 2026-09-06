import { describe, expect, it, vi } from 'vitest';
import type {
  BrowserAutomationPort,
  BrowserAutomationSession,
} from '../../../application/ports/BrowserAutomationPort.js';
import { PlaywrightConversationAdapter } from './PlaywrightConversationAdapter.js';

function createBrowserPort() {
  const session: BrowserAutomationSession = {
    navigate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const browser: BrowserAutomationPort = {
    open: vi.fn().mockResolvedValue(session),
  };

  return { browser, session };
}

describe('PlaywrightConversationAdapter', () => {
  it('opens a conversation session by navigating through the browser port', async () => {
    const { browser, session } = createBrowserPort();
    const adapter = new PlaywrightConversationAdapter(browser);

    const conversation = await adapter.open('https://example.com/chat', 5_000);

    expect(browser.open).toHaveBeenCalledOnce();
    expect(session.navigate).toHaveBeenCalledWith('https://example.com/chat', 5_000);
    await conversation.close();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('does not expose UI mechanics through the conversation contract before selectors are configured', async () => {
    const { browser } = createBrowserPort();
    const adapter = new PlaywrightConversationAdapter(browser);
    const conversation = await adapter.open('https://example.com/chat', 5_000);

    await expect(conversation.send({ value: 'Hola' }, 3_000)).rejects.toThrow(
      'Conversation UI interaction is not configured yet',
    );

    await conversation.close();
  });
});
