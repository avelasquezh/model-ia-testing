import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';

test('SPIKE-005: Playwright adapter opens and navigates a controlled page', async () => {
  const adapter = new PlaywrightBrowserAdapter();
  const session = await adapter.open();

  try {
    await session.navigate(
      'data:text/html,<html><body><h1>controlled target</h1></body></html>',
      5_000,
    );

    await expect(session.page.getByRole('heading', { name: 'controlled target' })).toBeVisible();
  } finally {
    await session.close();
  }
});
