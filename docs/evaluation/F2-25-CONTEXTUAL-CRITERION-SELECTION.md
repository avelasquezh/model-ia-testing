# F2-25 — Selección contextual de criterios

**Estado:** **CERRADO / VALIDADO EN BASELINE EJECUTABLE**

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

## 6. Integración cerrada en F2-26

La selección contextual quedó conectada al flujo real de `ExecuteScenario` sin trasladar reglas metodológicas al runner.

Cuando existe `evaluationSelection`, `ExecuteScenario`:

1. verifica que ID y versión de selección coincidan con el `Scenario` cargado;
2. compone el `EvaluationPlan` antes de iniciar el runner;
3. asocia el plan al `Execution` mediante un snapshot inmutable;
4. entrega ese mismo `Execution` al runner;
5. conserva el snapshot durante el ciclo de vida de la ejecución.

El snapshot se persiste como `evaluation_plan` en PostgreSQL. Las actualizaciones terminales de la ejecución no reemplazan el plan histórico.

Las ejecuciones técnicas que aún no usan evaluación contextual pueden continuar sin plan; una selección explícita no puede ejecutarse sin un compositor de plan.

## 7. Fuera de alcance

Este incremento no define:

- selección automática mediante IA;
- scoring;
- pesos de criterios;
- repetición de ejecuciones;
- análisis estadístico;
- inferencias sobre criterios no seleccionados;
- fórmula de agregación global.

## 8. Evidencia

La baseline contiene pruebas de dominio, aplicación y persistencia para:

- invariantes del contexto de selección;
- asociación del plan con `Execution`;
- rechazo de selección contra otra versión del escenario;
- propagación del plan al runner;
- persistencia y reconstrucción del snapshot en PostgreSQL;
- compatibilidad con ejecuciones sin selección contextual.

## 9. Siguiente incremento

Formalizar repetición controlada y variabilidad observable sobre ejecuciones que comparten `Scenario` + versión + `EvaluationPlan`, antes de introducir scoring o agregación global.
