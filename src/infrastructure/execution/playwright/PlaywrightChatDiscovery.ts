import type { Frame, Locator, Page } from '@playwright/test';
import type { PlaywrightConversationUiConfig, PlaywrightLocatorDefinition } from './PlaywrightConversationUi.js';
import type { ChatDiscoveryCandidate, ChatDiscoveryReport, ChatDiscoveryTraversalStep } from './ChatDiscoveryReport.js';

type ChatCandidateSpec = {
  readonly strategy: string;
  readonly locator: Locator;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
};

type SearchContext = {
  readonly name: string;
  readonly context: Page | Frame;
};

const MAX_TRAVERSAL_DEPTH = 2;
const MAX_TRAVERSAL_CLICKS = 6;
const TRANSITION_WAIT_MS = 500;

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
    const traversalPath: ChatDiscoveryTraversalStep[] = [];

    try {
      await this.dismissConsentBanners();
      const captcha = await this.findVisibleCaptchaGate();
      if (captcha) throw new Error(`CAPTCHA access gate detected (${captcha.strategy})`);

      let contexts = this.searchContexts();
      let composerSpecs = this.buildComposerCandidates(contexts);
      let composer = await this.findFirstVisible(composerSpecs.map((candidate) => candidate.locator));
      await this.recordCandidates(candidates, 'composer', composerSpecs, composer);

      if (!composer) {
        const launcherSpecs = this.buildLauncherCandidates(contexts);
        const launcher = await this.findFirstVisible(launcherSpecs.map((candidate) => candidate.locator));
        await this.recordCandidates(candidates, 'launcher', launcherSpecs, launcher);
        if (launcher) {
          selected.launcher = await this.selection(launcher, launcherSpecs);
          traversalPath.push({ depth: 0, strategy: selected.launcher.strategy, evidence: selected.launcher.evidence });
          await launcher.click({ timeout: 5_000 });
          await this.page.waitForTimeout(TRANSITION_WAIT_MS);

          contexts = this.searchContexts();
          const postOpenCaptcha = await this.findVisibleCaptchaGate();
          if (postOpenCaptcha) throw new Error(`CAPTCHA access gate detected (${postOpenCaptcha.strategy})`);

          composerSpecs = this.buildComposerCandidates(contexts);
          composer = await this.findFirstVisible(composerSpecs.map((candidate) => candidate.locator));
          await this.recordCandidates(candidates, 'composer', composerSpecs, composer);
        }
      }

      if (!composer) {
        const traversalResult = await this.traverseNestedWidgets(candidates, traversalPath, composerSpecs);
        composer = traversalResult.composer;
        composerSpecs = traversalResult.composerSpecs;
        contexts = traversalResult.contexts;
      }

      if (!composer) throw new Error('Chat composer could not be discovered on the public URL');
      selected.composer = await this.selection(composer, composerSpecs);

      const sendSpecs = this.buildSendCandidates(contexts);
      const sendButton = await this.findFirstVisible(sendSpecs.map((candidate) => candidate.locator));
      await this.recordCandidates(candidates, 'sendButton', sendSpecs, sendButton);
      if (sendButton) selected.sendButton = await this.selection(sendButton, sendSpecs);

      const responseSpecs = this.buildResponseCandidates(contexts);
      const responseResult = await this.findResponseLocator(responseSpecs, composer, sendButton);
      const response = responseResult.locator;
      await this.recordCandidates(candidates, 'response', responseSpecs, response, responseResult.deferred);
      if (!response) throw new Error('Chat response could not be discovered on the public URL');

      if (responseResult.deferred && responseResult.strategy) {
        selected.response = {
          strategy: responseResult.strategy,
          confidence: responseResult.confidence ?? 'LOW',
          deferred: true,
        };
      } else {
        selected.response = await this.selection(response, responseSpecs);
      }

      return {
        config: {
          composer: this.toDefinition(composer),
          response: this.toDefinition(response),
          ...(sendButton ? { sendButton: this.toDefinition(sendButton) } : {}),
        },
        report: this.buildReport('DISCOVERED', candidates, selected, traversalPath),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ChatDiscoveryError(message, this.buildReport('FAILED', candidates, selected, traversalPath, message));
    }
  }

  private async findResponseLocator(
    candidates: readonly ChatCandidateSpec[],
    composer: Locator,
    sendButton: Locator | null,
  ): Promise<{ readonly locator: Locator | null; readonly deferred: boolean; readonly strategy?: string; readonly confidence?: 'HIGH' | 'MEDIUM' | 'LOW' }> {
    const existing = await this.findFirstVisibleExcluding(
      candidates.map((candidate) => candidate.locator),
      [composer, sendButton],
    );
    if (existing) return { locator: existing, deferred: false };

    const deferredCandidates = candidates
      .filter((candidate) => this.isSupportedDeferredResponseStrategy(candidate.strategy))
      .map((candidate, index) => ({ candidate, index }));

    const ranked = deferredCandidates.sort((left, right) => {
      const priorityDifference = this.deferredResponsePriority(right.candidate.strategy) - this.deferredResponsePriority(left.candidate.strategy);
      return priorityDifference !== 0 ? priorityDifference : left.index - right.index;
    });

    for (const { candidate } of ranked) {
      if (await candidate.locator.count() === 0) {
        return {
          locator: candidate.locator,
          deferred: true,
          strategy: candidate.strategy,
          confidence: candidate.confidence,
        };
      }
    }

    return { locator: null, deferred: false };
  }

  private deferredResponsePriority(strategy: string): number {
    if (/\[aria-live=/.test(strategy)) return 400;
    if (/role=log/.test(strategy)) return 300;
    if (/\[data-testid\*=message\]/.test(strategy)) return 200;
    if (/\[class\*=response\]/.test(strategy)) return 100;
    return 0;
  }

  private isSupportedDeferredResponseStrategy(strategy: string): boolean {
    return /\[(data-testid|aria-live|class).*\]|role=log/.test(strategy);
  }

  private async traverseNestedWidgets(
    candidates: ChatDiscoveryCandidate[],
    traversalPath: ChatDiscoveryTraversalStep[],
    initialComposerSpecs: readonly ChatCandidateSpec[],
  ): Promise<{
    readonly composer: Locator | null;
    readonly composerSpecs: ChatCandidateSpec[];
    readonly contexts: SearchContext[];
  }> {
    let contexts = this.searchContexts();
    let composerSpecs = [...initialComposerSpecs];
    let composer = await this.findFirstVisible(composerSpecs.map((candidate) => candidate.locator));
    if (composer) return { composer, composerSpecs, contexts };

    const visited = new Set<string>();
    let clicks = 0;

    for (let depth = 1; depth <= MAX_TRAVERSAL_DEPTH && clicks < MAX_TRAVERSAL_CLICKS; depth += 1) {
      contexts = this.searchContexts();
      composerSpecs = this.buildComposerCandidates(contexts);
      composer = await this.findFirstVisible(composerSpecs.map((candidate) => candidate.locator));
      await this.recordCandidates(candidates, 'composer', composerSpecs, composer);
      if (composer) return { composer, composerSpecs, contexts };

      const traversalSpecs = this.buildNestedWidgetCandidates(contexts);
      let clickedAtDepth = false;

      for (const spec of traversalSpecs) {
        const count = await spec.locator.count();
        for (let index = 0; index < count && clicks < MAX_TRAVERSAL_CLICKS; index += 1) {
          const item = spec.locator.nth(index);
          if (!await item.isVisible()) continue;
          if (!await item.isEnabled().catch(() => false)) continue;

          const evidence = await this.elementEvidence(item).catch(() => null);
          if (!evidence) continue;
          const visitKey = `${spec.strategy}#${index}|${evidence.frameUrl}|${evidence.tagName}|${evidence.ariaLabel}|${evidence.testId}|${evidence.text}`;
          if (visited.has(visitKey)) continue;
          visited.add(visitKey);

          try {
            await item.click({ timeout: 3_000 });
          } catch {
            continue;
          }

          clicks += 1;
          clickedAtDepth = true;
          traversalPath.push({ depth, strategy: spec.strategy, evidence });
          await this.page.waitForTimeout(TRANSITION_WAIT_MS);

          const captcha = await this.findVisibleCaptchaGate();
          if (captcha) throw new Error(`CAPTCHA access gate detected (${captcha.strategy})`);

          contexts = this.searchContexts();
          composerSpecs = this.buildComposerCandidates(contexts);
          composer = await this.findFirstVisible(composerSpecs.map((candidate) => candidate.locator));
          await this.recordCandidates(candidates, 'composer', composerSpecs, composer);
          if (composer) return { composer, composerSpecs, contexts };
        }
      }

      if (!clickedAtDepth) break;
    }

    return { composer: null, composerSpecs, contexts };
  }

  private searchContexts(): SearchContext[] {
    const frames = this.page.frames().filter((frame) => frame !== this.page.mainFrame());
    return [
      { name: 'main', context: this.page },
      ...frames.map((frame, index) => ({
        name: `frame:${index + 1}:${frame.url() || 'unknown'}`,
        context: frame,
      })),
    ];
  }

  private async dismissConsentBanners(): Promise<void> {
    const contexts = this.searchContexts();
    const consentNames = /^(accept|accept all|allow|allow all|agree|got it|aceptar|aceptar todo|aceptar todas|permitir|permitir todas|de acuerdo|entendido)(\s+(cookies?|all|todas?|todo))?$/i;

    for (const { context } of contexts) {
      const consentCandidates = [
        context.getByRole('button', { name: consentNames }),
        context.locator('[aria-label*="accept" i], [aria-label*="cookie" i], [aria-label*="aceptar" i], [data-testid*="cookie" i] button'),
      ];
      for (const candidate of consentCandidates) {
        const visible = await this.findFirstVisible([candidate]);
        if (!visible) continue;
        try {
          await visible.click({ timeout: 2_000 });
          await this.page.waitForTimeout(250);
          return;
        } catch {
          // Ignore a consent control that becomes detached while the page updates.
        }
      }
    }
  }

  private async findVisibleCaptchaGate(): Promise<ChatCandidateSpec | null> {
    const contexts = this.searchContexts();
    for (const { name, context } of contexts) {
      const specs: ChatCandidateSpec[] = [
        { strategy: `${name}:iframe[src*=recaptcha]`, locator: context.locator('iframe[src*="recaptcha" i]'), confidence: 'HIGH' },
        { strategy: `${name}:iframe[title*=captcha]`, locator: context.locator('iframe[title*="captcha" i]'), confidence: 'HIGH' },
        { strategy: `${name}:[class*=g-recaptcha]`, locator: context.locator('[class*="g-recaptcha" i]'), confidence: 'HIGH' },
        { strategy: `${name}:[id*=captcha]`, locator: context.locator('[id*="captcha" i]'), confidence: 'HIGH' },
        { strategy: `${name}:[class*=captcha]`, locator: context.locator('[class*="captcha" i]'), confidence: 'MEDIUM' },
        { strategy: `${name}:[name*=captcha]`, locator: context.locator('[name*="captcha" i]'), confidence: 'MEDIUM' },
      ];
      for (const spec of specs) {
        const visible = await this.findFirstVisible([spec.locator]);
        if (visible) return { ...spec, locator: visible };
      }
    }
    return null;
  }

  private buildLauncherCandidates(contexts: readonly SearchContext[]): ChatCandidateSpec[] {
    const candidates: ChatCandidateSpec[] = [];
    for (const { name, context } of contexts) {
      candidates.push(
        { strategy: `${name}:role:button[name~chat|help|assistant|support|message]`, locator: context.getByRole('button', { name: /chat|help|assistant|support|message/i }), confidence: 'HIGH' },
        { strategy: `${name}:aria-label~chat|help|assistant|support|message`, locator: context.locator('[aria-label*="chat" i], [aria-label*="help" i], [aria-label*="assistant" i], [aria-label*="support" i], [aria-label*="message" i]'), confidence: 'MEDIUM' },
        { strategy: `${name}:title~chat|help|assistant|support|message`, locator: context.locator('[title*="chat" i], [title*="help" i], [title*="assistant" i], [title*="support" i], [title*="message" i]'), confidence: 'MEDIUM' },
        { strategy: `${name}:data-testid~chat|launcher|widget`, locator: context.locator('[data-testid*="chat" i], [data-testid*="launcher" i], [data-testid*="widget" i]'), confidence: 'MEDIUM' },
      );
    }
    return candidates;
  }

  private buildNestedWidgetCandidates(contexts: readonly SearchContext[]): ChatCandidateSpec[] {
    const candidates: ChatCandidateSpec[] = [];
    const intermediaryName = /contact|customer service|customer support|service|help|assistant|support|chat|message|atención|contacto|servicio|ayuda|asesor|asistente|mensaje/i;
    for (const { name, context } of contexts) {
      candidates.push(
        { strategy: `${name}:nested:role:button[name~contact|service|help|assistant|support|chat|message]`, locator: context.getByRole('button', { name: intermediaryName }), confidence: 'MEDIUM' },
        { strategy: `${name}:nested:[aria-haspopup]`, locator: context.locator('button[aria-haspopup], [role="button"][aria-haspopup]'), confidence: 'MEDIUM' },
        { strategy: `${name}:nested:[aria-expanded=false]`, locator: context.locator('button[aria-expanded="false"], [role="button"][aria-expanded="false"]'), confidence: 'LOW' },
        { strategy: `${name}:nested:aria-label~contact|service|help|assistant|support|chat|message`, locator: context.locator('[aria-label*="contact" i], [aria-label*="service" i], [aria-label*="help" i], [aria-label*="assistant" i], [aria-label*="support" i], [aria-label*="chat" i], [aria-label*="message" i]'), confidence: 'MEDIUM' },
        { strategy: `${name}:nested:title~contact|service|help|assistant|support|chat|message`, locator: context.locator('[title*="contact" i], [title*="service" i], [title*="help" i], [title*="assistant" i], [title*="support" i], [title*="chat" i], [title*="message" i]'), confidence: 'LOW' },
        { strategy: `${name}:nested:data-testid~contact|service|help|assistant|support|chat|message|widget`, locator: context.locator('[data-testid*="contact" i], [data-testid*="service" i], [data-testid*="help" i], [data-testid*="assistant" i], [data-testid*="support" i], [data-testid*="chat" i], [data-testid*="message" i], [data-testid*="widget" i]'), confidence: 'LOW' },
      );
    }
    return candidates;
  }

  private buildComposerCandidates(contexts: readonly SearchContext[]): ChatCandidateSpec[] {
    const candidates: ChatCandidateSpec[] = [];
    for (const { name, context } of contexts) {
      candidates.push(
        { strategy: `${name}:role:textbox[name~message|mensaje|chat|escribe|type]`, locator: context.getByRole('textbox', { name: /message|mensaje|chat|escribe|type/i }), confidence: 'HIGH' },
        { strategy: `${name}:placeholder~message|mensaje|chat|escribe|type`, locator: context.getByPlaceholder(/message|mensaje|chat|escribe|type/i), confidence: 'HIGH' },
        { strategy: `${name}:textarea`, locator: context.locator('textarea'), confidence: 'MEDIUM' },
        { strategy: `${name}:input[type=text]`, locator: context.locator('input[type="text"]'), confidence: 'LOW' },
        { strategy: `${name}:[contenteditable=true]`, locator: context.locator('[contenteditable="true"]'), confidence: 'MEDIUM' },
      );
    }
    return candidates;
  }

  private buildSendCandidates(contexts: readonly SearchContext[]): ChatCandidateSpec[] {
    const candidates: ChatCandidateSpec[] = [];
    for (const { name, context } of contexts) {
      candidates.push(
        { strategy: `${name}:role:button[name~send|enviar|submit|mandar]`, locator: context.getByRole('button', { name: /send|enviar|submit|mandar/i }), confidence: 'HIGH' },
        { strategy: `${name}:button[aria-label*=send]`, locator: context.locator('button[aria-label*="send" i]'), confidence: 'HIGH' },
        { strategy: `${name}:button[title*=send]`, locator: context.locator('button[title*="send" i]'), confidence: 'MEDIUM' },
        { strategy: `${name}:button[aria-label*=enviar]`, locator: context.locator('button[aria-label*="enviar" i]'), confidence: 'HIGH' },
        { strategy: `${name}:button[title*=enviar]`, locator: context.locator('button[title*="enviar" i]'), confidence: 'MEDIUM' },
      );
    }
    return candidates;
  }

  private buildResponseCandidates(contexts: readonly SearchContext[]): ChatCandidateSpec[] {
    const candidates: ChatCandidateSpec[] = [];
    for (const { name, context } of contexts) {
      candidates.push(
        { strategy: `${name}:[data-testid*=message]`, locator: context.locator('[data-testid*="message" i]'), confidence: 'HIGH' },
        { strategy: `${name}:[aria-live=polite]`, locator: context.locator('[aria-live="polite"]'), confidence: 'HIGH' },
        { strategy: `${name}:[aria-live=assertive]`, locator: context.locator('[aria-live="assertive"]'), confidence: 'HIGH' },
        { strategy: `${name}:role=log`, locator: context.getByRole('log'), confidence: 'HIGH' },
        { strategy: `${name}:[class*=response]`, locator: context.locator('[class*="response" i]'), confidence: 'MEDIUM' },
        { strategy: `${name}:[class*=message]`, locator: context.locator('[class*="message" i]'), confidence: 'LOW' },
      );
    }
    return candidates;
  }

  private buildReport(
    status: ChatDiscoveryReport['status'],
    candidates: readonly ChatDiscoveryCandidate[],
    selected: ChatDiscoveryReport['selected'],
    traversalPath: readonly ChatDiscoveryTraversalStep[],
    error?: string,
  ): ChatDiscoveryReport {
    return {
      schemaVersion: 'chat-discovery-0.1',
      targetUrl: this.page.url(),
      status,
      discoveredAt: new Date().toISOString(),
      candidates,
      selected,
      ...(traversalPath.length > 0 ? { traversalPath } : {}),
      ...(error ? { error } : {}),
    };
  }

  private async recordCandidates(
    report: ChatDiscoveryCandidate[],
    role: ChatDiscoveryCandidate['role'],
    candidates: readonly ChatCandidateSpec[],
    selected: Locator | null,
    deferred = false,
  ): Promise<void> {
    for (const candidate of candidates) {
      const count = await candidate.locator.count();
      let element: ChatDiscoveryCandidate['element'];
      if (count > 0) {
        for (let index = 0; index < count; index += 1) {
          const item = candidate.locator.nth(index);
          if (await item.isVisible()) {
            element = await this.elementEvidence(item);
            break;
          }
        }
      }
      const selectedMatch = selected
        ? count > 0
          ? await this.sameElement(selected, candidate.locator)
          : deferred && selected === candidate.locator
        : false;
      report.push({
        role,
        strategy: candidate.strategy,
        matched: count > 0,
        count,
        selected: selectedMatch,
        ...(deferred && selectedMatch ? { deferred: true } : {}),
        confidence: candidate.confidence,
        ...(element ? { element } : {}),
      });
    }
  }

  private async selection(
    locator: Locator,
    candidates: readonly ChatCandidateSpec[],
    deferred = false,
  ): Promise<{ strategy: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; deferred?: boolean; evidence?: ChatDiscoveryCandidate['element'] }> {
    for (const candidate of candidates) {
      if (deferred && locator === candidate.locator) {
        return {
          strategy: candidate.strategy,
          confidence: candidate.confidence,
          deferred: true,
        };
      }
      if (await this.sameElement(locator, candidate.locator)) {
        return {
          strategy: candidate.strategy,
          confidence: candidate.confidence,
          ...(deferred ? { deferred: true } : {}),
          evidence: deferred ? undefined : await this.elementEvidence(locator),
        };
      }
    }
    return {
      strategy: 'runtime-locator',
      confidence: 'LOW',
      ...(deferred ? { deferred: true } : {}),
      ...(deferred ? {} : { evidence: await this.elementEvidence(locator) }),
    };
  }

  private async elementEvidence(locator: Locator): Promise<ChatDiscoveryCandidate['element']> {
    return locator.evaluate((node) => ({
      tagName: node.tagName.toLowerCase(),
      role: node.getAttribute('role'),
      ariaLabel: node.getAttribute('aria-label'),
      placeholder: node.getAttribute('placeholder'),
      testId: node.getAttribute('data-testid'),
      text: (node.textContent ?? '').trim().slice(0, 160) || null,
      frameUrl: window.location.href,
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
