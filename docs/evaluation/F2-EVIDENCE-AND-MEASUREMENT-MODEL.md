# F2 — Modelo de Evidencia y Medición

## 1. Propósito

Definir cómo `model-ia-testing` captura, valida, conserva e interpreta evidencia durante una evaluación automatizada de un bot conversacional.

El modelo establece una separación estricta entre:

`Evento observable → Evidencia → Medición/observación → Regla → Resultado → Hallazgo`

La evidencia demuestra lo ocurrido. La regla determina cómo interpretarlo. Ningún componente puede convertir una ausencia de evidencia en un defecto sin una regla explícita que lo permita.

## 2. Principios

### 2.1 Evidencia antes que conclusión

Toda conclusión evaluativa debe poder rastrearse hasta una o más evidencias observables.

### 2.2 Reproducibilidad

Una medición debe registrar las condiciones necesarias para poder repetir la prueba y entender diferencias entre ejecuciones.

### 2.3 Integridad

La evidencia debe conservar su relación con el caso, ejecución, paso y momento en que fue obtenida.

### 2.4 Contexto

Una medición sin contexto puede ser engañosa. Deben registrarse las condiciones relevantes de ejecución.

### 2.5 Separación entre observación y juicio

El sistema debe diferenciar:

- qué ocurrió;
- qué se midió;
- qué regla se aplicó;
- qué resultado produjo la regla;
- qué interpretación o hallazgo se generó.

### 2.6 Limitación explícita

Cuando una propiedad no pueda observarse o medirse de manera suficiente, el resultado debe ser `NOT_EVALUABLE` o `INCONCLUSIVE`, según corresponda.

## 3. Taxonomía de evidencia

| Código | Tipo | Uso principal |
|---|---|---|
| E01 | Transcript | Mensajes enviados y recibidos |
| E02 | DOM | Estado observable de la interfaz |
| E03 | Screenshot | Representación visual del estado |
| E04 | Timing | Tiempos observables de interacción |
| E05 | Interaction | Clicks, inputs, navegación y eventos observables |
| E06 | Browser metadata | URL, viewport, navegador y contexto técnico relevante |
| E07 | Network observable | Solicitudes/respuestas accesibles desde el navegador, cuando esté permitido |
| E08 | Console | Errores observables de consola |
| E09 | Artifact | Archivo generado por la ejecución, cuando aplique |
| E10 | AI analysis | Interpretación producida o asistida por un modelo de IA |

`E10` nunca debe considerarse por sí sola evidencia primaria del comportamiento del bot. Debe referenciar evidencia primaria sobre la cual se realizó el análisis.

## 4. Unidad de evidencia

Cada evidencia debe poder asociarse, como mínimo, con:

- `run_id`
- `scenario_id`
- `step_id`, cuando aplique
- `timestamp`
- `evidence_type`
- `source`
- `content_reference`
- `capture_method`
- `integrity_reference`, cuando aplique
- `metadata`

La implementación concreta de estos campos queda para el diseño técnico.

## 5. Modelo de medición

Toda métrica utilizada por el producto debe documentar:

1. Identificador.
2. Nombre.
3. Objetivo.
4. Unidad.
5. Fórmula, si aplica.
6. Fuente de datos.
7. Condiciones de medición.
8. Umbral o regla de interpretación.
9. Limitaciones.
10. Versión de la definición.

Esto evita que un número sea presentado como una medida objetiva sin definir cómo fue obtenido o interpretado.

## 6. Tipos de medición

### 6.1 Boolean

Determina si una condición se cumple o no.

Ejemplo conceptual: el bot respondió dentro del escenario esperado.

### 6.2 Ordinal

Representa niveles ordenados sin asumir que la distancia entre niveles sea equivalente.

Ejemplo: adecuación conversacional `alta / media / baja`.

### 6.3 Numérica

Representa una cantidad medible con unidad definida.

Ejemplo: tiempo observable de respuesta en milisegundos.

### 6.4 Comparativa

Compara una observación contra un baseline o referencia explícita.

### 6.5 No evaluable

Se utiliza cuando la propiedad requerida no puede determinarse mediante la evidencia disponible y las condiciones de prueba.

## 7. Tiempo observable

El tiempo medido por el sistema debe distinguir, cuando sea posible:

