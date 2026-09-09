import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';
import { PlaywrightChatDiscovery } from '../../src/infrastructure/execution/playwright/PlaywrightChatDiscovery.js';

type StartedServer = { server: Server; url: string };

function startLauncherFrameChatbot(): Promise<StartedServer> {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    if (request.url === '/frame.html') {
      response.end(`<!doctype html>
<html>
  <body>
    <section aria-label="Chat widget">
      <label for="message">Message</label>
      <input id="message" aria-label="Message" />
      <button type="button">Send</button>
      <div data-testid="message-response" aria-live="polite">Welcome</div>
    </section>
  </body>
</html>`);
      return;
    }

    response.end(`<!doctype html>
<html>
  <body>
    <button id="launcher" type="button" aria-label="Open chat">Open chat</button>
    <div id="container"></div>
    <script>
      document.getElementById('launcher').addEventListener('click', () => {
        if (document.querySelector('iframe')) return;
        const iframe = document.createElement('iframe');
        iframe.src = '/frame.html';
        iframe.title = 'Chat widget';
        document.getElementById('container').appendChild(iframe);
      });
    </script>
  </body>
</html>`);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Launcher-frame chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('automatic discovery opens a launcher and discovers controls inside a frame', async () => {
  const controlled = await startLauncherFrameChatbot();
  const browser = new PlaywrightBrowserAdapter();

  try {
    const session = await browser.open();
    try {
      await session.navigate(controlled.url, 5_000);
      const discovery = new PlaywrightChatDiscovery(session.page);
      const result = await discovery.discoverWithEvidence();

      expect(result.report.status).toBe('DISCOVERED');
      expect(result.report.selected.launcher?.strategy).toContain('role:button');
      expect(result.report.selected.composer?.strategy).toContain('frame:');
      expect(result.report.selected.response?.strategy).toContain('frame:');
      expect(result.config.composer.kind).toBe('locator');
      expect(result.config.response.kind).toBe('locator');
      expect(result.config.sendButton?.kind).toBe('locator');
    } finally {
      await session.close();
    }
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
