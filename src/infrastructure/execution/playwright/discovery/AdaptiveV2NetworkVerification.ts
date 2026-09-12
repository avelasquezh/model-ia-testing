import type { Page } from '@playwright/test';
import type { PlaywrightConversationUiConfig } from '../PlaywrightConversationUi.js';
import { locatorFromDefinition, NetworkConversationEvidence, type NetworkCorrelationResult } from './NetworkCorrelatedConversationVerification.js';

export type AdaptiveV2Verification = {
  readonly send: 'CONFIRMED' | 'FAILED';
  readonly receive: 'CONFIRMED' | 'FAILED';
  readonly conversation: 'VERIFIED' | 'FAILED';
  readonly network: NetworkCorrelationResult;
  readonly domResponseObserved: boolean;
  readonly responseLength?: number;
  readonly error?: string;
};

type ResponseState = { readonly count: number; readonly values: readonly string[] };

const BROAD_RESPONSE_SELECTOR = [
  '[aria-live]',
  '[role="log"]',
  '[role="status"]',
  '[role="alert"]',
  '[data-testid*="message" i]',
  '[data-testid*="response" i]',
  '[class*="message" i]',
  '[class*="response" i]',
  '[id*="message" i]',
  '[id*="response" i]',
].join(',');

export async function verifyAdaptiveV2NetworkConversation(
  page: Page,
  config: PlaywrightConversationUiConfig,
  message: string,
  timeoutMs: number,
): Promise<AdaptiveV2Verification> {
  const network = new NetworkConversationEvidence(page);
  const responseLocator = locatorFromDefinition(page, config.response);
  const before = await readResponseState(responseLocator);
  const broadBefore = await readBroadResponseState(page);
  const startedAt = Date.now();

  try {
    network.start(message);
    const composer = locatorFromDefinition(page, config.composer);
    await composer.fill(message, { timeout: timeoutMs });
    network.markSend();

    if (config.sendButton) {
      const sendButton = locatorFromDefinition(page, config.sendButton);
      if (await sendButton.isEnabled().catch(() => false)) {
        await sendButton.click({ timeout: timeoutMs });
        await waitForOutboundOrDomResponse(page, network, responseLocator, before, broadBefore, message, Math.min(2_000, timeoutMs));
      }

      const afterClick = network.correlate();
      if (!afterClick.outbound) {
        await composer.press('Enter', { timeout: timeoutMs });
      }
    } else {
      await composer.press('Enter', { timeout: timeoutMs });
    }

    const deadline = startedAt + timeoutMs;
    let domResponse: string | null = null;
    while (Date.now() < deadline) {
      const current = await readResponseState(responseLocator);
      const broadCurrent = await readBroadResponseState(page);
      domResponse = findNewResponse(before, current, message) ?? findNewResponse(broadBefore, broadCurrent, message);
      const correlation = network.correlate();
      if (domResponse || correlation.ordered) {
        network.stop();
        const finalNetwork = network.correlate();
        const hasInbound = finalNetwork.ordered;
        return {
          send: finalNetwork.outbound ? 'CONFIRMED' : 'FAILED',
          receive: domResponse || hasInbound ? 'CONFIRMED' : 'FAILED',
          conversation: domResponse || hasInbound ? 'VERIFIED' : 'FAILED',
          network: finalNetwork,
          domResponseObserved: Boolean(domResponse),
          ...(domResponse ? { responseLength: domResponse.length } : {}),
        };
      }
      await page.waitForTimeout(150);
    }

    network.stop();
    const finalNetwork = network.correlate();
    return {
      send: finalNetwork.outbound ? 'CONFIRMED' : 'FAILED',
      receive: finalNetwork.inbound ? 'CONFIRMED' : 'FAILED',
      conversation: finalNetwork.ordered ? 'VERIFIED' : 'FAILED',
      network: finalNetwork,
      domResponseObserved: false,
      error: `Timed out waiting for correlated conversation evidence after ${timeoutMs}ms`,
    };
  } catch (error) {
    network.stop();
    const finalNetwork = network.correlate();
    return {
      send: finalNetwork.outbound ? 'CONFIRMED' : 'FAILED',
      receive: finalNetwork.inbound ? 'CONFIRMED' : 'FAILED',
      conversation: finalNetwork.ordered ? 'VERIFIED' : 'FAILED',
      network: finalNetwork,
      domResponseObserved: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
}

async function waitForOutboundOrDomResponse(
  page: Page,
  network: NetworkConversationEvidence,
  responseLocator: ReturnType<typeof locatorFromDefinition>,
  previous: ResponseState,
  broadPrevious: ResponseState,
  input: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (network.correlate().outbound) return;
    const current = await readResponseState(responseLocator);
    if (findNewResponse(previous, current, input)) return;
    const broadCurrent = await readBroadResponseState(page);
    if (findNewResponse(broadPrevious, broadCurrent, input)) return;
    await page.waitForTimeout(75);
  }
}

async function readResponseState(locator: ReturnType<typeof locatorFromDefinition>): Promise<ResponseState> {
  try {
    const count = await locator.count();
    const values: string[] = [];
    for (let index = 0; index < count; index += 1) {
      values.push((await locator.nth(index).textContent())?.trim() ?? '');
    }
    return { count, values };
  } catch {
    return { count: 0, values: [] };
  }
}

async function readBroadResponseState(page: Page): Promise<ResponseState> {
  const values: string[] = [];
  for (const context of [page, ...page.frames().filter((frame) => frame !== page.mainFrame())]) {
    try {
      const locator = context.locator(BROAD_RESPONSE_SELECTOR);
      const count = Math.min(await locator.count(), 120);
      for (let index = 0; index < count; index += 1) {
        const text = (await locator.nth(index).textContent())?.trim() ?? '';
        if (text) values.push(text.slice(0, 2_000));
      }
    } catch {
      // A detached cross-origin frame is evidence of volatility, not a verifier failure.
    }
  }
  return { count: values.length, values };
}

function findNewResponse(previous: ResponseState, current: ResponseState, input: string): string | null {
  const previousValues = new Set(previous.values.filter(Boolean));
  const normalizedInput = input.trim();
  for (const value of current.values) {
    const normalized = value.trim();
    if (!normalized || normalized === normalizedInput) continue;
    if (!previousValues.has(normalized)) return normalized;
  }
  return null;
}
