# F2-34 — Aplicabilidad y agregación de decisiones

**Estado:** IMPLEMENTADO; pendiente de validación CI.

## Propósito

F2-34 formaliza la relación entre `EvaluationPlan.applicability` y la agregación de decisiones definida en F2-32/F2-33.

Un criterio seleccionado pero `NOT_APPLICABLE` permanece dentro del plan y de la trazabilidad de la ejecución, pero no entra en la agregación de decisiones. `NOT_APPLICABLE` no se transforma en `REJECTED`, `UNDECIDED` ni `ACCEPTED`.

## Contrato

`AggregateApplicableEvaluationPlanDecisions` recibe:

1. un `EvaluationPlan`;
2. decisiones únicamente para criterios cuyo `applicability` sea `APPLICABLE`.

Produce:

- `aggregation`: la agregación de decisiones aplicables, o `null` cuando no existe ningún criterio aplicable;
- `applicableCriterionIds`: criterios que participaron en la agregación;
- `notApplicableCriterionIds`: criterios seleccionados que quedaron fuera por no aplicabilidad.

## Invariantes

- Una decisión para un criterio fuera de la selección del plan es rechazada.
- Una decisión para un criterio `NOT_APPLICABLE` es rechazada.
- Cada criterio `APPLICABLE` debe tener exactamente una decisión.
- Los identificadores duplicados son rechazados.
- Un plan con todos sus criterios `NOT_APPLICABLE` no produce una agregación `ACCEPTED` vacía: `aggregation` es `null`.
- La precedencia de F2-32 se mantiene para los criterios realmente aplicables: `REJECTED > UNDECIDED > ACCEPTED`.

## Semántica

F2-34 separa dos conceptos:

`Applicability` responde **si el criterio debe evaluarse**.

`Decision` responde **qué determinación metodológica se obtuvo cuando el criterio aplica**.

Por tanto:

`NOT_APPLICABLE ≠ REJECTED`

y un criterio no aplicable no reduce ni incrementa artificialmente la decisión agregada.

## Trazabilidad

El resultado permite identificar por separado:

`EvaluationPlan → APPLICABLE → Criterion Decision → Aggregation`

`EvaluationPlan → NOT_APPLICABLE → Reason → Exclusion from Aggregation`

La razón de `NOT_APPLICABLE` permanece en el `EvaluationPlan`; F2-34 no la reemplaza por una decisión de calidad.

## Límites

F2-34 no introduce:

- scoring;
- ponderaciones;
- porcentajes de calidad;
- compensación entre criterios;
- aceptación global del producto;
- criterios críticos;
- reglas de parada;
- agregación entre ejecuciones o escenarios;
- inferencia automática de aplicabilidad.

## Relación con incrementos anteriores

F2-17 estableció que `NOT_APPLICABLE` no significa `FAIL` y que la aplicabilidad debe quedar registrada por ejecución.

F2-32 define cómo combinar decisiones individuales.

F2-33 define qué decisiones están autorizadas por `EvaluationPlan`.

F2-34 define cuáles de esos criterios autorizados participan efectivamente en la agregación de decisiones según su aplicabilidad.

## Cadena metodológica

`EvaluationSelectionContext → EvaluationPlan → Applicability → Criterion Decisions → Decision Aggregation`

## Criterio de salida

F2-34 queda validado cuando una ejecución con criterios aplicables y no aplicables puede producir una agregación que incluya exclusivamente criterios aplicables, conserve explícitamente los no aplicables y no interprete `NOT_APPLICABLE` como una decisión de calidad.

## Próximo paso

El siguiente incremento debe formalizar cómo la cobertura de criterios aplicables, no aplicables, no evaluados e inconclusos se expone como resultado metodológico auditable, todavía separado del scoring global.
