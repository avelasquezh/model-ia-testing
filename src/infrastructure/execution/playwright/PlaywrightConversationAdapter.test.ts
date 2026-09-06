import { chromium } from '@playwright/test';
import { afterAll, describe, expect, it, vi } from 'vitest';
import type {
  BrowserAutomationPort,
  BrowserAutomationSession,
} from '../../../application/ports/BrowserAutomationPort.js';
import { PlaywrightConversationAdapter } from './PlaywrightConversationAdapter.js';

const browser = await chromium.launch({ headless: true });

afterAll(async () => {
  await browser.close();
});

function createBrowserPort(page?: Awaited<ReturnType<typeof browser.newPage>>) {
  const session: BrowserAutomationSession & { readonly page?: typeof page } = {
    page,
    navigate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const browserPort: BrowserAutomationPort = {
    open: vi.fn().mockResolvedValue(session),
  };

  return { browserPort, session };
}

describe('PlaywrightConversationAdapter', () => {
  it('opens a conversation session by navigating through the browser port', async () => {
    const { browserPort, session } = createBrowserPort();
    const adapter = new PlaywrightConversationAdapter(browserPort);

    const conversation = await adapter.open('https://example.com/chat', 5_000);

    expect(browserPort.open).toHaveBeenCalledOnce();
    expect(session.navigate).toHaveBeenCalledWith('https://example.com/chat', 5_000);
    await conversation.close();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('does not expose UI mechanics through the conversation contract before selectors are configured', async () => {
    const { browserPort } = createBrowserPort();
    const adapter = new PlaywrightConversationAdapter(browserPort);
    const conversation = await adapter.open('https://example.com/chat', 5_000);

    await expect(conversation.send({ value: 'Hola' }, 3_000)).rejects.toThrow(
      'Conversation UI interaction is not configured yet',
    );

    await conversation.close();
  });

  it('uses the configured conversation UI and returns the observed response', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <button>Enviar</button>
        <div data-testid="assistant-message"></div>
        <script>
          document.querySelector('button').addEventListener('click', () => {
            const response = document.createElement('div');
            response.dataset.testid = 'assistant-message';
            response.textContent = 'Respuesta de prueba';
            document.querySelector('main').appendChild(response);
          });
        </script>
      </main>
    `);

    const session: BrowserAutomationSession & { readonly page: typeof page } = {
      page,
      navigate: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(async () => context.close()),
    };
    const browserPort: BrowserAutomationPort = {
      open: vi.fn().mockResolvedValue(session),
    };

    const adapter = new PlaywrightConversationAdapter(browserPort, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'assistant-message' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    const conversation = await adapter.open('https://example.com/chat', 5_000);
    const response = await conversation.send({ value: 'Hola' }, 2_000);

    expect(response.value).toBe('Respuesta de prueba');
    expect(response.observedAt).toBeInstanceOf(Date);

    await conversation.close();
    expect(session.close).toHaveBeenCalledOnce();
  });
});
