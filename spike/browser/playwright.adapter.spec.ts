import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../infrastructure/PlaywrightBrowserAdapter.js';

test('SPIKE-005: Playwright adapter interacts with a controlled page', async () => {
  const adapter = new PlaywrightBrowserAdapter();
  await adapter.open('data:text/html,<html><body>controlled target</body></html>');

  try {
    const response = await adapter.sendMessage('hello');
    expect(response).toContain('controlled target');
  } finally {
    await adapter.close();
  }
});
