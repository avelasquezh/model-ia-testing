# F2-15 — Validación metodológica de métricas y unidades

## 1. Propósito

Definir un contrato metodológico mínimo para que una métrica sea interpretable, reproducible y trazable antes de utilizarla en evaluación.

Este incremento continúa F2-14: ya existe un tratamiento descriptivo de repeticiones y variabilidad. Ahora se establece qué significa una medición y qué unidad representa, evitando números sin semántica explícita.

## 2. Principio rector

Una medición no es solamente un valor.

`Métrica → objetivo → tipo → unidad → fuente de evidencia → condiciones → fórmula → versión → interpretación`

La definición de una métrica no constituye por sí misma una decisión de aceptación.

## 3. Contrato mínimo validado

Toda métrica candidata debe declarar como mínimo:

- `id`: identificador estable y único dentro del catálogo;
- `name`: nombre legible;
- `objective`: propiedad que se pretende observar o medir;
- `type`: tipo de medición;
- `unit`: unidad semántica del valor;
- `sourceEvidenceTypes`: tipos de evidencia que pueden sustentar la medición;
- `version`: versión de la definición;
- `formula`, cuando el valor sea derivado.

La ausencia de cualquiera de estos elementos impide considerar la definición suficientemente especificada.

## 4. Tipos y unidades

### 4.1 BOOLEAN

Representa una condición binaria observable.

Unidad conceptual: `boolean`.

Ejemplos:

- visibilidad de una respuesta;
- recuperación del flujo;
- cumplimiento de una condición responsable definida.

### 4.2 ORDINAL

Representa categorías ordenadas sin asumir que la distancia entre categorías sea equivalente.

Unidad conceptual: `ordinal-level`.

Ejemplo: nivel de relevancia definido por el método evaluativo.

### 4.3 NUMERIC

Representa una cantidad cuya unidad debe estar explícitamente definida.

En el MVP se validan como candidatos:

- `milliseconds` para tiempos observables;
- `proportion` para proporciones derivadas.

Una magnitud numérica sin unidad no debe presentarse como métrica interpretable.

### 4.4 COMPARATIVE

Representa una relación explícita entre una observación y una referencia compatible, como un baseline.

Ejemplo conceptual:

`(current - baseline) / baseline`

La comparación requiere que el baseline y sus condiciones sean identificables.

## 5. Catálogo candidato del MVP

Se validan metodológicamente las siguientes métricas iniciales:

| ID | Dimensión | Métrica | Tipo | Unidad | Evidencia principal |
|---|---|---|---|---|---|
| M-D1-RESPONSE-COMPLIANCE | D1 | Cumplimiento de respuesta esperada | NUMERIC | proportion | TRANSCRIPT |
| M-D2-RELEVANCE | D2 | Relevancia de respuesta | ORDINAL | ordinal-level | TRANSCRIPT |
| M-D3-CONTEXT-CONSISTENCY | D3 | Consistencia contextual | NUMERIC | proportion | TRANSCRIPT |
| M-D4-RECOVERY | D4 | Recuperación conversacional | BOOLEAN | boolean | TRANSCRIPT / INTERACTION |
| M-D5-RESPONSIBLE-BEHAVIOR | D5 | Comportamiento responsable observable | BOOLEAN | boolean | TRANSCRIPT |
| M-D6-FIRST-RESPONSE-TIME | D6 | Tiempo hasta primera respuesta observable | NUMERIC | milliseconds | TIMING / TRANSCRIPT |
| M-D6-FULL-RESPONSE-TIME | D6 | Tiempo hasta respuesta completa | NUMERIC | milliseconds | TIMING / TRANSCRIPT |
| M-D7-RESPONSE-VISIBILITY | D7 | Visibilidad de respuesta | BOOLEAN | boolean | DOM / SCREENSHOT / TRANSCRIPT |

Este catálogo es una base metodológica del MVP y no impide ampliar métricas posteriormente mediante versionado.

## 6. Métricas de rendimiento observable

Los tiempos deben representar únicamente eventos observables desde el sistema de prueba.

Para primera respuesta:

`first_observable_response_at - input_sent_at`

Para respuesta completa:

`full_response_at - input_sent_at`

No se debe interpretar ninguna de estas métricas como tiempo interno de inferencia, procesamiento del modelo o acceso interno a servicios.

La evidencia temporal debe conservar los timestamps necesarios para reconstruir el cálculo.

## 7. Proporciones

Una proporción derivada debe identificar numerador y denominador.

Ejemplo:

`fulfilled_expected_items / applicable_expected_items`

El denominador debe ser explícito y compatible con la definición del criterio. Cuando no existan elementos aplicables, la medición no debe producir artificialmente cero.

La estrategia estadística de F2-14 continúa aplicando a proporciones obtenidas sobre repeticiones comparables.

## 8. Comparación contra baseline

Una métrica comparativa no puede depender de un baseline implícito.

Debe poder identificarse:

- referencia utilizada;
- versión del baseline;
- periodo u origen;
- condiciones de obtención;
- población o conjunto comparable;
- definición de la métrica.

No se autoriza interpretar una diferencia como mejora o degradación sin una regla posterior que defina qué significa esa diferencia.

## 9. Relación con evidencia

La métrica debe indicar qué evidencia puede sustentarla.

Ejemplos:

- tiempos → `TIMING`, con apoyo de `TRANSCRIPT` cuando corresponda;
- estado observable de interfaz → `DOM` / `SCREENSHOT`;
- comportamiento conversacional → `TRANSCRIPT`;
- recuperación de interacción → `INTERACTION` y `TRANSCRIPT`.

La métrica no sustituye la evidencia primaria.

## 10. Versionado

La definición de una métrica puede cambiar. Cada cambio semántico debe producir una nueva versión.

La versión debe permitir distinguir mediciones producidas bajo definiciones incompatibles.

No se debe reutilizar un identificador para ocultar un cambio de significado.

## 11. Separación entre medición y aceptación

Este incremento no define:

- umbrales PASS/FAIL;
- límites comerciales;
- pesos por dimensión;
- score global;
- reglas universales de calidad;
- regla de parada de repeticiones;
- significancia estadística obligatoria.

Una métrica describe una propiedad. Una regla posterior puede interpretar esa propiedad.

## 12. Reglas de calidad metodológica

Una métrica candidata debe cumplir:

1. significado observable o explícitamente derivado de evidencia observable;
2. unidad inequívoca;
3. fuente de evidencia identificable;
4. fórmula reproducible cuando corresponda;
5. condiciones de medición documentables;
6. versión de definición;
7. separación respecto de la decisión de aceptación.

Si una propiedad no puede observarse bajo las condiciones definidas, debe conservarse como `NOT_EVALUABLE` o `INCONCLUSIVE` según el modelo ya establecido.

## 13. Criterio de salida

F2-15 queda metodológicamente validado cuando el catálogo candidato permite identificar qué se mide, para qué se mide, cómo se obtiene, qué unidad representa y qué evidencia lo sustenta, sin introducir todavía políticas de aceptación o scoring.

El siguiente trabajo de F2 puede utilizar este contrato como base para validar las reglas de interpretación y los umbrales específicos de los criterios, manteniendo separados medición, resultado y decisión.
