# F2 — Validación metodológica de agregación

## Propósito

Validar las reglas mínimas de agregación definidas en el baseline F2 antes de implementar un motor de scoring productivo.

Este incremento es exclusivamente metodológico. No crea entidades de scoring, no introduce un score global 0–100 y no convierte `PARTIAL` en una política comercial definitiva.

## Reglas validadas

### AGG-V01 — Cumplimiento sobre resultados evaluables

`PASS`, `PARTIAL` y `FAIL` participan en la métrica candidata de cumplimiento. `INCONCLUSIVE` y `NOT_EVALUABLE` no forman parte de su denominador.

### AGG-V02 — NOT_EVALUABLE no equivale a FAIL

Un criterio no evaluable no debe reducir artificialmente el cumplimiento. Su existencia debe permanecer visible como limitación de cobertura.

### AGG-V03 — INCONCLUSIVE no equivale a FAIL

Un resultado inconcluso representa ausencia de conclusión suficiente y debe conservarse separado del fallo.

### AGG-V04 — PARTIAL como convención candidata

`PARTIAL = 0.5` puede utilizarse como representación numérica provisional para agregaciones donde la naturaleza ordinal del criterio lo permita. No significa que todo resultado parcial represente exactamente 50 % de calidad.

### AGG-V05 — Ausencia de resultados evaluables

Si ningún criterio es evaluable, no debe fabricarse un porcentaje de cumplimiento. La métrica debe quedar sin valor (`NOT_EVALUABLE`/equivalente de presentación), conservando los estados originales.

### AGG-V06 — Conservación de estados

La agregación debe conservar los conteos de `PASS`, `PARTIAL`, `FAIL`, `INCONCLUSIVE` y `NOT_EVALUABLE` para que el indicador pueda auditarse y contextualizarse.

### AGG-V07 — Agregación por dimensión antes de score global

Las dimensiones deben poder analizarse independientemente. Una dimensión no aplicable no debe convertirse automáticamente en un resultado negativo ni forzar todavía un score global.

## Resultado

Las reglas candidatas son internamente consistentes con el baseline metodológico: el cumplimiento se calcula únicamente sobre resultados determinados y evaluables, mientras que `INCONCLUSIVE` y `NOT_EVALUABLE` permanecen visibles fuera del denominador.

La validación no demuestra que la convención `PARTIAL = 0.5` sea universalmente correcta. Tampoco valida pesos, umbrales, overrides críticos, intervalos estadísticos o un score global.

## Decisiones pendientes

Continúan abiertas:

- validación con casos sintéticos más amplios;
- aplicabilidad por dimensión;
- reglas para criterios críticos;
- sensibilidad ante diferentes cantidades de escenarios;
- tratamiento de repetición y variabilidad;
- pesos de dimensiones;
- score global;
- versión productiva de las reglas.

## Criterio de salida

El modelo de agregación queda apto para una siguiente validación metodológica centrada en no compensación de fallos críticos y estabilidad ante diferentes composiciones de escenarios.

No se implementa todavía como política productiva.
