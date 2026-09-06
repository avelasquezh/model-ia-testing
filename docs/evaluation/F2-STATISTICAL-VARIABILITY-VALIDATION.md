# F2-14 — Validación metodológica del tratamiento estadístico de la variabilidad

## 1. Propósito

Definir y validar un tratamiento estadístico descriptivo mínimo para conjuntos de repeticiones, sin convertir todavía los resultados en una política de aceptación, un score global o un umbral comercial.

Este incremento continúa F2-13: las repeticiones conservan identidad y condiciones comparables; ahora se valida cómo resumir su comportamiento sin ocultar la variabilidad ni confundir una muestra con una verdad poblacional.

## 2. Principio rector

La cadena metodológica es:

`Ejecuciones individuales → distribución observada → indicador descriptivo → incertidumbre → interpretación`

No:

`Ejecuciones → promedio/porcentaje → aprobación automática`

## 3. Propiedades validadas

### STAT-V01 — Denominador explícito

Los indicadores de PASS/PARTIAL/FAIL deben declarar su denominador.

Para tasas de resultados evaluables, `INCONCLUSIVE` y `NOT_EVALUABLE` permanecen fuera del denominador de resultados evaluables y se reportan separadamente.

### STAT-V02 — Distribución preservada

El tratamiento estadístico no sustituye los resultados individuales. La distribución por estado debe continuar siendo auditable.

### STAT-V03 — Tasa observada

Para un resultado `X` dentro de ejecuciones evaluables:

`Tasa(X) = cantidad de ejecuciones con X / cantidad de ejecuciones evaluables`

La tasa es descriptiva de la muestra observada.

### STAT-V04 — Incertidumbre explícita

Una proporción observada no debe presentarse como una estimación exacta de la población. Para proporciones se valida como candidato descriptivo el intervalo de Wilson al 95%, con `z = 1.96`.

El intervalo expresa incertidumbre de muestreo; no es un umbral de aceptación.

### STAT-V05 — Muestra insuficiente

Si ninguna repetición es evaluable, no se calcula una tasa PASS/FAIL/PARTIAL. Se conserva el conjunto como `INCONCLUSIVE`/`NOT_EVALUABLE` según corresponda.

### STAT-V06 — Separación entre indicador y juicio

Una tasa o intervalo no determina por sí mismo si un chatbot es aceptable, defectuoso o estadísticamente significativo.

## 4. Tratamiento mínimo validado

Para cada conjunto comparable de repeticiones se recomienda conservar:

| Indicador | Descripción |
|---|---|
| `N_total` | Total de ejecuciones del conjunto |
| `N_evaluable` | PASS + PARTIAL + FAIL |
| `N_inconclusive` | Ejecuciones INCONCLUSIVE |
| `N_not_evaluable` | Ejecuciones NOT_EVALUABLE |
| `N_pass` | Ejecuciones PASS |
| `N_partial` | Ejecuciones PARTIAL |
| `N_fail` | Ejecuciones FAIL |
| `rate_X` | Proporción observada de X sobre `N_evaluable` |
| `CI95_X` | Intervalo Wilson de la proporción, cuando `N_evaluable > 0` |

## 5. Ejemplo metodológico

Para:

`PASS, PASS, FAIL, INCONCLUSIVE, NOT_EVALUABLE`

se obtiene:

- `N_total = 5`
- `N_evaluable = 3`
- `N_inconclusive = 1`
- `N_not_evaluable = 1`
- `N_pass = 2`
- `N_fail = 1`
- tasa PASS observada = `2/3`
- tasa FAIL observada = `1/3`

Las tasas no se calculan sobre 5 porque eso mezclaría estados indeterminados con resultados evaluables.

## 6. Intervalo de Wilson

Para una proporción observada `p = x/n` y `z = 1.96`:

`center = (p + z²/(2n)) / (1 + z²/n)`

`margin = z/(1 + z²/n) × sqrt((p(1-p) + z²/(4n))/n)`

`CI95 = [max(0, center-margin), min(1, center+margin)]`

La implementación del spike valida la estructura matemática y sus límites `[0,1]`.

## 7. Lo que NO queda definido

Este incremento no establece:

- tamaño universal de muestra;
- umbral mínimo de PASS;
- umbral máximo de FAIL;
- regla de parada de repeticiones;
- prueba de significancia obligatoria;
- comparación entre versiones;
- score global;
- ponderaciones por dimensión;
- política comercial de aceptación/rechazo.

Tampoco se afirma que el intervalo de Wilson sea el método definitivo para todos los tipos de criterio. Es un método candidato para proporciones binarias/nominales y deberá revisarse cuando se definan los tipos de métricas definitivos.

## 8. Relación con INCONCLUSIVE y NOT_EVALUABLE

Los estados indeterminados son información metodológica y no errores estadísticos.

`INCONCLUSIVE` indica que existe una ejecución evaluable en principio pero la evidencia disponible no permite concluir.

`NOT_EVALUABLE` indica que el criterio no puede evaluarse bajo las condiciones disponibles.

Ambos deben permanecer visibles y separados de `FAIL`.

## 9. Criterio de salida

Queda validado un tratamiento estadístico descriptivo mínimo basado en distribución, denominador explícito, tasas observadas e intervalo de Wilson como indicador de incertidumbre para proporciones.

La estadística informa la variabilidad observada; no decide por sí sola la calidad del producto ni introduce scoring o política de aceptación.