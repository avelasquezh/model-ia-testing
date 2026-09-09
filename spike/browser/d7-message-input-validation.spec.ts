import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';

function startMessageChannel(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>Chatbot</h1>
      <section aria-label="Canal de conversación">
        <label for="composer">Mensaje</label>
        <input id="composer" aria-label="Mensaje" />
        <button id="send" type="button">Enviar</button>
        <div id="messages" aria-live="polite"></div>
      </section>
      <script>
        const composer = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');
        send.addEventListener('click', () => {
          const value = composer.value.trim();
          if (!value) return;
          const message = document.createElement('div');
          message.setAttribute('data-testid', 'sent-message');
          message.textContent = value;
          messages.appendChild(message);
          composer.value = '';
        });
      </script>
    </main>
  </body>
</html>`);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('D7 message channel server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D7-C02: verifies that a valid message can be entered and sent', async () => {
  const controlled = await startMessageChannel();
  const browser = new PlaywrightBrowserAdapter();
  const session = await browser.open();

  try {
    await session.navigate(controlled.url, 5_000);

    const composer = session.page.getByLabel('Mensaje');
    const sendButton = session.page.getByRole('button', { name: 'Enviar' });
    const sentMessage = session.page.getByTestId('sent-message');
    const validMessage = 'Mensaje de prueba válido.';

    await expect(composer).toBeVisible();
    await expect(composer).toBeEditable();
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();

    await composer.fill(validMessage);
    await expect(composer).toHaveValue(validMessage);
    await sendButton.click();

    await expect(sentMessage).toHaveText(validMessage);
    await expect(composer).toHaveValue('');

    const screenshot = new Uint8Array(await session.page.screenshot({ type: 'png' }));
    expect(screenshot.length).toBeGreaterThan(0);

    const observableEvidence = {
      composerVisible: await composer.isVisible(),
      composerEditable: await composer.isEditable(),
      sendButtonVisible: await sendButton.isVisible(),
      sendButtonEnabled: await sendButton.isEnabled(),
      inputValueBeforeSend: validMessage,
      sentMessageObserved: await sentMessage.textContent(),
      inputClearedAfterSend: (await composer.inputValue()) === '',
      screenshotBytes: screenshot.length,
    };

    expect(observableEvidence).toEqual({
      composerVisible: true,
      composerEditable: true,
      sendButtonVisible: true,
      sendButtonEnabled: true,
      inputValueBeforeSend: validMessage,
      sentMessageObserved: validMessage,
      inputClearedAfterSend: true,
      screenshotBytes: expect.any(Number),
    });
    expect(JSON.stringify(observableEvidence)).not.toContain('qualityScore');
    expect(JSON.stringify(observableEvidence)).not.toContain('globalDecision');
  } finally {
    await session.close();
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
