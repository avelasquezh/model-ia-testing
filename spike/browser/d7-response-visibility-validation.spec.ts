import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';

function startResponseChannel(): Promise<{ server: Server; url: string }> {
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
        <div id="messages" aria-live="polite" role="log"></div>
      </section>
      <script>
        const composer = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');
        send.addEventListener('click', () => {
          const value = composer.value.trim();
          if (!value) return;
          const responseMessage = document.createElement('div');
          responseMessage.setAttribute('data-testid', 'bot-response');
          responseMessage.textContent = 'Bot response: Solicitud procesada.';
          messages.appendChild(responseMessage);
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
        reject(new Error('D7 response channel server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D7-C03: verifies that the response is visible to the user', async () => {
  const controlled = await startResponseChannel();
  const browser = new PlaywrightBrowserAdapter();
  const session = await browser.open();

  try {
    await session.navigate(controlled.url, 5_000);

    const composer = session.page.getByLabel('Mensaje');
    const sendButton = session.page.getByRole('button', { name: 'Enviar' });
    const responseLog = session.page.getByRole('log');
    const botResponse = session.page.getByTestId('bot-response');
    const validMessage = 'Mensaje para generar respuesta.';
    const expectedResponse = 'Bot response: Solicitud procesada.';

    await expect(composer).toBeVisible();
    await expect(composer).toBeEditable();
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();

    await composer.fill(validMessage);
    await sendButton.click();

    await expect(responseLog).toBeVisible();
    await expect(botResponse).toBeVisible();
    await expect(botResponse).toHaveText(expectedResponse);

    const screenshot = new Uint8Array(await session.page.screenshot({ type: 'png' }));
    expect(screenshot.length).toBeGreaterThan(0);

    const observableEvidence = {
      responseContainerVisible: await responseLog.isVisible(),
      responseVisible: await botResponse.isVisible(),
      responseTextObserved: await botResponse.textContent(),
      responseContainerRole: await responseLog.getAttribute('role'),
      screenshotBytes: screenshot.length,
    };

    expect(observableEvidence).toEqual({
      responseContainerVisible: true,
      responseVisible: true,
      responseTextObserved: expectedResponse,
      responseContainerRole: 'log',
      screenshotBytes: expect.any(Number),
    });
    expect(JSON.stringify(observableEvidence)).not.toContain('qualityScore');
    expect(JSON.stringify(observableEvidence)).not.toContain('globalDecision');
  } finally {
    await session.close();
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
