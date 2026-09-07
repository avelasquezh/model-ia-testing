# F2-26 — Vinculación del plan de evaluación con la ejecución

**Estado:** **IMPLEMENTADO; pendiente de validación CI**

## 1. Propósito

Cerrar la brecha entre la selección contextual de criterios y la ejecución real, de modo que una selección explícita no sea solamente un artefacto de composición sino parte del estado histórico de la ejecución.

La unidad observable queda establecida como:

`Scenario/version + EvaluationSelectionContext → EvaluationPlan snapshot → Execution → Runner`

## 2. Decisión de diseño

`Execution` conserva un snapshot opcional de `EvaluationPlan`.

El plan no sustituye al escenario ni al resultado de ejecución. Representa las condiciones metodológicas con las que se ejecutó una evaluación concreta.

Cuando una ejecución recibe `evaluationSelection`:

1. se valida el `scenarioId` contra el escenario cargado;
2. se valida `scenarioVersion` contra la versión realmente cargada;
3. se compone el plan con el contexto y alcance declarados;
4. el plan se asocia al mismo `executionId`;
5. el runner recibe el `Execution` que ya contiene el snapshot.

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

La operación de actualización de una ejecución no reemplaza `evaluation_plan`, preservando el snapshot histórico.

## 5. Trazabilidad resultante

Una ejecución evaluada puede reconstruirse mediante:

`executionId → scenarioId/version → evaluationPlan.selectionContext → scope → selectedCriterionIds → plan.items → versionContext`

Esto permite distinguir los criterios efectivamente seleccionados de los que pertenecían al catálogo pero no participaron de esa ejecución.

## 6. Fuera de alcance

Este incremento no introduce:

- scoring;
- pesos;
- agregación global;
- repetición automática;
- análisis estadístico;
- selección automática mediante IA;
- modificación de las reglas del runner para evaluar criterios.

## 7. Evidencia esperada

La salida del incremento requiere comprobar en CI:

- compilación TypeScript;
- pruebas de dominio para invariantes del plan dentro de `Execution`;
- pruebas de aplicación que demuestren composición y propagación antes del runner;
- pruebas de persistencia y reconstrucción PostgreSQL;
- migraciones reproducibles;
- BDD, Playwright y quality gate sin regresiones.

## 8. Siguiente incremento

Con F2-26 validado, formalizar repetición controlada y variabilidad observable sobre ejecuciones comparables, manteniendo resultados individuales e identidad de las condiciones antes de definir cualquier estadística o scoring.
