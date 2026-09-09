# Adaptive discovery benchmark

## Objective

Run the existing heuristic discovery (`LEGACY`) and the new evidence-driven discovery (`ADAPTIVE`) against the same public SUT corpus without disabling or replacing the existing model.

The benchmark measures whether adaptive discovery improves discovery and verified-conversation rates while preserving the existing model as a control.

## Experimental design

For every target:

1. Reset the browser/session to the same initial state.
2. Run LEGACY discovery.
3. Record candidate count, selected launcher, composer/send/response outcome, errors and duration.
4. Reset again.
5. Run ADAPTIVE discovery.
6. Record the same measurements plus experiment count, DOM-diff signals and evidence score.
7. Classify the final outcome using the same functional verification contract.

The models must not share the selected locator from the other model during the experiment.

## Primary metrics

- **Discovery rate** = targets where a chat surface is identified / total targets.
- **Verification rate** = targets with a verified SEND → RECEIVE conversation / total targets.
- **False-positive rate** = selected launcher candidates that fail functional validation / selected launcher candidates.
- **Candidate efficiency** = experiments performed before the first high-confidence chat candidate.
- **Coverage delta** = adaptive discovery rate minus legacy discovery rate.
- **Verification delta** = adaptive verification rate minus legacy verification rate.

## Precision definition

For launcher discovery, precision is:

`true-positive launcher selections / all launcher selections presented as high-confidence`

A selection is a true positive only when the downstream functional probe establishes that it opens the intended conversation surface. Mere DOM similarity is not sufficient.

## Initial success criteria

This phase is exploratory. No threshold is treated as a product guarantee until the corpus has enough observations. The first useful baseline should contain at least 20 targets and include positive, negative and ambiguous widget patterns.

The adaptive model is considered promising when it improves verified-conversation coverage without materially increasing false positives or unsafe interaction attempts.

## Safety constraints

- Never activate destructive, purchase, logout, delete or irreversible controls during discovery.
- Bound the number of exploratory interactions per page.
- Preserve the existing legacy path unchanged.
- Store evidence for every adaptive experiment so failures are diagnosable and reproducible.
