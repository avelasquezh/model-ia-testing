import type { Locator, Page } from '@playwright/test';
import type { PlaywrightConversationUiConfig, PlaywrightLocatorDefinition } from './PlaywrightConversationUi.js';
import type { ChatDiscoveryCandidate, ChatDiscoveryReport } from './ChatDiscoveryReport.js';

export class PlaywrightChatDiscovery {
  public constructor(private readonly page: Page) {}

  public async discover(): Promise<PlaywrightConversationUiConfig> {
    const result = await this.discoverWithEvidence();
    return result.config;
  }

  public async discoverWithEvidence(): Promise<{
    readonly config: PlaywrightConversationUiConfig;
    readonly report: ChatDiscoveryReport;
  }> {
    const candidates: ChatDiscoveryCandidate[] = [];
    const selected: ChatDiscoveryReport['selected'] = {};

    try {
      const composerCandidates = [
        { strategy: 'role:textbox[name~message|mensaje|chat|escribe|type]', locator: this.page.getByRole('textbox', { name: /message|mensaje|chat|escribe|type/i }), confidence: 'HIGH' as const },
        { strategy: 'placeholder~message|mensaje|chat|escribe|type', locator: this.page.getByPlaceholder(/message|mensaje|chat|escribe|type/i), confidence: 'HIGH' as const },
        { strategy: 'textarea', locator: this.page.locator('textarea'), confidence: 'MEDIUM' as const },
        { strategy: 'input[type=text]', locator: this.page.locator('input[type="text"]'), confidence: 'LOW' as const },
        { strategy: '[contenteditable=true]', locator: this.page.locator('[contenteditable="true"]'), confidence: 'MEDIUM' as const },
      ];
      const composer = await this.findFirstVisible(composerCandidates.map((candidate) => candidate.locator));
      await this.recordCandidates(candidates, 'composer', composerCandidates, composer);
      if (!composer) throw new Error('Chat composer could not be discovered on the public URL');
      selected.composer = await this.selection(composer, composerCandidates);

      const sendCandidates = [
        { strategy: 'role:button[name~send|enviar|submit|mandar]', locator: this.page.getByRole('button', { name: /send|enviar|submit|mandar/i }), confidence: 'HIGH' as const },
        { strategy: 'button[aria-label*=send]', locator: this.page.locator('button[aria-label*="send" i]'), confidence: 'HIGH' as const },
        { strategy: 'button[title*=send]', locator: this.page.locator('button[title*="send" i]'), confidence: 'MEDIUM' as const },
        { strategy: 'button[aria-label*=enviar]', locator: this.page.locator('button[aria-label*="enviar" i]'), confidence: 'HIGH' as const },
        { strategy: 'button[title*=enviar]', locator: this.page.locator('button[title*="enviar" i]'), confidence: 'MEDIUM' as const },
      ];
      const sendButton = await this.findFirstVisible(sendCandidates.map((candidate) => candidate.locator));
      await this.recordCandidates(candidates, 'sendButton', sendCandidates, sendButton);
      if (sendButton) selected.sendButton = await this.selection(sendButton, sendCandidates);

      const responseCandidates = [
        { strategy: '[data-testid*=message]', locator: this.page.locator('[data-testid*="message" i]'), confidence: 'HIGH' as const },
        { strategy: '[aria-live=polite]', locator: this.page.locator('[aria-live="polite"]'), confidence: 'HIGH' as const },
        { strategy: '[aria-live=assertive]', locator: this.page.locator('[aria-live="assertive"]'), confidence: 'HIGH' as const },
        { strategy: 'role:log', locator: this.page.getByRole('log'), confidence: 'HIGH' as const },
        { strategy: '[class*=response]', locator: this.page.locator('[class*="response" i]'), confidence: 'MEDIUM' as const },
        { strategy: '[class*=message]', locator: this.page.locator('[class*="message" i]'), confidence: 'LOW' as const },
      ];
      const response = await this.findFirstVisibleExcluding(
        responseCandidates.map((candidate) => candidate.locator),
        [composer, sendButton],
      );
      await this.recordCandidates(candidates, 'response', responseCandidates, response);
      if (!response) throw new Error('Chat response could not be discovered on the public URL');
      selected.response = await this.selection(response, responseCandidates);

      return {
        config: {
          composer: this.toDefinition(composer),
          response: this.toDefinition(response),
          ...(sendButton ? { sendButton: this.toDefinition(sendButton) } : {}),
        },
        report: this.buildReport('DISCOVERED', candidates, selected),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ChatDiscoveryError(message, this.buildReport('FAILED', candidates, selected, message));
    }
  }

  private buildReport(
    status: ChatDiscoveryReport['status'],
    candidates: readonly ChatDiscoveryCandidate[],
    selected: ChatDiscoveryReport['selected'],
    error?: string,
  ): ChatDiscoveryReport {
    return {
      schemaVersion: 'chat-discovery-0.1',
      targetUrl: this.page.url(),
      status,
      discoveredAt: new Date().toISOString(),
      candidates,
      selected,
      ...(error ? { error } : {}),
    };
  }

  private async recordCandidates<T extends { strategy: string; locator: Locator; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }>(
    report: ChatDiscoveryCandidate[],
    role: ChatDiscoveryCandidate['role'],
    candidates: readonly T[],
    selected: Locator | null,
  ): Promise<void> {
    for (const candidate of candidates) {
      const count = await candidate.locator.count();
      let visible = false;
      let element: ChatDiscoveryCandidate['element'];
      if (count > 0) {
        for (let index = 0; index < count; index += 1) {
          const item = candidate.locator.nth(index);
          if (await item.isVisible()) {
            visible = true;
            element = await this.elementEvidence(item);
            break;
          }
        }
      }
      const selectedMatch = selected && count > 0 ? await this.sameElement(selected, candidate.locator) : false;
      report.push({
        role,
        strategy: candidate.strategy,
        matched: count > 0,
        count,
        selected: selectedMatch,
        confidence: candidate.confidence,
        ...(element ? { element } : {}),
      });
      void visible;
    }
  }

  private async selection<T extends { strategy: string; locator: Locator; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }>(
    locator: Locator,
    candidates: readonly T[],
  ): Promise<{ strategy: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; evidence?: ChatDiscoveryCandidate['element'] }> {
    for (const candidate of candidates) {
      if (await this.sameElement(locator, candidate.locator)) {
        return {
          strategy: candidate.strategy,
          confidence: candidate.confidence,
          evidence: await this.elementEvidence(locator),
        };
      }
    }
    return { strategy: 'runtime-locator', confidence: 'LOW', evidence: await this.elementEvidence(locator) };
  }

  private async elementEvidence(locator: Locator): Promise<ChatDiscoveryCandidate['element']> {
    return locator.evaluate((node) => ({
      tagName: node.tagName.toLowerCase(),
      role: node.getAttribute('role'),
      ariaLabel: node.getAttribute('aria-label'),
      placeholder: node.getAttribute('placeholder'),
      testId: node.getAttribute('data-testid'),
      text: (node.textContent ?? '').trim().slice(0, 160) || null,
    }));
  }

  private async sameElement(left: Locator, right: Locator): Promise<boolean> {
    const handle = await left.elementHandle();
    if (!handle) return false;
    return right.evaluateAll((nodes, selected) => nodes.some((node) => node === selected), handle);
  }

  private async findFirstVisible(candidates: Locator[]): Promise<Locator | null> {
    return this.findFirstVisibleExcluding(candidates, []);
  }

  private async findFirstVisibleExcluding(candidates: Locator[], excluded: Array<Locator | null>): Promise<Locator | null> {
    for (const candidate of candidates) {
      const count = await candidate.count();
      for (let index = 0; index < count; index += 1) {
        const item = candidate.nth(index);
        if (!await item.isVisible()) continue;
        if (await this.isExcluded(item, excluded)) continue;
        return item;
      }
    }
    return null;
  }

  private async isExcluded(candidate: Locator, excluded: Array<Locator | null>): Promise<boolean> {
    for (const locator of excluded) {
      if (!locator) continue;
      if (await this.sameElement(candidate, locator)) return true;
    }
    return false;
  }

  private toDefinition(locator: Locator): PlaywrightLocatorDefinition {
    return { kind: 'locator', value: locator };
  }
}

export class ChatDiscoveryError extends Error {
  public constructor(message: string, public readonly report: ChatDiscoveryReport) {
    super(message);
    this.name = 'ChatDiscoveryError';
  }
}
