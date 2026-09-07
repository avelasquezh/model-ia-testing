# F2-28 — Validación metodológica del tratamiento estadístico de la variabilidad

## 1. Propósito

Definir y validar un tratamiento estadístico descriptivo mínimo para conjuntos de repeticiones, sin convertir los resultados en una política automática de aceptación, un score global o un umbral comercial.

## 2. Principio rector

La cadena metodológica es:

`Ejecuciones individuales → distribución observada → indicador descriptivo → incertidumbre → interpretación`

La estadística informa la muestra observada; no sustituye la evidencia ni determina por sí sola el juicio de calidad.

## 3. Propiedades validadas

### STAT-V01 — Denominador explícito

Los indicadores de `PASSED`, `PARTIALLY_PASSED` y `FAILED` declaran como denominador `N_evaluable`.

`N_evaluable = N_pass + N_partial + N_fail`.

`INCONCLUSIVE` y `NOT_EVALUABLE` permanecen fuera de ese denominador y se reportan por separado.

### STAT-V02 — Distribución preservada

El tratamiento estadístico no sustituye los resultados individuales. La distribución por estado continúa siendo auditable mediante las ejecuciones que forman el `RepetitionSet`.

### STAT-V03 — Tasas observadas

Para un estado evaluable `X`:

`rate(X) = N_X / N_evaluable`.

La tasa es descriptiva de la muestra observada y no una afirmación exacta sobre la población.

### STAT-V04 — Incertidumbre explícita

Para proporciones se utiliza como indicador descriptivo el intervalo de Wilson al 95%, con `z = 1.96`.

El intervalo cuantifica incertidumbre de muestreo; no funciona como límite de aceptación ni como prueba de significancia.

### STAT-V05 — Sin resultados evaluables

Cuando `N_evaluable = 0`, no se calculan tasas ni intervalos para `PASSED`, `PARTIALLY_PASSED` o `FAILED`.

La ausencia de resultados evaluables no se transforma automáticamente en un fallo.

### STAT-V06 — Separación entre indicador y juicio

Una tasa, distribución o intervalo no determina por sí mismo si existe un defecto reproducible, si el producto es aceptable o cuándo deben detenerse las repeticiones.

## 4. Tratamiento mínimo

Para cada conjunto comparable se conservan:

| Indicador | Descripción |
|---|---|
| `N_total` | Total de ejecuciones |
| `N_evaluable` | PASS + PARTIAL + FAIL |
| `N_inconclusive` | Ejecuciones INCONCLUSIVE |
| `N_not_evaluable` | Ejecuciones NOT_EVALUABLE |
| `N_pass` | Ejecuciones PASSED |
| `N_partial` | Ejecuciones PARTIALLY_PASSED |
| `N_fail` | Ejecuciones FAILED |
| `rate_X` | Tasa observada de X sobre `N_evaluable` |
| `CI95_X` | Intervalo Wilson al 95% cuando `N_evaluable > 0` |

Los estados técnicos `ERROR` y `CANCELLED` permanecen visibles y fuera del denominador evaluable.

## 5. Ejemplo

Para:

`PASSED, PASSED, FAILED, INCONCLUSIVE, NOT_EVALUABLE`

se obtiene:

- `N_total = 5`;
- `N_evaluable = 3`;
- `N_pass = 2`;
- `N_fail = 1`;
- `N_inconclusive = 1`;
- `N_not_evaluable = 1`;
- `rate(PASSED) = 2/3`;
- `rate(FAILED) = 1/3`.

Los estados indeterminados no se mezclan con resultados evaluables.

## 6. Intervalo de Wilson

Para una proporción `p = x/n` y `z = 1.96`:

`center = (p + z²/(2n)) / (1 + z²/n)`

`margin = z/(1 + z²/n) × sqrt((p(1-p) + z²/(4n))/n)`

`CI95 = [max(0, center-margin), min(1, center+margin)]`.

El resultado queda acotado en `[0,1]`.

## 7. Límites metodológicos

F2-28 no establece:

- tamaño universal de muestra;
- umbral mínimo o máximo de resultados;
- regla de parada;
- prueba de significancia obligatoria;
- comparación automática entre versiones;
- score global;
- ponderaciones por dimensión;
- política comercial de aceptación o rechazo.

Wilson se adopta como tratamiento descriptivo para proporciones. Su adecuación a otros tipos de métricas deberá revisarse cuando se formalicen métricas adicionales.

## 8. Criterio de salida

Queda validado un tratamiento estadístico descriptivo mínimo basado en distribución, denominador explícito, tasas observadas e intervalo de Wilson, preservando la trazabilidad de las ejecuciones individuales y separando indicador estadístico de juicio metodológico.