# F2-38 — Comparabilidad metodológica entre ejecuciones

**Estado:** EN VALIDACIÓN

## Propósito

F2-38 formaliza la comparabilidad como una precondición metodológica explícita antes de comparar métricas de cobertura entre ejecuciones.

La comparabilidad no expresa calidad, aceptación, rechazo ni variabilidad del modelo. Determina únicamente si dos ejecuciones conservan suficiente contexto común para que una comparación posterior sea metodológicamente interpretable.

## Cadena metodológica

`EvaluationSelectionContext → EvaluationPlan → EvaluationCoverage → EvaluationCoverageInterpretation → EvaluationCoverageMetrics → EvaluationComparability → comparación descriptiva futura (F2-39)`

## Condiciones exigidas

Dos ejecuciones son `COMPARABLE` cuando coinciden:

- identidad y versión del escenario;
- versión del método de evaluación;
- versión del catálogo de criterios;
- versión de las reglas de decisión;
- fingerprint de condiciones;
- contexto y alcance del `EvaluationPlan`;
- conjunto de criterios seleccionados;
- aplicabilidad de los criterios seleccionados.

La identidad de producto bajo prueba (`productVersion`, y por extensión el target concreto) no bloquea por sí sola la comparabilidad. Se conserva como dimensión explícita para permitir que F2-39 compare resultados entre versiones del producto bajo evaluación sin confundir esa diferencia con un cambio de condiciones metodológicas.

## Estados

`COMPARABLE` significa que no se detectó ninguna diferencia metodológicamente bloqueante ni falta de evidencia requerida.

`NON_COMPARABLE` significa que existe evidencia suficiente para identificar una incompatibilidad real, por ejemplo un escenario, versión de escenario, método, catálogo, reglas, condiciones, contexto, alcance, selección o aplicabilidad diferentes.

`INSUFFICIENT_EVIDENCE` significa que la comparación no puede determinarse porque falta evidencia necesaria, por ejemplo un `EvaluationPlan`, un `conditionFingerprint` o contexto metodológico reconstruible por existir `legacy-unknown`.

La ausencia de condiciones no se interpreta como variabilidad del sistema.

## Razones auditables

`EvaluationComparability` conserva las razones deterministas de incompatibilidad o insuficiencia: `SCENARIO_ID_MISMATCH`, `SCENARIO_VERSION_MISMATCH`, `EVALUATION_METHOD_VERSION_MISMATCH`, `CRITERION_CATALOG_VERSION_MISMATCH`, `DECISION_RULES_VERSION_MISMATCH`, `EVALUATION_CONTEXT_MISMATCH`, `EVALUATION_SCOPE_MISMATCH`, `SELECTED_CRITERIA_MISMATCH`, `APPLICABILITY_MISMATCH`, `CONDITION_FINGERPRINT_MISMATCH`, `MISSING_EVALUATION_PLAN`, `MISSING_CONDITION_FINGERPRINT` y `LEGACY_VERSION_CONTEXT`.

## Invariantes

Una comparación requiere dos ejecuciones distintas.

`COMPARABLE` no admite razones de incompatibilidad.

`NON_COMPARABLE` requiere al menos una incompatibilidad real y no puede utilizar una mera falta de evidencia como causa.

`INSUFFICIENT_EVIDENCE` exige una causa explícita de evidencia insuficiente.

La comparación valida además que cada `EvaluationPlan` pertenezca a su ejecución y que su selección conserve la identidad y versión del escenario.

## Límites metodológicos

F2-38 no calcula diferencias de métricas, no determina mejora o regresión, no agrega ejecuciones, no aplica thresholds, no genera score, no aplica pesos, no realiza inferencia estadística y no concluye aceptación o rechazo.

La comparación descriptiva queda reservada para F2-39 una vez demostrada esta precondición.

## Implementación y validación

Implementación:

- `src/domain/evaluation/EvaluationComparability.ts`
- `src/application/evaluation/AssessEvaluationComparability.ts`
- `src/application/evaluation/AssessEvaluationComparability.test.ts`
- `src/domain/evaluation/EvaluationComparability.test.ts`
- `spike/evaluation/comparability-validation.test.ts`

La evidencia CI y Architecture Spike se añadirá al cierre de F2-38 después de la validación completa.
