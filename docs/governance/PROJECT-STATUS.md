# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incrementos cerrados — F2-23 a F2-34

F2-23 a F2-34 permanecen **CERRADOS / VALIDADOS** según la evidencia CI y Architecture Spike registrada en este documento.

## Incremento cerrado — F2-32 contrato de agregación de decisiones

**Estado:** **CERRADO / VALIDADO**.

F2-32 define la combinación de decisiones individuales de múltiples criterios sin introducir scoring, ponderaciones ni porcentajes.

`EvaluationDecisionAggregationResult` conserva el resultado agregado, el número de criterios, la distribución de `ACCEPTED`, `REJECTED` y `UNDECIDED`, los identificadores de criterios incluidos, la precedencia aplicada y una `basis` explicativa.

La precedencia metodológica es explícita y conservadora: `REJECTED > UNDECIDED > ACCEPTED`. La agregación rechaza listas vacías y criterios duplicados.

La especificación está documentada en `docs/evaluation/F2-32-DECISION-AGGREGATION.md`.

La evidencia CI `34116193123` y Architecture Spike `34116193050` resultó exitosa en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

## Incremento cerrado — F2-33 vinculación de agregación con EvaluationPlan

**Estado:** **CERRADO / VALIDADO**.

F2-33 garantiza que la agregación de decisiones solo pueda consumir exactamente los criterios autorizados por `EvaluationPlan`.

Cuando existe `selectionContext`, el conjunto autorizado es `selectedCriterionIds`. Sin `selectionContext`, el conjunto autorizado corresponde a `EvaluationPlan.items`. La operación exige correspondencia exacta: no puede faltar una decisión seleccionada ni puede incorporarse una decisión de un criterio externo.

La agregación subyacente conserva la precedencia definida en F2-32 y sus invariantes de unicidad y trazabilidad.

La especificación está documentada en `docs/evaluation/F2-33-EVALUATION-PLAN-AGGREGATION-BINDING.md`.

La validación final de F2-33 quedó cerrada con CI `34120248920` y Architecture Spike `34120248891`, ambos exitosos en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

F2-33 no introduce scoring, ponderaciones, porcentajes globales, agregación entre ejecuciones/escenarios, reglas de parada, significancia estadística ni aceptación global del producto.

## Incremento cerrado — F2-34 aplicabilidad y agregación de decisiones

**Estado:** **CERRADO / VALIDADO**.

F2-34 formaliza la relación entre `EvaluationPlan.applicability` y la agregación de decisiones. Los criterios `APPLICABLE` reciben decisiones y participan en la agregación; los criterios `NOT_APPLICABLE` permanecen trazables en el plan pero quedan fuera de la agregación.

`NOT_APPLICABLE` no se transforma en `REJECTED`, `UNDECIDED` ni `ACCEPTED`. Cuando todos los criterios seleccionados son `NOT_APPLICABLE`, el resultado agregado es `null`, preservando la diferencia entre no aplicabilidad y aceptación.

La implementación está en `AggregateApplicableEvaluationPlanDecisions` y la especificación en `docs/evaluation/F2-34-APPLICABILITY-AGGREGATION.md`.

La validación final de F2-34 quedó cerrada con CI `34121440528` y Architecture Spike `34121440585`, ambos exitosos en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

F2-34 no introduce scoring, ponderaciones, porcentajes, compensación entre criterios, criterios críticos, reglas de parada, agregación entre ejecuciones/escenarios ni inferencia automática de aplicabilidad.

## Incremento actual — F2-35 cobertura metodológica

**Estado:** **IMPLEMENTADO; pendiente de validación CI**.

F2-35 formaliza la cobertura descriptiva de los criterios seleccionados para una ejecución. La cobertura distingue `APPLICABLE_EVALUATED`, `APPLICABLE_NOT_EVALUATED`, `NOT_APPLICABLE`, `INSUFFICIENT_EVIDENCE` e `INCONCLUSIVE`.

`NOT_APPLICABLE` permanece fuera de la evaluación; `APPLICABLE_NOT_EVALUATED` representa una omisión de evaluación; `INSUFFICIENT_EVIDENCE` representa `NOT_EVALUABLE`; e `INCONCLUSIVE` conserva la semántica inconclusa de la evaluación. La cobertura no inventa decisiones ni porcentajes.

La implementación está en `EvaluationCoverage` y `BuildEvaluationCoverage`, con pruebas unitarias y Architecture Spike específicas.

F2-35 no introduce porcentajes de cobertura, score, ponderaciones, aceptación/rechazo global, compensación entre criterios, criterios críticos, reglas de parada, agregación entre ejecuciones/escenarios ni inferencia automática de aplicabilidad.

## Persistencia y versionado

Las referencias de versionado continúan persistidas como campos de primera clase. El plan metodológico se conserva en `evaluation_plan` y las condiciones comparables mediante `condition_fingerprint`. La reconstrucción de `Execution` mantiene ambos metadatos.

El valor `legacy-unknown` se utiliza únicamente para información histórica realmente ausente; no completa silenciosamente nuevas ejecuciones.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

## Frente 2 — Evaluación observable
**Estado:** F2-34 cerrado/validado; F2-35 implementado y en validación.

La secuencia actual es: delimitación de núcleo → selección contextual → vinculación con ejecución → repetición/variabilidad → estadística descriptiva → interpretación → juicio metodológico → decisión explícita mediante regla versionada → agregación de decisiones → vinculación de la agregación con el conjunto de criterios seleccionado → separación de criterios `APPLICABLE` y `NOT_APPLICABLE` en la agregación → cobertura metodológica por criterio.

Todavía quedan fuera scoring, ponderaciones, criterios críticos definitivos, reglas de parada, agregación entre ejecuciones/escenarios y método productivo de evaluación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions continúa validada mediante el spike ejecutable.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto y deben mantenerse reconstruibles junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Validar F2-35 en CI. Con la baseline verde, el siguiente paso será formalizar la interpretación de cobertura por ejecución, manteniendo separadas la cobertura descriptiva, la decisión explícita y el scoring global.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
