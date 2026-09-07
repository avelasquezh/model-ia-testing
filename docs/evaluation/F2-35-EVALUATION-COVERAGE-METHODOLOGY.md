# F2-35 — Cobertura metodológica de evaluación

## Estado

**IMPLEMENTADO; pendiente de validación CI.**

## Propósito

F2-35 formaliza la cobertura descriptiva de los criterios seleccionados para una ejecución. La cobertura explica qué ocurrió con cada criterio aplicable o no aplicable, sin convertir esa información en un porcentaje de calidad ni en una decisión global.

## Estados

Cada criterio seleccionado debe terminar en exactamente uno de estos estados de cobertura:

- `APPLICABLE_EVALUATED`: el criterio aplica y existe una evaluación `PASS` o `FAIL`.
- `APPLICABLE_NOT_EVALUATED`: el criterio aplica pero todavía no existe una evaluación.
- `NOT_APPLICABLE`: el criterio fue seleccionado pero la aplicabilidad del plan determina que no corresponde al contexto.
- `INSUFFICIENT_EVIDENCE`: el criterio aplica y su evaluación terminó en `NOT_EVALUABLE` por evidencia insuficiente.
- `INCONCLUSIVE`: el criterio aplica y la evaluación terminó en `INCONCLUSIVE`.

`NOT_APPLICABLE` no es un resultado de evaluación y nunca puede recibir un estado de decisión (`ACCEPTED`, `REJECTED`, `UNDECIDED`).

## Cadena metodológica

`EvaluationSelectionContext → EvaluationPlan → Applicability → CriterionEvaluation → Coverage`

La cobertura se construye sobre el plan de evaluación ya congelado para la ejecución. No vuelve a inferir aplicabilidad.

## Invariantes

1. Todo criterio de la selección debe aparecer exactamente una vez en la cobertura.
2. Una evaluación solo puede referenciar un criterio seleccionado.
3. Un criterio no puede tener más de una evaluación en la misma cobertura.
4. Un criterio `NOT_APPLICABLE` no puede tener evaluación.
5. Un criterio `APPLICABLE_NOT_EVALUATED` no puede tener evaluación.
6. `APPLICABLE_EVALUATED` requiere `PASS` o `FAIL`.
7. `INSUFFICIENT_EVIDENCE` requiere `NOT_EVALUABLE`.
8. `INCONCLUSIVE` requiere `INCONCLUSIVE`.

## Qué sí resuelve

La cobertura permite distinguir una ausencia legítima de aplicabilidad de una omisión de evaluación y de una evaluación bloqueada por evidencia insuficiente. Esto hace auditable el estado de cada criterio dentro de una ejecución.

## Qué no resuelve

F2-35 no define:

- porcentajes de cobertura;
- score;
- pesos por criterio o dimensión;
- aceptación o rechazo global;
- compensación entre criterios;
- criterios críticos;
- reglas de parada;
- agregación entre ejecuciones o escenarios;
- inferencia automática de aplicabilidad.

## Relación con decisiones

La cobertura y la decisión son artefactos distintos:

`Coverage → Decision`

La cobertura describe el estado de evaluación; F2-31 y F2-32 siguen siendo responsables de las decisiones explícitas y su agregación. Un criterio puede estar cubierto como `INSUFFICIENT_EVIDENCE` o `INCONCLUSIVE` sin que F2-35 invente una decisión.

## Salida

La implementación está en:

- `src/domain/evaluation/EvaluationCoverage.ts`
- `src/application/evaluation/BuildEvaluationCoverage.ts`
- `src/application/evaluation/BuildEvaluationCoverage.test.ts`
- `spike/evaluation/coverage-methodology-validation.test.ts`

## Próximo paso

Una vez validado F2-35, el siguiente incremento puede formalizar la interpretación de cobertura por ejecución —incluyendo criterios aplicables evaluados, no evaluados, insuficiencia de evidencia e inconclusos— todavía separada de scoring y agregación global.