- inicio de interacción;
- envío de entrada;
- primera señal observable de respuesta;
- respuesta completa;
- finalización de interacción.

No debe afirmarse que un tiempo representa el tiempo interno de inferencia del modelo. Es un tiempo observado desde el punto de vista del sistema de prueba.

## 8. Baselines

Una métrica comparativa requiere un baseline definido.

El baseline debe identificar:

- origen;
- versión;
- fecha o periodo relevante;
- condiciones de ejecución;
- población o conjunto de escenarios;
- métrica utilizada.

No se debe comparar directamente ejecuciones realizadas bajo condiciones incompatibles sin declarar la limitación.

## 9. Repetición y variabilidad

Los bots conversacionales pueden producir respuestas variables. Por ello, un único resultado no debe interpretarse automáticamente como comportamiento determinista.

Cuando el criterio sea sensible a variabilidad, el modelo deberá permitir:

- repetir escenarios;
- registrar cada ejecución individual;
- conservar las condiciones de cada repetición;
- distinguir resultado individual de resultado agregado.

La estrategia estadística concreta queda pendiente de validación durante F2.

## 10. Evidencia mínima por resultado

| Resultado | Condición mínima |
|---|---|
| PASS | Evidencia suficiente para demostrar cumplimiento |
| FAIL | Evidencia suficiente para demostrar incumplimiento |
| PARTIAL | Evidencia de cumplimiento parcial según regla explícita |
| INCONCLUSIVE | Evidencia insuficiente, contradictoria o no determinante |
| NOT_EVALUABLE | La propiedad no es observable/evaluable bajo las condiciones definidas |

## 11. Evidencia de un hallazgo

Un hallazgo debe mantener la siguiente cadena:

`Finding → Result → Criterion → Observation → Evidence → Scenario → Run`

Como mínimo debe poder responderse:

- ¿qué criterio falló?
- ¿qué ocurrió?
- ¿qué evidencia lo demuestra?
- ¿en qué escenario?
- ¿en qué ejecución?
- ¿bajo qué condiciones?
- ¿qué regla produjo el resultado?

## 12. Evidencia generada mediante IA

Cuando un modelo de IA participe en la evaluación, se debe registrar:

- modelo o identificador de evaluador;
- versión/configuración relevante;
- evidencia de entrada;
- instrucción o método evaluativo versionado;
- salida obtenida;
- regla de aceptación;
- indicación de que el resultado fue asistido por IA.

La IA puede interpretar evidencia; no puede reemplazar la evidencia primaria requerida por el criterio.

## 13. NOT_EVALUABLE vs INCONCLUSIVE

`NOT_EVALUABLE` significa que el criterio no puede ser evaluado mediante el alcance y observabilidad definidos.

`INCONCLUSIVE` significa que el criterio sí pertenece al alcance evaluable, pero la ejecución produjo evidencia insuficiente, contradictoria o no determinante.

Esta diferencia debe mantenerse en reportes y métricas para evitar penalizar artificialmente al objetivo por limitaciones del instrumento de evaluación.

## 14. Integridad y cadena de custodia

La arquitectura deberá permitir demostrar que una evidencia pertenece a una ejecución determinada.

Como mínimo se deberá estudiar el uso de:

- identificadores únicos;
- timestamps consistentes;
- referencias entre entidades;
- hashes de artefactos cuando sea necesario;
- metadatos de captura;
- versionado de criterios y reglas.

La implementación de hashes, almacenamiento inmutable o mecanismos equivalentes se decidirá durante el diseño técnico y el análisis de riesgos.

## 15. Relación con el modelo de calidad

Las métricas y evidencias de este documento sirven como mecanismo de medición de criterios definidos en `F2-CRITERIA-CATALOG.md`.

No se debe crear una métrica únicamente porque sea técnicamente fácil de obtener. Toda métrica debe justificar su relación con un objetivo evaluativo.

## 16. Decisiones pendientes

Quedan pendientes de definición en F2:

- catálogo definitivo de métricas;
- umbrales por criterio;
- estrategia de repetición;
- tratamiento estadístico de variabilidad;
- fórmula de riesgo;
- modelo de agregación de resultados;
- modelo de scoring;
- política de confianza para evaluaciones asistidas por IA;
- estrategia definitiva de integridad de evidencias.

Estas decisiones no deben anticiparse en código hasta quedar aprobadas metodológicamente.
