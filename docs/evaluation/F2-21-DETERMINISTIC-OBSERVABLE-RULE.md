# F2-21 — Primera regla determinista sobre evidencia observable

## Objetivo

Conectar la ejecución tangible de F2-19 con la evaluación ejecutable de F2-20 mediante una primera regla determinista que produzca PASS o FAIL a partir de evidencia observable real de la conversación.

## Flujo implementado

`PlaywrightExecutionRunner → ExecutionObservation → EvaluationEvidence → EvaluationPlan → ExactExpectedResponseRule → CriterionEvaluation`

La regla utilizada es `ExactExpectedResponseRule` y su versión es explícita (`rule-exact-response-v1`). La regla no inspecciona el modelo interno ni intenta inferir la intención del chatbot.

## Evidencia

Para el incremento se materializan dos unidades de evidencia asociadas al mismo executionId:

- `TRANSCRIPT`: contiene la entrada enviada y la respuesta observable capturada por Playwright.
- `SCREENSHOT`: referencia la captura obtenida durante la observación.

La evaluación requiere ambos tipos porque el criterio D1-C01 declara esa suficiencia de evidencia.

## Regla determinista

La regla localiza la evidencia `TRANSCRIPT`, extrae la respuesta observable y la compara con la respuesta esperada mediante `ResponseMatchesExpected`.

- Coincidencia exacta después de `trim()` → `PASS`.
- Diferencia observable → `FAIL`.
- Transcript ausente, inválido o sin respuesta textual → `INCONCLUSIVE`.

La versión de la regla debe coincidir con `Criterion.ruleVersion`. Una discrepancia de versión no produce un resultado de calidad; el evaluador la trata como `NOT_EVALUABLE`.

## Resultado demostrable

El spike F2-21 ejecuta realmente el chatbot controlado con Playwright, captura su respuesta y screenshot, crea el plan aplicable para D1-C01 y produce una `CriterionEvaluation` con:

- `status = PASS`
- `criterionId = D1-C01`
- `executionId = execution-f2-21-001`
- `evidenceId` apuntando a la evidencia TRANSCRIPT
- `rule` igual a `rule-exact-response-v1`

## Alcance

Este incremento no implementa puntuación global, agregación por dimensión, evaluación semántica mediante IA, persistencia PostgreSQL ni evaluación de un chatbot comercial externo. El objetivo es demostrar el primer ciclo completo de evidencia observable → regla determinista → PASS/FAIL.

## Regresión

Se mantienen las pruebas unitarias existentes y se agrega cobertura específica de la regla y un E2E que conecta la observación real de Playwright con la evaluación.
