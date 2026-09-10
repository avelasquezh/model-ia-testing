import { chromium } from '@playwright/test';
import { afterAll, describe, expect, it } from 'vitest';
import { ConversationResponseTimeoutError, PlaywrightConversationUi } from './PlaywrightConversationUi.js';

const browser = await chromium.launch({ headless: true });

afterAll(async () => {
  await browser.close();
});

describe('PlaywrightConversationUi', () => {
  it('sends a message and waits for a new assistant response', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <label for="composer">Mensaje</label>
        <input id="composer" />
        <button id="send">Enviar</button>
        <div data-testid="assistant-message"></div>
        <script>
          document.getElementById('send').addEventListener('click', () => {
            const message = document.getElementById('composer').value;
            const response = document.createElement('div');
            response.dataset.testid = 'assistant-message';
            response.textContent = 'Respuesta a: ' + message;
            document.querySelector('main').appendChild(response);
          });
        </script>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'label', value: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'assistant-message' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    await expect(ui.sendMessage('Hola', 2_000)).resolves.toBe('Respuesta a: Hola');

    await context.close();
  });

  it('can submit with Enter when no send button is configured', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <div data-testid="assistant-message"></div>
        <script>
          document.querySelector('input').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              const response = document.createElement('div');
              response.dataset.testid = 'assistant-message';
              response.textContent = 'Respuesta a: ' + event.target.value;
              document.querySelector('main').appendChild(response);
            }
          });
        </script>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      response: { kind: 'testId', value: 'assistant-message' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    await expect(ui.sendMessage('Hola otra vez', 2_000)).resolves.toBe('Respuesta a: Hola otra vez');

    await context.close();
  });

  it('detects a new response even when its text repeats the previous response', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <button id="send">Enviar</button>
        <div data-testid="assistant-message">Respuesta fija</div>
        <script>
          document.getElementById('send').addEventListener('click', () => {
            const response = document.createElement('div');
            response.dataset.testid = 'assistant-message';
            response.textContent = 'Respuesta fija';
            document.querySelector('main').appendChild(response);
          });
        </script>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'assistant-message' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    await expect(ui.sendMessage('Hola', 2_000)).resolves.toBe('Respuesta fija');

    await context.close();
  });

  it('detects a response appended after a user message inside the same response log', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <button id="send">Enviar</button>
        <div data-testid="chat-message">Bienvenido</div>
        <script>
          document.getElementById('send').addEventListener('click', () => {
            const user = document.createElement('div');
            user.dataset.testid = 'chat-message';
            user.textContent = 'Hola';
            document.querySelector('main').appendChild(user);
            setTimeout(() => {
              const response = document.createElement('div');
              response.dataset.testid = 'chat-message';
              response.textContent = 'Respuesta real';
              document.querySelector('main').appendChild(response);
            }, 50);
          });
        </script>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'chat-message' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    await expect(ui.sendMessage('Hola', 2_000)).resolves.toBe('Respuesta real');

    await context.close();
  });

  it('falls back from an empty deferred locator to an observable live response surface', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <button id="send">Enviar</button>
        <div aria-live="polite"></div>
        <script>
          document.getElementById('send').addEventListener('click', () => {
            document.querySelector('[aria-live="polite"]').textContent = 'Respuesta nueva';
          });
        </script>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'css', value: '[data-testid*="message" i]' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    await expect(ui.sendMessage('Hello', 2_000)).resolves.toBe('Respuesta nueva');

    await context.close();
  });

  it('waits through a transient response state before returning the stable response', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <button id="send">Enviar</button>
        <div data-testid="assistant-message">Bienvenido</div>
        <script>
          document.getElementById('send').addEventListener('click', () => {
            const response = document.querySelector('[data-testid="assistant-message"]');
            response.textContent = 'Escribiendo…';
            setTimeout(() => { response.textContent = 'Respuesta final'; }, 50);
          });
        </script>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'assistant-message' },
      responseTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    await expect(ui.sendMessage('Hola', 2_000)).resolves.toBe('Respuesta final');

    await context.close();
  });

  it('raises a typed response timeout error when no new observable response appears', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <input aria-label="Mensaje" />
        <button id="send">Enviar</button>
        <div data-testid="assistant-message">Bienvenido</div>
      </main>
    `);

    const ui = new PlaywrightConversationUi(page, {
      composer: { kind: 'role', role: 'textbox', name: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'assistant-message' },
      responseTimeoutMs: 100,
      pollIntervalMs: 10,
    });

    const error = await ui.sendMessage('Hola', 100).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ConversationResponseTimeoutError);
    expect(error).toMatchObject({
      name: 'RESPONSE_TIMEOUT',
      message: 'Conversation response was not observed before timeout',
    });

    await context.close();
  });
});
