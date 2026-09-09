import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';

function startInterfaceErrorChannel(): Promise<{ server: Server; url: string }> {
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
        <div id="error" role="alert" aria-live="assertive" hidden></div>
        <div id="messages" aria-live="polite" role="log"></div>
      </section>
      <script>
        const composer = document.getElementById('composer');
        const send = document.getElementById('send');
        const error = document.getElementById('error');
        const messages = document.getElementById('messages');
        send.addEventListener('click', () => {
          const value = composer.value.trim();
          if (!value) return;
          if (value === 'Entrada que provoca error visible.') {
            error.hidden = false;
            error.textContent = 'No fue posible procesar la solicitud. Intenta nuevamente.';
            return;
          }
          error.hidden = true;
          error.textContent = '';
          const responseMessage = document.createElement('div');
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
        reject(new Error('D7 interface error server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D7-C05: verifies observable interface errors are surfaced without misclassifying evidence', async () => {
  const controlled = await startInterfaceErrorChannel();
  const browser = new PlaywrightBrowserAdapter();
  const session = await browser.open();

  try {
    await session.navigate(controlled.url, 5_000);

    const composer = session.page.getByLabel('Mensaje');
    const sendButton = session.page.getByRole('button', { name: 'Enviar' });
    const error = session.page.getByRole('alert');
    const messages = session.page.getByRole('log');
    const invalidFlowInput = 'Entrada que provoca error visible.';
    const expectedError = 'No fue posible procesar la solicitud. Intenta nuevamente.';

    await expect(composer).toBeVisible();
    await expect(composer).toBeEditable();
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    await expect(error).toBeHidden();

    await composer.fill(invalidFlowInput);
    await sendButton.click();

    await expect(error).toBeVisible();
    await expect(error).toHaveText(expectedError);
    await expect(messages).not.toContainText('Bot response: Solicitud procesada.');

    const screenshot = new Uint8Array(await session.page.screenshot({ type: 'png' }));
    expect(screenshot.length).toBeGreaterThan(0);

    const observableEvidence = {
      errorVisible: await error.isVisible(),
      errorTextObserved: await error.textContent(),
      errorRole: await error.getAttribute('role'),
      responseProduced: (await messages.textContent())?.includes('Bot response: Solicitud procesada.') ?? false,
      screenshotBytes: screenshot.length,
    };

    expect(observableEvidence).toEqual({
      errorVisible: true,
      errorTextObserved: expectedError,
      errorRole: 'alert',
      responseProduced: false,
      screenshotBytes: expect.any(Number),
    });
    expect(JSON.stringify(observableEvidence)).not.toContain('qualityScore');
    expect(JSON.stringify(observableEvidence)).not.toContain('globalDecision');
  } finally {
    await session.close();
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
