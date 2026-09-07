# F2-26 — Vinculación del plan de evaluación con la ejecución

**Estado:** **CERRADO / VALIDADO**

## 1. Propósito

Cerrar la brecha entre la selección contextual de criterios y la ejecución real, de modo que una selección explícita forme parte del estado histórico de la ejecución.

La unidad observable queda establecida como:

`Scenario/version + EvaluationSelectionContext → EvaluationPlan snapshot → Execution → Runner`

## 2. Decisión de diseño

`Execution` conserva un snapshot opcional de `EvaluationPlan`.

Cuando una ejecución recibe `evaluationSelection` se valida el escenario y su versión, se compone el plan con el contexto y alcance declarados, el plan se asocia al mismo `executionId` y el runner recibe la ejecución que ya contiene el snapshot.

## 3. Invariantes

1. El `executionId` del plan debe coincidir con el ID de la ejecución.
2. El `scenarioId` del contexto de selección debe coincidir con el escenario ejecutado.
3. El `scenarioVersion` del contexto debe coincidir con la versión cargada del escenario.
4. El `executionContext` y `scope` deben conservar las invariantes de `EvaluationPlan`.
5. Una selección explícita requiere un compositor de plan disponible.
6. Si la composición falla, no debe crearse ni persistirse una ejecución parcial.
7. El plan asociado no debe ser sustituido por actualizaciones posteriores del estado terminal.
8. Las ejecuciones no metodológicas existentes pueden continuar sin plan.

## 4. Persistencia

El snapshot se almacena en `executions.evaluation_plan` como JSONB.

La columna es nullable para conservar compatibilidad con ejecuciones históricas que no tuvieron selección contextual.

El repositorio PostgreSQL reconstruye `EvaluationPlan` al recuperar una ejecución y mantiene separadas las referencias de versionado metodológico de la estructura del plan.

## 5. Trazabilidad resultante

Una ejecución evaluada puede reconstruirse mediante:

`executionId → scenarioId/version → evaluationPlan.selectionContext → scope → selectedCriterionIds → plan.items → versionContext`

## 6. Fuera de alcance

Este incremento no introduce scoring, pesos, agregación global, repetición automática, análisis estadístico ni selección automática mediante IA.

## 7. Evidencia de cierre

CI `34105904356`: **success** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright E2E y Quality Gate.

Architecture Spike `34105904449`: **success** en SPIKE-001 a SPIKE-012, incluyendo PostgreSQL/versioning, BDD, Playwright y Quality Gate.
