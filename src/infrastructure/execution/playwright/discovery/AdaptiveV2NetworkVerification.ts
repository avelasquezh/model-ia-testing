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

export async function verifyAdaptiveV2NetworkConversation(
  page: Page,
  config: PlaywrightConversationUiConfig,
  message: string,
  timeoutMs: number,
): Promise<AdaptiveV2Verification> {
  const network = new NetworkConversationEvidence(page);
  const responseLocator = locatorFromDefinition(page, config.response);
  const before = await readResponseState(responseLocator);
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
        await waitForOutboundOrDomResponse(page, network, responseLocator, before, message, 750);
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
      domResponse = findNewResponse(before, current, message);
      const correlation = network.correlate();
      if (domResponse || correlation.ordered) {
        network.stop();
        const finalNetwork = network.correlate();
        const hasInbound = finalNetwork.ordered;
        return {
          send: 'CONFIRMED',
          receive: domResponse || hasInbound ? 'CONFIRMED' : 'FAILED',
          conversation: domResponse || hasInbound ? 'VERIFIED' : 'FAILED',
          network: finalNetwork,
          domResponseObserved: Boolean(domResponse),
          ...(domResponse ? { responseLength: domResponse.length } : {}),
        };
      }
      await page.waitForTimeout(100);
    }

    network.stop();
    const finalNetwork = network.correlate();
    return {
      send: finalNetwork.outbound ? 'CONFIRMED' : 'FAILED',
      receive: finalNetwork.inbound ? 'CONFIRMED' : 'FAILED',
      conversation: finalNetwork.ordered ? 'VERIFIED' : 'FAILED',
      network: finalNetwork,
      domResponseObserved: false,
      error: 'Timed out waiting for correlated conversation evidence',
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
  input: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (network.correlate().outbound) return;
    const current = await readResponseState(responseLocator);
    if (findNewResponse(previous, current, input)) return;
    await page.waitForTimeout(50);
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
