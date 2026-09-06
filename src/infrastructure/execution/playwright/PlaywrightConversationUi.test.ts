import { chromium } from '@playwright/test';
import { afterAll, describe, expect, it } from 'vitest';
import { PlaywrightConversationUi } from './PlaywrightConversationUi.js';

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
});
