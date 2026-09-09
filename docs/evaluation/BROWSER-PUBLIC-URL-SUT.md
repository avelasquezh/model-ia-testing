# Public URL SUT browser execution

Status: IMPLEMENTED — EXECUTABLE CONTRACT

## Purpose

The browser execution layer treats the system under test (SUT) as a public HTTP(S) URL supplied at execution time. The URL is not tied to a chatbot vendor, channel, SDK, provider or DOM implementation.

The operational flow is:

`public URL → Playwright opens page → consent/pre-chat gates → launcher/nested-widget discovery → composer discovery → send control discovery → response discovery → sends scenario inputs → waits for observable response → captures screenshot/evidence → emits BotObservationSet`

The controlled local chatbot used by the browser spikes remains a deterministic test fixture. It is not the production SUT contract.

## Locator discovery

UI configuration is optional. When `ui` is omitted from the browser SUT configuration, `PlaywrightConversationAdapter` invokes `PlaywrightChatDiscovery` after opening the public URL.

Automatic discovery is provider-neutral and staged:

1. Search the main document and currently loaded iframes for a chat launcher using accessible names, aria-label/title and common test-id signals.
2. When no composer is already visible, click a bounded set of plausible launcher/intermediary controls and refresh the search contexts after each successful interaction.
3. Search the main document, loaded iframes and accessible open Shadow DOM for a message composer using accessible textbox/placeholder, textarea, text input and contenteditable elements.
4. Search for a send action using accessible button names and send/enviar aria-label or title attributes.
5. Search for an observable response area using message test ids, live regions, role `log`, response/message class names and the same frame contexts used by the selected composer.

Nested widgets are handled as a bounded traversal rather than a blind DOM crawl. The implementation currently caps traversal at two levels and six successful exploratory clicks, avoids reusing the same candidate identity, requires visible/enabled controls, and records every successful parent interaction in `traversalPath`. This evidence makes the path from outer widget to discovered chat inspectable.

Playwright locators can operate through open Shadow DOM and loaded iframe contexts. Closed Shadow DOM remains outside the supported discovery boundary. Elements that are merely hidden and not mounted/interactable cannot be discovered by DOM inspection alone; the traversal step exists for widgets that reveal or mount their child chat after a legitimate UI interaction.

Discovered controls are returned as live Playwright locators, so a control found inside an iframe remains bound to that frame for the current execution. Evidence records include the originating frame URL when available.

The discovery result is used directly by the Playwright conversation layer and is not committed as a provider-specific selector. If a required element cannot be discovered, execution fails explicitly instead of guessing.

This remains heuristic discovery, not a claim that every arbitrary chat can be automated. The next validation increment is to exercise nested-widget candidates from the public corpus and compare traversal-path evidence against actual page behavior.

## Configuration

Copy `examples/browser-sut-config.example.json` and replace the target URL. For automatic discovery, omit `ui` entirely. Explicit locators remain supported when deterministic configuration is preferred.

The configuration contains:

- `target.url`: the public HTTP(S) URL to open.
- `scenario.inputs`: messages to send, in order.
- `scenario.expectedBehavior`: the observable behavior expected from the browser execution.
- `expectedIntent`: the explicit semantic intent that will be evaluated later.
- `expectedIntentVersion`: version of the semantic intent definition.
- `repetition`: repetition identity for the captured execution; repeated bot executions must produce separate observation sets.
- `ui`: optional explicit browser UI locators. When absent, automatic discovery is used.
- `ui.composer`: locator for the chat input.
- `ui.sendButton`: optional locator for the send action.
- `ui.response`: locator for the observable bot response.
- `ui.responseTimeoutMs`: maximum wait for a response.
- `ui.pollIntervalMs`: polling interval when waiting for an observable response.

Supported explicit locator kinds are `role`, `label`, `placeholder`, `testId` and `css`.

The semantic intent is deliberately separate from `scenario.expectedBehavior`. The former is the criterion input for semantic evaluation; the latter describes the browser-level observable behavior required to complete the interaction.

## Execution

Set the configuration path and run:

```bash
BROWSER_SUT_CONFIG_FILE=examples/browser-sut-config.example.json npm run browser:sut
```

Optional environment variables:

```text
BROWSER_SUT_OUTPUT_FILE
BROWSER_SUT_DISCOVERY_REPORT_FILE
BROWSER_SUT_EVIDENCE_DIRECTORY
BROWSER_SUT_TIMEOUT_MS
```

The runner writes a `BotObservationSet` with schema version `bot-observation-0.1`. Discovery evidence, screenshots and turn metadata are written under the evidence directory.

## External corpus

The maintained public discovery corpus contains 23 public candidates, including `https://www.olimpica.com/` specifically to exercise nested-widget, iframe and open-Shadow-DOM discovery behavior.

The corpus workflow is intentionally provider-neutral and preserves `DISCOVERED`/`FAILED` reports plus locator and traversal evidence for subsequent heuristic improvements. External pages can change without notice, so a site failure is not automatically interpreted as an infrastructure failure.

## Controlled discovery coverage

`spike/browser/chat-discovery-launcher-frame.spec.ts` validates the generic discovery path against a controlled page where the chat launcher dynamically injects an iframe. Unit coverage also validates a parent widget that reveals a nested chat and a parent widget that reveals chat controls inside an open Shadow DOM.

## Boundary rules

The browser runner must not contain provider-specific logic. A real URL may expose a web chat backed by any channel or provider; only the observable browser interface is relevant to this layer.

Authentication state, cookies and other secrets are execution concerns and must not be committed to the repository. A public URL is the required baseline for this MVP contract.

CAPTCHA is an access gate, not a locator problem. The runner may detect and report a visible CAPTCHA but must not solve, bypass, disable or evade it.

This capability prepares F2-VAL-05. It does not by itself validate F2-VAL-05. Validation requires a reproducible execution against the real SUT and an external semantic evaluator, with the resulting observations and evidence preserved.
