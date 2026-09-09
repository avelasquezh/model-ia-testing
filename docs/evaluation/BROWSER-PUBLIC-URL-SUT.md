# Public URL SUT browser execution

Status: IMPLEMENTED — EXECUTABLE CONTRACT

## Purpose

The browser execution layer treats the system under test (SUT) as a public HTTP(S) URL supplied at execution time. The URL is not tied to a chatbot vendor, channel, SDK, provider or DOM implementation.

The operational flow is:

`public URL → Playwright opens page → launcher discovery/opening → composer discovery → send control discovery → response discovery → sends scenario inputs → waits for observable response → captures screenshot/evidence → emits BotObservationSet`

The controlled local chatbot used by the browser spikes remains a deterministic test fixture. It is not the production SUT contract.

## Locator discovery

UI configuration is optional. When `ui` is omitted from the browser SUT configuration, `PlaywrightConversationAdapter` invokes `PlaywrightChatDiscovery` after opening the public URL.

Automatic discovery is provider-neutral and staged:

1. Search the main document and currently loaded iframes for a chat launcher using accessible names, aria-label/title and common test-id signals.
2. When no composer is already visible, click the first visible launcher candidate and refresh the search contexts.
3. Search the main document and loaded iframes for a message composer using accessible textbox/placeholder, textarea, text input and contenteditable elements.
4. Search for a send action using accessible button names and send/enviar aria-label or title attributes.
5. Search for an observable response area using message test ids, live regions, role `log`, response/message class names and the same frame contexts used by the selected composer.

Discovered controls are returned as live Playwright locators, so a control found inside an iframe remains bound to that frame for the current execution. Evidence records include the originating frame URL when available.

The discovery result is used directly by the Playwright conversation layer and is not committed as a provider-specific selector. If a required element cannot be discovered, execution fails explicitly instead of guessing.

This remains heuristic discovery, not a claim that every arbitrary chat can be automated. Future increments should strengthen candidate scoring, shadow-DOM traversal and post-send response verification based on external evidence.

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

The current discovery corpus contains four public candidates:

- ChatBot sample page: `https://www.chatbot.com/help/chat-widget/sample-page/`
- CandorDesk demo: `https://candordesk.com/demo`
- SiteMind demo: `https://www.sitemind.tech/demo`
- QueryWing demo: `https://querywing.com/demo`

The corpus workflow is intentionally provider-neutral and preserves `DISCOVERED`/`FAILED` reports plus locator evidence for subsequent heuristic improvements. External pages can change without notice, so a site failure is not automatically interpreted as an infrastructure failure.

## Controlled discovery coverage

`spike/browser/chat-discovery-launcher-frame.spec.ts` validates the generic discovery path against a controlled page where the chat launcher dynamically injects an iframe. The test verifies that the launcher is detected and opened and that composer, send and response locators are subsequently discovered inside the iframe.

## Boundary rules

The browser runner must not contain provider-specific logic. A real URL may expose a web chat backed by any channel or provider; only the observable browser interface is relevant to this layer.

Authentication state, cookies and other secrets are execution concerns and must not be committed to the repository. A public URL is the required baseline for this MVP contract.

This capability prepares F2-VAL-05. It does not by itself validate F2-VAL-05. Validation requires a reproducible execution against the real SUT and an external semantic evaluator, with the resulting observations and evidence preserved.
