# Legacy vs Adaptive — revisión técnica de descubrimiento conversacional

**Estado:** REVISIÓN TÉCNICA INTERMEDIA — SIN RESULTADO EMPÍRICO CERRADO  
**Producto:** `0.1.0`  
**Rama:** `feat/adaptive-discovery-parallel`  
**PR:** `#21`  
**Head revisado:** `d002b2796092a8ce201448aa13366ed1349e2dbf`  
**Fecha de revisión:** 2026-09-10

## 1. Objetivo de esta revisión

Reconstruir el comportamiento real de los dos motores de descubrimiento presentes en el trabajo reciente:

- `LEGACY`: `PlaywrightChatDiscovery`.
- `ADAPTIVE`: `AdaptiveDiscoveryExperimentRunner` + primitivas de puntuación y comparación DOM.

Esta revisión no usa el benchmark semántico LLM como sustituto. Legacy vs Adaptive es una comparación de automatización web y descubrimiento de interfaz.

## 2. Qué implementa realmente Adaptive

Adaptive es un sistema paralelo de exploración de UI. Su flujo actual es:

`candidatos visibles -> scoring multidimensional -> ranking -> click controlado -> snapshot antes/después -> diff DOM/UI -> clasificación -> selección de superficie chat-like`

Las señales actuales de scoring son:

- `SEMANTIC`: lenguaje asociado a chat/ayuda/asistente/mensaje y términos negativos.
- `STRUCTURAL`: `button` y `role=button`.
- `GEOMETRIC`: posición fija y proximidad a borde inferior/derecho.
- `ACCESSIBILITY`: controles deshabilitados.
- `BEHAVIORAL`: estado `readonly`.
- `DOM_MUTATION`: declarado en el tipo de estrategia, pero actualmente no existe un `MutationObserver`; la adaptación se implementa mediante snapshots antes/después y su diff.

La ejecución está acotada por cantidad de candidatos, cantidad de clicks y tiempo de estabilización.

## 3. Descubrimiento de candidatos

La implementación actual inspecciona:

`button, [role="button"]`

en la página principal y en los frames actualmente cargados directamente.

Esto significa que el sistema sí es provider-neutral y evita selectores de proveedores concretos, pero la cobertura actual es deliberadamente más estrecha que "todos los elementos clickeables".

No se incluyen todavía de forma explícita:

- enlaces que actúan como launcher;
- elementos con `tabindex=0`;
- elementos con `onclick`/handlers de interacción no expresados como botón;
- controles equivalentes dentro de árboles Shadow DOM mediante una estrategia propia de recorrido.

Por tanto, la afirmación correcta para esta revisión es "button-like controls", no "todos los elementos clickeables".

## 4. Detección de superficie conversacional

Después de cada click Adaptive captura una representación normalizada de la interfaz y calcula diferencias:

- nuevos elementos visibles;
- nuevos diálogos;
- nuevos textboxes;
- nuevos forms;
- nuevos iframes;
- cambio del hash DOM.

La clasificación `CHAT_SURFACE_CANDIDATE` exige:

`newTextboxes > 0` y al menos uno de `newDialogs`, `newIframes` o `newForms`.

Esto evita seleccionar una simple mutación visual como si fuera automáticamente un chatbot.

## 5. Seguridad de exploración

Antes de clicar se aplican filtros de seguridad. Se excluyen términos asociados a:

delete, remove, logout, purchase, buy, checkout, payment, subscribe, cancel, y equivalentes en español.

También se excluyen tipos `submit` y `reset`.

La política está diseñada para que una puntuación alta sea solamente una señal de priorización y no una autorización implícita para ejecutar cualquier acción.

## 6. Aislamiento Legacy vs Adaptive

El benchmark paralelo crea un contexto Playwright independiente para cada modelo y objetivo.

Flujo:

`target -> contexto Legacy -> Legacy discovery -> cierre`

`target -> contexto Adaptive -> Adaptive discovery -> cierre`

Esto evita compartir estado de página, storage o locators entre los modelos.

## 7. Diferencia fundamental entre ambos modelos

### Legacy

`PlaywrightChatDiscovery` intenta resolver directamente los roles funcionales del chat: launcher, composer, send button y response.

Su salida está orientada a obtener una configuración de interacción que posteriormente permite ejecutar una conversación.

### Adaptive

Adaptive explora el espacio de interacción de la página.

No parte de un selector específico del proveedor. Primero determina qué controles podrían ser relevantes y experimenta con ellos, observando si la interfaz cambia de manera compatible con una superficie conversacional.

Conceptualmente:

`Legacy = discovery dirigida`

`Adaptive = discovery experimental basada en evidencia de interacción`

Esta es la diferencia arquitectónica importante que faltaba en revisiones anteriores.

## 8. Límite funcional actual

El benchmark actual no ejecuta todavía la interacción completa después de descubrir una superficie.

El CLI `browser:discovery:benchmark` registra explícitamente:

`CHAT_SURFACE_FOUND = descubrimiento de superficie chat-like`

pero:

`SEND -> RECEIVE = NOT_PERFORMED`

