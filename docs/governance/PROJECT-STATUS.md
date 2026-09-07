# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incrementos cerrados — F2-23 a F2-31

F2-23 a F2-31 permanecen **CERRADOS / VALIDADOS** según la evidencia CI y Architecture Spike registrada en este documento.

## Incremento cerrado — F2-32 contrato de agregación de decisiones

**Estado:** **CERRADO / VALIDADO**.

F2-32 define la combinación de decisiones individuales de múltiples criterios sin introducir scoring, ponderaciones ni porcentajes.

`EvaluationDecisionAggregationResult` conserva el resultado agregado, el número de criterios, la distribución de `ACCEPTED`, `REJECTED` y `UNDECIDED`, los identificadores de criterios incluidos, la precedencia aplicada y una `basis` explicativa.

La precedencia metodológica es explícita y conservadora: `REJECTED > UNDECIDED > ACCEPTED`. La agregación rechaza listas vacías y criterios duplicados.

La especificación está documentada en `docs/evaluation/F2-32-DECISION-AGGREGATION.md`.

La evidencia CI `34116193123` y Architecture Spike `34116193050` resultó exitosa en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

## Incremento actual — F2-33 vinculación de agregación con EvaluationPlan

**Estado:** **IMPLEMENTADO; pendiente de validación CI**.

F2-33 garantiza que la agregación de decisiones solo pueda consumir exactamente los criterios autorizados por `EvaluationPlan`.

Cuando existe `selectionContext`, el conjunto autorizado es `selectedCriterionIds`. Sin `selectionContext`, el conjunto autorizado corresponde a `EvaluationPlan.items`. La operación exige correspondencia exacta: no puede faltar una decisión seleccionada ni puede incorporarse una decisión de un criterio externo.

La agregación subyacente conserva la precedencia definida en F2-32 y sus invariantes de unicidad y trazabilidad.

La especificación está documentada en `docs/evaluation/F2-33-EVALUATION-PLAN-AGGREGATION-BINDING.md`.

F2-33 no introduce scoring, ponderaciones, porcentajes globales, agregación entre ejecuciones/escenarios, reglas de parada, significancia estadística ni aceptación global del producto.

## Persistencia y versionado

Las referencias de versionado continúan persistidas como campos de primera clase. El plan metodológico se conserva en `evaluation_plan` y las condiciones comparables mediante `condition_fingerprint`. La reconstrucción de `Execution` mantiene ambos metadatos.

El valor `legacy-unknown` se utiliza únicamente para información histórica realmente ausente; no completa silenciosamente nuevas ejecuciones.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

## Frente 2 — Evaluación observable
**Estado:** F2-32 cerrado/validado; F2-33 implementado y en validación.

La secuencia actual es: delimitación de núcleo → selección contextual → vinculación con ejecución → repetición/variabilidad → estadística descriptiva → interpretación → juicio metodológico → decisión explícita mediante regla versionada → agregación de decisiones → vinculación de la agregación con el conjunto de criterios seleccionado.

Todavía quedan fuera scoring, ponderaciones, criterios críticos definitivos, reglas de parada, agregación entre ejecuciones/escenarios y método productivo de evaluación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions continúa validada mediante el spike ejecutable.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto y deben mantenerse reconstruibles junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Validar F2-33 en CI. Con la baseline verde, el siguiente paso será formalizar la relación entre `applicability` (`APPLICABLE` / `NOT_APPLICABLE`) y la agregación, definiendo cómo se representa un criterio seleccionado pero no aplicable sin contaminar la decisión agregada.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
