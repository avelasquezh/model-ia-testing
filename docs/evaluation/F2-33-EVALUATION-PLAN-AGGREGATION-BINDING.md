# F2-33 — Vinculación de la agregación con EvaluationPlan

**Estado:** IMPLEMENTADO; pendiente de validación CI.

## Propósito

F2-33 garantiza que la agregación de decisiones solo pueda utilizar los criterios seleccionados explícitamente por `EvaluationPlan`.

La agregación deja de ser una operación abierta sobre una lista arbitraria de decisiones cuando existe un plan de evaluación. El plan define el conjunto autorizado; ninguna decisión de un criterio externo puede incorporarse silenciosamente.

## Contrato

`AggregateEvaluationPlanDecisions` recibe:

1. un `EvaluationPlan`;
2. una decisión por cada criterio seleccionado.

El componente exige correspondencia exacta entre ambos conjuntos.

La selección se obtiene de `selectionContext.selectedCriterionIds` cuando el contexto de selección está presente. En ausencia de `selectionContext`, se utiliza el conjunto de `EvaluationPlan.items` como conjunto autorizado.

## Invariantes

- No se aceptan decisiones para criterios fuera de la selección del plan.
- No puede faltar la decisión de un criterio seleccionado.
- El número de decisiones debe coincidir con el número de criterios seleccionados.
- Los identificadores duplicados siguen siendo rechazados por el contrato de agregación subyacente.
- La agregación mantiene la precedencia ya definida en F2-32: `REJECTED > UNDECIDED > ACCEPTED`.

## Trazabilidad

El resultado conserva los `criterionId` realmente agregados, sus conteos, la precedencia aplicada y el fundamento de la decisión agregada.

La vinculación con el plan evita que el resultado agregado pueda interpretarse como procedente de un conjunto de criterios diferente del que fue seleccionado para la ejecución.

## Límites

F2-33 no introduce:

- criterios adicionales por inferencia;
- ponderaciones;
- scoring;
- porcentajes globales;
- agregación entre ejecuciones o escenarios;
- reglas de parada;
- significancia estadística;
- aceptación global del producto.

## Cadena metodológica

`EvaluationSelectionContext → EvaluationPlan → Criterion Decisions → Decision Aggregation`

F2-32 define cómo combinar decisiones. F2-33 define qué decisiones están autorizadas a entrar en esa combinación.

## Próximo paso

El siguiente incremento puede formalizar la relación entre la agregación, la aplicabilidad de criterios y los criterios `NOT_APPLICABLE`, antes de considerar cualquier mecanismo de scoring.
