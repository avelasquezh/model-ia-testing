# F2-32 — Contrato de agregación de decisiones de evaluación

**Estado:** IMPLEMENTADO; pendiente de validación CI.

## Propósito

F2-32 define cómo combinar las decisiones individuales de varios criterios seleccionados para una misma evaluación, sin introducir scoring, ponderaciones ni porcentajes.

La agregación es una transformación metodológica explícita: recibe decisiones ya producidas por reglas versionadas y determina un único estado agregado mediante una precedencia declarada.

## Contrato

`EvaluationDecisionAggregationResult` conserva:

- `outcome`: `ACCEPTED`, `REJECTED` o `UNDECIDED`.
- `criterionCount`: número de criterios agregados.
- `acceptedCount`, `rejectedCount`, `undecidedCount`: distribución exacta de estados.
- `evaluatedCriterionIds`: identidad de los criterios incluidos.
- `precedence`: orden metodológico utilizado.
- `basis`: explicación de la resolución.

No se aceptan listas vacías ni criterios duplicados.

## Precedencia

La política de F2-32 es explícita y conservadora:

`REJECTED > UNDECIDED > ACCEPTED`

Por tanto:

- cualquier `REJECTED` hace que el agregado sea `REJECTED`;
- en ausencia de `REJECTED`, cualquier `UNDECIDED` hace que el agregado sea `UNDECIDED`;
- únicamente cuando todos los criterios son `ACCEPTED`, el agregado es `ACCEPTED`.

Esta precedencia no implica que `UNDECIDED` sea un defecto ni que `REJECTED` corresponda necesariamente a una decisión de producto final. Solo define cómo se resuelve la coexistencia de decisiones individuales dentro del alcance de este contrato.

## Trazabilidad

La agregación conserva los identificadores de criterios y la distribución de decisiones. La evidencia, la regla versionada que produjo cada decisión y la ejecución de origen permanecen en sus respectivos objetos y no son reemplazadas por el resultado agregado.

## Límites

F2-32 no introduce:

- scoring;
- ponderaciones;
- porcentajes de calidad;
- promedio de criterios;
- umbrales estadísticos;
- significancia estadística;
- reglas de parada;
- defectos críticos;
- agregación entre ejecuciones o escenarios;
- una regla universal de aceptación del producto.

La agregación opera únicamente sobre decisiones de criterio ya resueltas.

## Relación con incrementos anteriores

La cadena queda:

`Execution → Evidence/Result → Statistics → Interpretation → Methodological Judgment → Explicit Decision Rule → Criterion Decision → Multi-criterion Aggregation`.

F2-31 decide individualmente según una regla explícita y versionada. F2-32 establece cómo combinar esas decisiones sin reinterpretar sus fundamentos.

## Próximo paso

El siguiente incremento puede estudiar una política de decisión a nivel de conjunto de criterios seleccionados y su relación con el plan metodológico, manteniendo separadas las decisiones de criterio, la agregación y cualquier futuro scoring global.
