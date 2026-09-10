import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import type { ChatExecutionVerification } from '../ChatDiscoveryReport.js';
import { PlaywrightChatDiscovery } from '../PlaywrightChatDiscovery.js';
import { PlaywrightConversationUi } from '../PlaywrightConversationUi.js';

export type AdaptiveInteractionVerification = {
  readonly execution: ChatExecutionVerification;
  readonly screenshotPaths: readonly string[];
  readonly responseLength?: number;
  readonly error?: string;
};

export async function verifyAdaptiveInteraction(
  page: Page,
  targetId: string,
  message: string,
  evidenceRootDirectory: string,
  timeoutMs: number,
): Promise<AdaptiveInteractionVerification> {
  const targetDirectory = join(evidenceRootDirectory, targetId);
  await mkdir(targetDirectory, { recursive: true });
  const screenshotPaths: string[] = [];

  const chatOpenedPath = join(targetDirectory, 'chat-opened.png');
  await page.screenshot({ path: chatOpenedPath, type: 'png', fullPage: false });
  screenshotPaths.push(chatOpenedPath);

  try {
    const discovery = await new PlaywrightChatDiscovery(page).discoverWithEvidence();
    const ui = new PlaywrightConversationUi(page, discovery.config);
    const response = await ui.sendMessage(message, timeoutMs);

    const responseReceivedPath = join(targetDirectory, 'response-received.png');
    await page.screenshot({ path: responseReceivedPath, type: 'png', fullPage: false });
    screenshotPaths.push(responseReceivedPath);

    return {
      execution: {
        send: 'CONFIRMED',
        receive: 'CONFIRMED',
        conversation: 'VERIFIED',
      },
      screenshotPaths,
      responseLength: response.length,
    };
  } catch (error) {
    return {
      execution: {
        send: 'ATTEMPTED',
        receive: 'FAILED',
        conversation: 'FAILED',
      },
      screenshotPaths,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
}
