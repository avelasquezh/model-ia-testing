# Public URL SUT browser execution

Status: IMPLEMENTED — EXECUTABLE CONTRACT

## Purpose

The browser execution layer treats the system under test (SUT) as a public HTTP(S) URL supplied at execution time. The URL is not tied to a chatbot vendor, channel, SDK, provider or DOM implementation.

The operational flow is:

`public URL → Playwright opens page → configured chat locators → sends scenario inputs → waits for observable response → captures screenshot/evidence → emits BotObservationSet`

The controlled local chatbot used by the browser spikes remains a deterministic test fixture. It is not the production SUT contract.

## Configuration

Copy `examples/browser-sut-config.example.json` and replace the target URL and UI locators with the real public chat page.

The configuration contains:

- `target.url`: the public HTTP(S) URL to open.
- `scenario.inputs`: messages to send, in order.
- `scenario.expectedBehavior`: the observable behavior expected from the browser execution.
- `expectedIntent`: the explicit semantic intent that will be evaluated later.
- `expectedIntentVersion`: version of the semantic intent definition.
- `repetition`: repetition identity for the captured execution; repeated bot executions must produce separate observation sets.
- `ui.composer`: locator for the chat input.
- `ui.sendButton`: optional locator for the send action.
- `ui.response`: locator for the observable bot response.
- `ui.responseTimeoutMs`: maximum wait for a response.
- `ui.pollIntervalMs`: polling interval when waiting for an observable response.

Supported locator kinds are `role`, `label`, `placeholder`, `testId` and `css`.

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

## Boundary rules

The browser runner must not contain provider-specific logic. A real URL may expose a web chat backed by any channel or provider; only the observable browser interface is relevant to this layer.

Authentication state, cookies and other secrets are execution concerns and must not be committed to the repository. A public URL is the required baseline for this MVP contract.

This capability prepares F2-VAL-05. It does not by itself validate F2-VAL-05. Validation requires a reproducible execution against the real SUT and an external semantic evaluator, with the resulting observations and evidence preserved.
