# F2-31 — Contrato explícito de decisión de evaluación

**Estado:** IMPLEMENTADO; pendiente de validación CI.

## Propósito

F2-31 establece la frontera entre los resultados de evaluación de criterios y una decisión explícita de aceptación o rechazo.

La decisión debe ser producida por una regla metodológica versionada y declarada. El sistema no puede inferir una decisión de aceptación o rechazo únicamente a partir del estado `PASS`, de porcentajes, de intervalos estadísticos o de un juicio metodológico previo.

## Contrato

`EvaluationDecisionResult` representa una decisión con tres estados:

- `ACCEPTED`: la regla explícita determina aceptación.
- `REJECTED`: la regla explícita determina rechazo.
- `UNDECIDED`: la regla explícita no permite decidir.

Cada decisión conserva:

- `ruleVersion`: versión de la regla que produjo la decisión.
- `basis`: explicación textual de la derivación.

## Regla explícita

`BuildEvaluationDecision` recibe:

1. el estado de evaluación de un criterio (`PASS`, `FAIL`, `INCONCLUSIVE` o `NOT_EVALUABLE`);
2. una regla explícita con versión y función de decisión.

El componente aplica únicamente la regla recibida. No existe una regla de aceptación por defecto.

Esto permite que la política metodológica sea definida y versionada fuera del componente de aplicación y evita convertir una convención técnica en una decisión de negocio o calidad.

## Límites de F2-31

F2-31 no introduce:

- una regla universal `PASS = ACCEPTED`;
- una regla universal `FAIL = REJECTED`;
- agregación de múltiples criterios;
- ponderaciones o scoring;
- umbrales estadísticos;
- reglas de parada;
- significancia estadística;
- defectos críticos;
- aceptación global del producto.

La decisión sigue siendo trazable al resultado de criterio y a la versión de la regla que la produjo.

## Relación con incrementos anteriores

La cadena metodológica queda:

`Execution → Evidence/Result → Statistics → Interpretation → Methodological Judgment → Explicit Decision Rule → Evaluation Decision`.

F2-30 describe lo observado desde una perspectiva metodológica. F2-31 introduce el mecanismo formal para decidir únicamente cuando una regla explícita y versionada autoriza esa decisión.

## Próximo paso

El siguiente incremento puede definir una política de agregación de múltiples criterios, pero únicamente después de establecer sus reglas metodológicas explícitas y sus precedencias para estados indeterminados.
