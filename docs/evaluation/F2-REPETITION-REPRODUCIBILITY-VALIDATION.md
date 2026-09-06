# F2 — Validación metodológica de repetición y reproducibilidad

## 1. Propósito

Validar cómo deben tratarse las repeticiones de un mismo escenario cuando el comportamiento del chatbot puede variar entre ejecuciones.

Este incremento es un spike metodológico. No define todavía un tamaño universal de muestra ni una política estadística definitiva.

## 2. Hipótesis

Una ejecución individual puede no representar adecuadamente un comportamiento conversacional variable. Para estudiar variabilidad, las repeticiones deben conservar identidad, versión del escenario y condiciones comparables.

La repetición no debe ocultar los resultados individuales mediante un único resultado prematuro.

## 3. Principio rector

La cadena debe conservarse como:

`Escenario/version → Condiciones → Ejecución individual → Evidencia → Resultado individual → Conjunto de repeticiones → Análisis de variabilidad`

No:

`Escenario → múltiples ejecuciones → único resultado sin trazabilidad`

## 4. Propiedades validadas

### REP-V01 — Identidad independiente

Cada repetición debe corresponder a una ejecución identificable de forma independiente.

### REP-V02 — Versión comparable

Cuando las repeticiones pretenden medir el mismo comportamiento, deben conservar la misma versión del escenario, salvo que el cambio de versión sea precisamente la variable estudiada.

### REP-V03 — Condiciones comparables

La interpretación de variabilidad requiere que las condiciones relevantes sean comparables. Se propone conservar una referencia de condiciones o fingerprint de ejecución.

### REP-V04 — Resultado individual preservado

Los resultados de cada repetición deben conservarse. Una agregación posterior no debe destruir la secuencia individual.

### REP-V05 — Variabilidad explícita

Si las repeticiones producen resultados diferentes, el sistema debe poder mostrar esa distribución sin asumir automáticamente que existe un fallo reproducible ni que existe comportamiento aceptable.

### REP-V06 — Estados indeterminados preservados

`INCONCLUSIVE` y `NOT_EVALUABLE` deben permanecer diferenciados de `FAIL` también dentro de las repeticiones.

## 5. Registro mínimo candidato

Cada repetición debe conservar, como mínimo:

| Campo | Propósito |
|---|---|
| `executionId` | Identidad de ejecución individual |
| `scenarioId` | Escenario ejecutado |
| `scenarioVersion` | Versión bajo prueba |
| `outcome` | Resultado individual |
| `conditionFingerprint` | Referencia de condiciones comparables |

Estos campos constituyen una estructura metodológica candidata; no crean todavía un contrato productivo de repetición.

## 6. Interpretación de variabilidad

Un conjunto puede producir, por ejemplo:

`PASS, PASS, FAIL`

Esto demuestra variabilidad observable dentro del conjunto probado, pero no determina por sí mismo:

- que el chatbot sea defectuoso;
- que el fallo sea estadísticamente significativo;
- que exista una tasa de aceptación o rechazo;
- que una repetición adicional sea innecesaria.

La interpretación depende del criterio, condiciones, evidencia y método estadístico posterior.

## 7. Comparabilidad

No debe interpretarse como variabilidad del chatbot una diferencia causada por condiciones incompatibles, como:

- versión diferente del escenario;
- configuración diferente del entorno;
- población diferente cuando sea relevante;
- condiciones de ejecución no equivalentes;
- cambios deliberados en el instrumento evaluador.

Cuando estas diferencias sean parte del experimento, deben declararse como variables y no ocultarse.

## 8. Tamaño de muestra

Este incremento no establece un número universal de repeticiones.

El tamaño mínimo deberá depender, como mínimo, de:

- tipo de criterio;
- variabilidad esperada;
- costo de ejecución;
- riesgo del comportamiento;
- precisión estadística requerida;
- consecuencias de un falso positivo o falso negativo.

Por tanto, `N` no se fija todavía como política global del producto.

## 9. Tratamiento estadístico pendiente

Queda deliberadamente fuera de este spike:

- intervalos de confianza;
- pruebas de significancia;
- estimadores definitivos de variabilidad;
- distribución mínima aceptable;
- tamaño de muestra universal;
- reglas de parada;
- agregación estadística por dimensión;
- umbrales comerciales.

Estas decisiones requieren un incremento metodológico separado.

## 10. Relación con scoring y evaluación

La repetición proporciona información adicional para la evaluación, pero no debe transformarse automáticamente en puntos de calidad.

La secuencia recomendada es:

`Resultados individuales → análisis de variabilidad → indicador estadístico validado → evaluación/juicio`

No:

`Resultados individuales → promedio automático → score global`

Esto mantiene la separación entre observación, indicador y juicio definida en F2.

## 11. Criterio de salida

Queda validado que las repeticiones deben conservar identidad individual, versión y condiciones comparables; que la variabilidad debe permanecer observable; y que los estados `INCONCLUSIVE`/`NOT_EVALUABLE` no deben convertirse en fallos durante el análisis.

No se define todavía una política estadística, tamaño de muestra ni umbral de aceptación.