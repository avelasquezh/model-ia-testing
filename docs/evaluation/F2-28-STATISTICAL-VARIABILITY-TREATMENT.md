# F2-28 — Tratamiento estadístico descriptivo de la variabilidad

**Estado:** **IMPLEMENTADO; pendiente de validación CI**

## 1. Propósito

Formalizar el primer tratamiento estadístico productivo de la variabilidad observada en conjuntos comparables de repeticiones.

El objetivo es describir la muestra sin convertir automáticamente sus indicadores en aceptación, rechazo o score global.

## 2. Principio rector

`Ejecuciones individuales → distribución observada → denominador explícito → tasa → incertidumbre → interpretación`

La estadística no sustituye las ejecuciones individuales ni sus evidencias.

## 3. Entrada

El tratamiento opera sobre un `RepetitionSet` válido: ejecuciones terminales, mismo escenario y versión comparable, y una referencia de condiciones mediante `conditionFingerprint`.

La ausencia de condiciones comparables no se interpreta como variabilidad homogénea del comportamiento.

## 4. Indicadores

Se calculan `N_total`, `N_evaluable`, `N_inconclusive`, `N_not_evaluable`, `N_pass`, `N_partial`, `N_fail`, además de las tasas observadas de `PASSED`, `PARTIALLY_PASSED` y `FAILED` sobre `N_evaluable`.

`ERROR` y `CANCELLED` permanecen visibles como estados técnicos y no entran silenciosamente al denominador evaluable.

## 5. Denominador

`N_evaluable = PASSED + PARTIALLY_PASSED + FAILED`.

Ejemplo: `PASSED, PASSED, FAILED, INCONCLUSIVE, NOT_EVALUABLE` produce `N_total = 5`, `N_evaluable = 3`, tasa PASS `2/3` y tasa FAIL `1/3`.

## 6. Incertidumbre

Las tasas incluyen un intervalo Wilson al 95% con `z = 1.96` como indicador descriptivo de incertidumbre. El intervalo no es un umbral de aceptación ni implica por sí mismo significancia estadística.

## 7. Muestra no evaluable

Si `N_evaluable = 0`, las tasas e intervalos de PASS/PARTIAL/FAIL son `null`. La distribución y los estados indeterminados se conservan.

## 8. Separación entre indicador y juicio

F2-28 no decide aceptabilidad, defecto reproducible, regla de parada, score, ponderación ni agregación global. Esas decisiones requieren reglas metodológicas explícitas posteriores.

## 9. Criterio de salida

Queda implementado un tratamiento descriptivo mínimo que conserva distribución, denominador, tasas e incertidumbre para repeticiones comparables, sin introducir política de aceptación ni scoring.

## 10. Evidencia

La validación requerida cubre compilación TypeScript, pruebas de dominio y aplicación, migraciones PostgreSQL, BDD, Playwright y quality gate.
