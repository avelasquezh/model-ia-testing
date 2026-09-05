# Frente 2 — Modelo de evaluación observable

**Versión:** 0.1  
**Estado:** Baseline metodológica inicial  

## 1. Propósito

Definir qué puede evaluar `model-ia-testing` de un chatbot mediante interacción externa, qué evidencia necesita para hacerlo y qué condiciones impiden emitir una conclusión válida.

El modelo no define todavía una puntuación global.

## 2. Fundamento

ISTQB CTFL establece fundamentos de pruebas, consideración del riesgo y reporting de progreso y calidad; el producto adopta estos principios para estructurar pruebas y comunicar resultados. citeturn0search13

ISO/IEC 25010:2023 proporciona un modelo de calidad de producto con nueve características y subcaracterísticas y puede utilizarse para especificar, medir y evaluar calidad. No todas sus características son directamente observables desde una interfaz conversacional, por lo que esta plataforma deberá seleccionar únicamente dimensiones que puedan operacionalizarse con evidencia externa. citeturn0search1

ISO/IEC 25020:2019 proporciona un marco para seleccionar y construir medidas, planificar mediciones y considerar su fiabilidad y validez. Por ello, ninguna métrica deberá incorporarse solo porque sea fácil de calcular. citeturn0search4

ISO/IEC 25019:2023 aborda calidad en uso y requiere especificar el contexto de uso. Por tanto, las conclusiones relacionadas con utilidad en un contexto real deberán estar condicionadas al contexto definido y no confundirse con propiedades internas del producto. citeturn0search0

## 3. Principio de evaluabilidad

Una propiedad solo podrá formar parte de una evaluación automatizada cuando exista:

1. una definición verificable;
2. una condición de prueba reproducible;
3. una observación posible;
4. evidencia suficiente;
5. una regla explícita para interpretar la evidencia.

Si falta cualquiera de estos elementos, el sistema deberá evitar convertir la ausencia de evidencia en un defecto.

## 4. Capas de evaluación

El modelo separa cinco niveles:

### Nivel 1 — Observación

Qué ocurrió durante la interacción.

Ejemplos: respuesta recibida, tiempo observado, error visible, cambio de interfaz.

### Nivel 2 — Verificación

Comparación entre comportamiento observado y condición esperada.

### Nivel 3 — Hallazgo

Descripción estructurada de una desviación, riesgo o comportamiento relevante sustentado por evidencia.

### Nivel 4 — Evaluación

Interpretación del conjunto de resultados respecto a un criterio de calidad.

### Nivel 5 — Calificación

Agregación cuantitativa de evaluaciones. Este nivel queda pendiente de diseño.

## 5. Dimensiones candidatas para el MVP

Estas dimensiones constituyen una propuesta inicial que deberá ser validada antes de convertirse en scoring.

### D1 — Corrección funcional observable

Evalúa si el chatbot realiza el comportamiento esperado frente a entradas definidas.

Ejemplos:
- responde a solicitudes válidas;
- entrega información esperada;
- respeta condiciones explícitas del escenario;
- evita resultados incompatibles con el objetivo definido.

### D2 — Adecuación conversacional

Evalúa si la respuesta resulta adecuada para la intención y contexto definidos en el escenario.

Ejemplos:
- relevancia;
- coherencia con la pregunta;
- completitud respecto al objetivo;
- manejo de ambigüedad.

### D3 — Continuidad contextual

Evalúa la conservación del contexto conversacional observable entre turnos.

Ejemplos:
- referencias a información previa;
- continuidad de entidades;
- mantenimiento de restricciones establecidas;
- ausencia de contradicciones introducidas por pérdida de contexto.

### D4 — Robustez conversacional

Evalúa el comportamiento frente a variaciones, entradas inesperadas o condiciones adversas definidas en los escenarios.

Ejemplos:
- entradas ambiguas;
- errores del usuario;
- reformulaciones;
- cambios de tema;
- solicitudes fuera del flujo previsto.

### D5 — Seguridad observable y comportamiento responsable

Evalúa comportamientos que puedan verificarse externamente mediante escenarios autorizados.

Ejemplos:
- exposición indebida de información proporcionada durante la prueba;
- comportamiento ante solicitudes claramente fuera de alcance;
- manejo de información sensible introducida en escenarios controlados;
- respuestas que contradigan reglas de seguridad observables.

No equivale a una auditoría de seguridad ni a un pentest.

### D6 — Rendimiento conversacional observable

