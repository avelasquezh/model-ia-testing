import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';

function startInteractionStateChannel(): Promise<{ server: Server; url: string }> {
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
        <div id="status" role="status" aria-live="polite">Listo</div>
        <div id="messages" aria-live="polite" role="log"></div>
      </section>
      <script>
        const composer = document.getElementById('composer');
        const send = document.getElementById('send');
        const status = document.getElementById('status');
        const messages = document.getElementById('messages');
        send.addEventListener('click', () => {
          const value = composer.value.trim();
          if (!value) return;
          send.disabled = true;
          composer.disabled = true;
          status.textContent = 'Procesando solicitud';
          const responseMessage = document.createElement('div');
          responseMessage.textContent = 'Bot response: Solicitud procesada.';
          messages.appendChild(responseMessage);
          send.disabled = false;
          composer.disabled = false;
          status.textContent = 'Listo';
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
        reject(new Error('D7 interaction state server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D7-C04: verifies observable interaction state allows completing the flow', async () => {
  const controlled = await startInteractionStateChannel();
  const browser = new PlaywrightBrowserAdapter();
  const session = await browser.open();

  try {
    await session.navigate(controlled.url, 5_000);

    const composer = session.page.getByLabel('Mensaje');
    const sendButton = session.page.getByRole('button', { name: 'Enviar' });
    const status = session.page.getByRole('status');
    const messages = session.page.getByRole('log');
    const validMessage = 'Solicitud válida para completar el flujo.';
    const expectedResponse = 'Bot response: Solicitud procesada.';

    await expect(status).toBeVisible();
    await expect(status).toHaveText('Listo');
    await expect(composer).toBeVisible();
    await expect(composer).toBeEditable();
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();

    await composer.fill(validMessage);
    await sendButton.click();

    await expect(status).toBeVisible();
    await expect(status).toHaveText('Listo');
    await expect(composer).toBeEditable();
    await expect(sendButton).toBeEnabled();
    await expect(messages).toContainText(expectedResponse);

    const screenshot = new Uint8Array(await session.page.screenshot({ type: 'png' }));
    expect(screenshot.length).toBeGreaterThan(0);

    const observableEvidence = {
      stateVisible: await status.isVisible(),
      stateTextObserved: await status.textContent(),
      inputEditableAfterFlow: await composer.isEditable(),
      sendEnabledAfterFlow: await sendButton.isEnabled(),
      responseObserved: await messages.getByText(expectedResponse).isVisible(),
      screenshotBytes: screenshot.length,
    };

    expect(observableEvidence).toEqual({
      stateVisible: true,
      stateTextObserved: 'Listo',
      inputEditableAfterFlow: true,
      sendEnabledAfterFlow: true,
      responseObserved: true,
      screenshotBytes: expect.any(Number),
    });
    expect(JSON.stringify(observableEvidence)).not.toContain('qualityScore');
    expect(JSON.stringify(observableEvidence)).not.toContain('globalDecision');
  } finally {
    await session.close();
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
