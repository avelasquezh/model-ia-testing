# Public URL SUT browser execution

Status: IMPLEMENTED — EXECUTABLE CONTRACT

## Purpose

The browser execution layer treats the system under test (SUT) as a public HTTP(S) URL supplied at execution time. The URL is not tied to a chatbot vendor, channel, SDK, provider or DOM implementation.

The operational flow is:

`public URL → Playwright opens page → chat interface discovery or configured locators → sends scenario inputs → waits for observable response → captures screenshot/evidence → emits BotObservationSet`

The controlled local chatbot used by the browser spikes remains a deterministic test fixture. It is not the production SUT contract.

## Locator discovery

UI configuration is now optional. When `ui` is omitted from the browser SUT configuration, `PlaywrightConversationAdapter` invokes `PlaywrightChatDiscovery` after opening the public URL.

Automatic discovery currently searches provider-neutral browser signals for:

- message composer: accessible textbox/placeholder, textarea, text input and contenteditable elements;
- send action: accessible button names and send/enviar aria-label or title attributes;
- response area: message test ids, live regions, role `log`, response/message class names.

The discovery result is used directly by the Playwright conversation layer and is not committed as a provider-specific selector. If a required element cannot be discovered, execution fails explicitly instead of guessing.

This is heuristic discovery, not a claim that every arbitrary chat can be automated. Future increments may add iframe traversal, launcher detection, candidate scoring and post-send response verification.

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
BROWSER_SUT_EVIDENCE_DIRECTORY
BROWSER_SUT_TIMEOUT_MS
```

The runner writes a `BotObservationSet` with schema version `bot-observation-0.1`. Screenshots and turn metadata are written under the evidence directory.

## Controlled live candidate

For the first external discovery experiment, the project will use the public CandorDesk demo page:

`https://candordesk.com/demo`

The page presents an inline live assistant with a visible composer and send control, making it a useful provider-neutral discovery candidate. The page itself states that the assistant is a live sample workspace and that messages are sent to the demo workspace. Do not submit private or sensitive information.

This URL is an external test candidate, not evidence of F2-VAL-05 validation. A live run must still produce reproducible observations and the required external semantic evaluator evidence.

## Boundary rules

The browser runner must not contain provider-specific logic. A real URL may expose a web chat backed by any channel or provider; only the observable browser interface is relevant to this layer.

Authentication state, cookies and other secrets are execution concerns and must not be committed to the repository. A public URL is the required baseline for this MVP contract.

This capability prepares F2-VAL-05. It does not by itself validate F2-VAL-05. Validation requires a reproducible execution against the real SUT and an external semantic evaluator, with the resulting observations and evidence preserved.