Por tanto, una selección Adaptive no equivale todavía a una conversación verificada.

Existe una capacidad separada de verificación SEND/RECEIVE en `scripts/run-browser-sut.ts`, pero esa verificación pertenece al flujo browser-SUT existente y actualmente no está integrada como fase final del `ParallelDiscoveryBenchmarkRunner` Adaptive.

Este desacoplamiento es correcto metodológicamente para no convertir semejanza DOM en ground truth, pero deja incompleto el objetivo funcional final del nuevo sistema.

## 9. Ground truth

El repositorio ya contiene `DiscoveryGroundTruth` con:

- `expectedChat`;
- `functionalValidation` (`VERIFIED`, `FAILED`, `NOT_PERFORMED`);
- TP;
- FP;
- TN;
- FN;
- precision;
- recall;
- false-positive rate.

La implementación correctamente evita inferir ground truth desde el score Adaptive o desde el DOM.

Sin embargo, el corpus actual contiene principalmente objetivos candidatos y no incorpora todavía el etiquetado operacional completo `expectedChat + functionalValidation` requerido para calcular una evaluación empírica cerrada.

## 10. Benchmark actual

El corpus mantenido contiene 23 objetivos públicos entre páginas de demostración y candidatos adicionales.

La batería está configurada para comparar ambos motores sobre el mismo corpus y generar un reporte versionado.

La ejecución más reciente de la rama falló antes de benchmark por TypeScript. Se corrigieron posteriormente los errores observados en:

- fixture `debug` implícitamente `any`;
- conversiones `null` versus propiedades opcionales;
- mutaciones de propiedades `readonly` en la construcción de observaciones.

El último commit de corrección es `d002b2796092a8ce201448aa13366ed1349e2dbf`.

No existe todavía una ejecución CI asociada a este SHA que permita afirmar que el benchmark funcional ya pasó. Por ello no se incluyen porcentajes ni un ganador Legacy/Adaptive en este documento.

## 11. Problemas técnicos identificados antes del benchmark

### P1 — restauración de estado limitada

Después de un click que modifica el DOM sin cambiar la URL, `restoreAfterExperiment` no reconstruye la página. El estado mutado puede afectar experimentos posteriores.

### P2 — locators recolectados antes de experimentar

Los candidatos se recolectan una sola vez. Después de una mutación importante del DOM, un locator basado en posición puede resolver un elemento diferente o quedar obsoleto.

### P3 — cobertura de clickables limitada

La consulta actual es `button, [role="button"]`, no un modelo completo de elementos activables.

### P4 — threshold de alta confianza todavía no interviene en la selección

`highConfidenceThreshold` se propaga desde configuración, pero el runner actualmente no usa ese valor para modificar el resultado. El ranking sí usa el score.

### P5 — Adaptive todavía no verifica SEND→RECEIVE

Es el principal hueco funcional respecto del objetivo final del sistema.

## 12. Estado frente al objetivo del MVP

La comparación Legacy vs Adaptive ya está materializada como arquitectura experimental independiente.

Adaptive ya puede:

- explorar controles;
- priorizarlos por evidencia;
- evitar controles peligrosos conocidos;
- comparar interfaz antes/después;
- detectar señales de una superficie conversacional;
- conservar trazas de cada experimento;
- ejecutarse en paralelo con Legacy en contextos aislados.

Adaptive todavía no puede declararse equivalente al ciclo completo de conversación porque falta integrar de forma nativa la etapa:

`superficie descubierta -> composer -> send -> response -> SEND/RECEIVE VERIFIED`

## 13. Criterio recomendado para el próximo incremento

No se debe calibrar todavía el scoring por resultados no verificados.

La siguiente evolución debe ser un adaptador de interacción posterior al descubrimiento que:

1. reutilice la superficie detectada;
2. identifique composer de forma contextual;
3. identifique send o determine la estrategia Enter;
4. determine un observador de respuesta;
5. ejecute un mensaje de prueba no destructivo;
6. confirme SEND;
7. confirme RECEIVE mediante cambio observable independiente;
8. registre evidencia primaria;
9. produzca `VERIFIED` o `FAILED` para ground truth.

Después de esa integración debe ejecutarse nuevamente el benchmark Legacy vs Adaptive y construir la matriz TP/FP/TN/FN.

## 14. Conclusión

La revisión corrige la interpretación anterior del proyecto.

Adaptive no es un segundo LLM evaluator ni una variante del análisis semántico. Es un motor experimental de descubrimiento web que usa interacción controlada y cambios observables del DOM/UI para encontrar una superficie conversacional desconocida.

Legacy sigue siendo el control estable.

Adaptive representa la vía para reducir la dependencia de locators preconfigurados y afrontar widgets con launchers ocultos, superficies dinámicas e interfaces no uniformes.

La evidencia actual demuestra la existencia y materialización de esta arquitectura, pero todavía no permite afirmar superioridad empírica ni cierre funcional del MVP. La decisión debe basarse en el benchmark y, especialmente, en validaciones independientes de SEND→RECEIVE.
