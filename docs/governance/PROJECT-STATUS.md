# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incremento cerrado — F2-23 invariantes del contexto de versionado metodológico

**Estado:** **CERRADO / VALIDADO**.

Se formalizaron las invariantes que deben cumplirse para que una ejecución nueva sea históricamente reconstruible. El contexto llega explícitamente a la ejecución nueva, conserva las referencias mínimas de versionado y no utiliza la normalización `legacy-unknown` como sustituto silencioso. El alcance excluye deliberadamente scoring, pesos, agregación estadística y taxonomía definitiva.

La especificación quedó documentada en `docs/evaluation/F2-23-VERSION-CONTEXT-INVARIANTS.md`.

## Incremento cerrado — F2-24 delimitación de dimensiones del MVP

**Estado:** **CERRADO / VALIDADO**.

Se delimitó el perímetro del MVP mediante observabilidad, reproducibilidad, dependencia de canal y complejidad metodológica.

El núcleo obligatorio queda compuesto por D1 Corrección funcional observable, D2 Adecuación conversacional, D3 Continuidad contextual, D4 Robustez conversacional y D6 Rendimiento conversacional observable.

D5 Seguridad y comportamiento responsable observable queda como extensión condicionada a escenarios y políticas explícitas. D7 Calidad de interacción e interfaz queda como extensión dependiente del canal y no como requisito del núcleo conversacional.

La decisión metodológica quedó documentada en `docs/evaluation/F2-24-MVP-DIMENSION-DELIMITATION.md`.

La delimitación tiene soporte ejecutable mediante el perfil `MVP_CORE`: una composición de plan puede filtrar explícitamente el catálogo a los 18 criterios definidos como núcleo, conservar su aplicabilidad por contexto y persistir el alcance del plan.

## Incremento cerrado — F2-25 selección contextual de criterios

**Estado:** **CERRADO / VALIDADO**.

F2-25 introduce `EvaluationSelectionContext` como contrato independiente de `Scenario`. La selección queda asociada explícitamente a `scenarioId`, `scenarioVersion`, `executionContext`, `scope` y `selectedCriterionIds`.

`ComposeEvaluationPlan` acepta la selección explícita, valida que el contexto coincida con la ejecución, restringe la composición al alcance solicitado y rechaza cualquier criterio inexistente o fuera del alcance.

`EvaluationPlan` conserva el contexto de selección cuando participa una selección explícita y verifica la consistencia entre contexto, alcance y criterios seleccionados.

La evidencia CI de F2-25 quedó incorporada mediante la integración posterior con la ejecución real.

La especificación está documentada en `docs/evaluation/F2-25-CONTEXTUAL-CRITERION-SELECTION.md`.

F2-25 no introduce scoring, pesos, agregación, repetición, variabilidad ni selección automática mediante IA.

## Incremento cerrado — F2-26 vinculación del plan de evaluación con la ejecución

**Estado:** **CERRADO / VALIDADO**.

`Execution` conserva un snapshot opcional de `EvaluationPlan`. Una selección explícita se valida contra el `scenarioId` y `scenarioVersion` realmente cargados, se compone antes del runner y se entrega al runner dentro de la ejecución que será persistida.

El snapshot se persiste como JSONB en `executions.evaluation_plan` y se reconstruye al recuperar una ejecución. Las actualizaciones del estado terminal no sustituyen el snapshot metodológico.

La especificación está documentada en `docs/evaluation/F2-26-EXECUTION-PLAN-BINDING.md`.

La validación CI y Architecture Spike de F2-26 resultaron exitosas en TypeScript, pruebas unitarias/aplicación, PostgreSQL, BDD, Playwright y quality gate.

## Incremento actual — F2-27 repetición controlada y variabilidad observable

**Estado:** **IMPLEMENTADO; pendiente de validación CI**.

F2-27 incorpora `RepetitionSet` para representar un conjunto controlado de ejecuciones terminales del mismo escenario y versión, manteniendo identidad individual. No se permite duplicar `executionId`, mezclar escenarios o versiones dentro del conjunto comparable, ni analizar ejecuciones aún `PENDING` o `RUNNING`.

`Execution` incorpora `conditionFingerprint` opcional como referencia persistente de las condiciones de ejecución. La migración `004_execution_repeatability.sql` añade `executions.condition_fingerprint` sin romper ejecuciones históricas.

`AnalyzeRepetitionSet` expone únicamente cantidad de repeticiones, escenario/version, comparabilidad de condiciones y distribución de estados terminales. `INCONCLUSIVE`, `NOT_EVALUABLE`, `ERROR` y `CANCELLED` permanecen diferenciados y no se convierten automáticamente en `FAILED`.

La especificación metodológica queda documentada en `docs/evaluation/F2-REPETITION-REPRODUCIBILITY-VALIDATION.md`.

F2-27 no introduce tamaño universal de muestra, reglas de parada, estadística inferencial, scoring, pesos, agregación global ni selección automática mediante IA.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. El plan metodológico asociado se persiste en `evaluation_plan` y las condiciones comparables de repetición mediante `condition_fingerprint`.

`PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` y, cuando existen, `EvaluationPlan` y `conditionFingerprint` al recuperar una ejecución. Las actualizaciones de estado no sustituyen las referencias metodológicas históricas.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida y no debe completar silenciosamente una ejecución nueva.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

## Frente 2 — Evaluación observable
**Estado:** F2-26 cerrado/validado; F2-27 implementado y en validación.

La baseline contiene siete dimensiones candidatas y un catálogo de criterios. F2-24 establece el núcleo; F2-25 determina la selección contextual; F2-26 liga el plan seleccionado a la ejecución; F2-27 conserva y analiza repeticiones sin convertir variabilidad en score.

El contrato ejecutable todavía no define scoring/agregación, pesos, estadística inferencial, reglas de parada, criterios críticos definitivos, fórmula de riesgo definitiva ni método productivo de evaluación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions quedó validada mediante el spike ejecutable. La evidencia incluye compilación, pruebas de dominio/aplicación, BDD, browser automation, persistencia, controles arquitectónicos, configuración, observabilidad y trazabilidad auditable de artefactos.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution`, migraciones y pruebas de versionado/repetición implementados; F2-27 pendiente de validación CI.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Validar F2-27 en CI. Con la baseline verde, el siguiente incremento será formalizar el tratamiento estadístico de la variabilidad y sus límites de interpretación. Solo después corresponde diseñar scoring y agregación global.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