Evalúa propiedades temporales observables de la interacción.

Ejemplos:
- tiempo hasta respuesta;
- timeout;
- estabilidad de tiempos bajo condiciones comparables;
- fallos relacionados con espera o disponibilidad.

No deberá interpretarse como medición completa del rendimiento interno.

### D7 — Calidad de interacción e interfaz

Evalúa aspectos observables de la experiencia conversacional en la interfaz web.

Ejemplos:
- disponibilidad de controles necesarios;
- posibilidad de completar una conversación;
- errores visibles;
- comportamiento bloqueante;
- accesibilidad observable que pueda ser automatizada de forma válida.

Esta dimensión deberá delimitarse para evitar convertir el MVP en una auditoría completa de UX o accesibilidad.

## 6. Dimensiones deliberadamente no inferidas

El sistema no deberá concluir automáticamente, únicamente desde interacción externa, sobre:

- arquitectura interna;
- modelo fundacional utilizado;
- calidad del prompt;
- calidad del RAG interno;
- calidad de la base de datos;
- código fuente;
- arquitectura de infraestructura;
- seguridad interna no observable;
- eficiencia interna del modelo;
- parámetros de inferencia.

Podrán evaluarse efectos observables de estas áreas únicamente cuando exista un criterio y evidencia externa suficientes.

## 7. Tipos de criterio

Cada criterio deberá clasificarse como uno de los siguientes:

- `BOOLEAN`: cumple/no cumple.
- `ORDINAL`: resultado en una escala ordenada previamente definida.
- `NUMERIC`: métrica cuantitativa.
- `COMPARATIVE`: comparación contra baseline o referencia.
- `NOT_EVALUABLE`: no existe evidencia suficiente.

La elección del tipo deberá justificarse por el criterio.

## 8. Estructura mínima de un criterio

Cada criterio deberá definir:

- ID.
- dimensión.
- objetivo.
- precondiciones.
- entrada.
- comportamiento esperado.
- evidencia requerida.
- observación.
- regla de decisión.
- resultado.
- limitaciones.
- método de medición cuando aplique.
- versión.

## 9. Estados de evaluación

Se establecen como estados metodológicos iniciales:

- `PASS`
- `FAIL`
- `PARTIAL`
- `INCONCLUSIVE`
- `NOT_EVALUABLE`

Estos estados describen el resultado de un criterio, no una puntuación de calidad.

## 10. Evidencia y decisión

La decisión deberá poder expresarse como:

`Criterio + Observación + Evidencia + Regla = Resultado`

No deberá permitirse una conclusión sin referencia a la evidencia que la sustenta.

## 11. Papel de la IA

La IA podrá utilizarse para:

- clasificar respuestas;
- comparar respuesta y expectativa cuando la comparación semántica lo requiera;
- detectar posibles contradicciones;
- agrupar hallazgos;
- generar explicaciones;
- asistir en análisis exploratorio.

La IA no deberá ser la única fuente de evidencia.

Cuando una decisión dependa de una interpretación probabilística o semántica, el sistema deberá registrar el método utilizado y permitir identificar que la conclusión fue asistida por IA.

## 12. Riesgo

La selección y priorización de pruebas deberá considerar riesgo. El nivel de riesgo deberá influir en la profundidad y prioridad de las pruebas, pero su fórmula concreta queda pendiente de formalización.

## 13. Métricas

Toda métrica deberá documentar como mínimo:

- qué mide;
- unidad;
- fórmula o método de cálculo;
- fuente de datos;
- condiciones de medición;
- límites;
- interpretación;
- validez esperada;
- repetibilidad esperada.

Esto sigue el principio de que seleccionar una medida requiere considerar su fiabilidad y validez. citeturn0search4

## 14. Regla contra el scoring prematuro

No se asignarán pesos ni puntuaciones a las dimensiones hasta validar:

1. que el criterio sea observable;
2. que exista evidencia suficiente;
3. que la medición sea reproducible;
4. que el resultado sea interpretable;
5. que la dimensión tenga relevancia para el objetivo del chatbot.

## 15. Resultado de Frente 2

Frente 2 deberá producir:

- catálogo definitivo de dimensiones del MVP;
- catálogo de criterios;
- definición de evidencia por criterio;
- reglas de decisión;
- catálogo de métricas;
- límites de observabilidad;
- tratamiento de IA evaluadora;
- modelo de riesgo;
- protocolo de validación del modelo.

El scoring será un artefacto posterior.
