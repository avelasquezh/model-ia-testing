# F2-25 — Selección contextual de criterios

**Estado:** **IMPLEMENTADO; pendiente de validación CI**

## 1. Propósito

Convertir la delimitación de F2-24 en una selección determinista y auditable para una ejecución concreta.

La unidad de decisión es:

`Escenario + versión del escenario + contexto de ejecución + alcance → criterios seleccionados`

La evaluación posterior conserva la diferencia entre un criterio seleccionado pero no aplicable y un criterio que no fue seleccionado.

## 2. Decisión de diseño

La selección contextual no se incorpora al agregado `Scenario` como regla metodológica. Se representa mediante `EvaluationSelectionContext`, manteniendo la independencia entre el dominio del escenario y la metodología de evaluación.

El contexto de selección contiene:

- `scenarioId`;
- `scenarioVersion`;
- `executionContext`;
- `scope`;
- `selectedCriterionIds`.

El plan resultante conserva este contexto cuando la selección explícita participa en su composición.

## 3. Reglas invariantes

1. Un escenario debe quedar identificado por ID y versión positiva.
2. El contexto de ejecución no puede estar vacío.
3. Debe existir al menos un criterio seleccionado.
4. No se permiten IDs de criterio repetidos en la selección.
5. Todo criterio seleccionado debe existir en el catálogo.
6. Todo criterio seleccionado debe pertenecer al alcance declarado.
7. El contexto de selección debe coincidir con el contexto del `EvaluationPlan`.
8. El alcance de selección debe coincidir con el alcance del `EvaluationPlan`.
9. Un criterio seleccionado puede resultar `NOT_APPLICABLE`; esto no equivale a `FAIL`.
10. F2-25 no introduce scoring, pesos, agregación ni estadística.

## 4. Comportamiento esperado

Para una selección explícita, el compositor no debe evaluar ni incluir criterios adicionales del alcance por inferencia implícita.

Ejemplo:

`MVP_CORE + [D1-C01] → plan con D1-C01 únicamente`

Si se intenta seleccionar `D6-C05` dentro de `MVP_CORE`, la composición debe fallar explícitamente porque el criterio está fuera del alcance definido por F2-24.

## 5. Trazabilidad

El `EvaluationPlan` conserva el contexto de selección para que una ejecución pueda reconstruirse posteriormente a partir de:

`executionId → scenarioId/version → executionContext → scope → selectedCriterionIds → criterios aplicados/no aplicables`

Las referencias de versionado metodológico continúan separadas y persisten como contexto histórico de la ejecución.

## 6. Fuera de alcance

Este incremento no define:

- selección automática mediante IA;
- scoring;
- pesos de criterios;
- repetición de ejecuciones;
- análisis estadístico;
- inferencias sobre criterios no seleccionados;
- persistencia adicional fuera del modelo `EvaluationPlan` existente.

## 7. Criterio de salida

F2-25 queda cerrado cuando CI confirme que:

- el contrato de selección compila;
- la composición conserva la selección explícita;
- se rechazan criterios fuera del alcance;
- se mantienen las invariantes de `NOT_APPLICABLE`;
- no existen regresiones en BDD, Playwright, persistencia ni quality gates.

## 8. Siguiente incremento

Formalizar cómo el resultado de la selección contextual se consume durante una ejecución real y, después, definir repetición y variabilidad antes de introducir scoring global.
