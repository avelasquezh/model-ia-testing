# F2-29 — Interpretación metodológica de indicadores estadísticos

**Estado:** **CERRADO / VALIDADO**

## 1. Propósito

Definir cómo interpretar los indicadores descriptivos producidos por F2-28 sin confundir descripción estadística con juicio de calidad.

La unidad de interpretación es el conjunto de repeticiones ya validado y sus indicadores observados.

## 2. Principio rector

La cadena metodológica queda:

`Ejecuciones → evidencia/resultados → distribución → indicador → interpretación → juicio`

F2-29 define únicamente la etapa `interpretación`.

## 3. Estados interpretativos

### `NON_COMPARABLE`

Se utiliza cuando las condiciones de las ejecuciones no son comparables.

No debe interpretarse la distribución como variabilidad homogénea del comportamiento.

### `NO_EVALUABLE_OBSERVATION`

Se utiliza cuando `N_evaluable = 0`.

Los estados `INCONCLUSIVE`, `NOT_EVALUABLE`, `ERROR` y `CANCELLED` permanecen visibles y diferenciados.

### `CONSISTENT_OBSERVED`

Se utiliza cuando las condiciones son comparables y todas las ejecuciones evaluables observadas tienen el mismo resultado entre `PASS`, `PARTIAL` o `FAIL`.

Esto describe consistencia dentro de la muestra observada. No significa que el producto sea correcto, aceptable o libre de defectos.

### `VARIABLE_OBSERVED`

Se utiliza cuando las condiciones son comparables y el conjunto contiene más de un resultado evaluable entre `PASS`, `PARTIAL` y `FAIL`.

Esto demuestra variabilidad observada en la muestra. No demuestra por sí mismo reproducibilidad de un defecto, significancia estadística ni una tasa aceptable o inaceptable.

## 4. Precedencia

La interpretación debe seguir esta precedencia determinista:

1. condiciones no comparables → `NON_COMPARABLE`;
2. sin resultados evaluables → `NO_EVALUABLE_OBSERVATION`;
3. un único resultado evaluable observado → `CONSISTENT_OBSERVED`;
4. más de un resultado evaluable observado → `VARIABLE_OBSERVED`.

## 5. Separación entre indicador e interpretación

Una tasa, un intervalo de Wilson o una distribución no se convierte automáticamente en un juicio de calidad.

F2-29 tampoco define:

- umbral mínimo de PASS;
- umbral máximo de FAIL;
- regla de parada;
- significancia estadística obligatoria;
- score global;
- ponderaciones;
- aceptación o rechazo comercial.

## 6. Trazabilidad

La interpretación conserva referencia a los indicadores que la originaron. El resultado interpretativo es derivado y no sustituye las ejecuciones individuales ni la distribución estadística.

## 7. Evidencia de cierre

CI `34113055452`: **success** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright E2E y Quality Gate.

Architecture Spike `34113055442`: **success** en SPIKE-001 a SPIKE-012, incluyendo PostgreSQL/versioning, BDD, Playwright y Quality Gate.

## 8. Criterio de salida

Queda formalizada y validada una interpretación determinista y auditable de la variabilidad observada, limitada a describir comparabilidad, ausencia de observaciones evaluables, consistencia observada o variabilidad observada.

El siguiente paso metodológico debe definir reglas de juicio y eventual agregación únicamente después de establecer criterios explícitos y sus condiciones de aplicación.
