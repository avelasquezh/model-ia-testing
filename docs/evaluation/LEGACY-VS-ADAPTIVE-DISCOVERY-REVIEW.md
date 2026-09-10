# Legacy vs Adaptive — revisión técnica de descubrimiento conversacional

**Estado:** REVISIÓN TÉCNICA INTERMEDIA — INTEGRACIÓN FUNCIONAL IMPLEMENTADA, VALIDACIÓN PÚBLICA PENDIENTE  
**Producto:** `0.1.0`  
**Rama:** `feat/adaptive-discovery-parallel`  
**PR:** `#21`  
**Head revisado:** `024aa90384e73818506fca2a74e2f9c5af3e79d4`  
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
- `DOM_MUTATION`: declarado en el tipo de estrategia; la implementación observable actual usa snapshots antes/después y su diff, no un `MutationObserver`.

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

## 8. Estado funcional

La etapa que faltaba ya está implementada como una fase separada de verificación Adaptive.

Después de un `CHAT_SURFACE_FOUND`, el sistema:

1. captura `chat-opened.png`;
2. reutiliza `PlaywrightChatDiscovery` para resolver composer, send y response en la superficie ya abierta;
3. reutiliza `PlaywrightConversationUi` para enviar un mensaje no destructivo;
4. espera una respuesta nueva y estable;
5. captura `response-received.png`;
6. registra `send`, `receive` y `conversation` como `CONFIRMED`/`VERIFIED` o `FAILED`.

El nuevo CLI es:

`npm run browser:discovery:interaction`

La salida machine-readable queda en:

`artifacts/browser-sut/adaptive-interaction-benchmark.json`

Las capturas quedan bajo:

`artifacts/browser-sut/adaptive-interaction/<targetId>/`

La integración evita duplicar el motor de conversación existente y mantiene Legacy sin modificaciones funcionales.

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

El nuevo benchmark de interacción produce evidencia funcional independiente, pero la matriz TP/FP/TN/FN del corpus completo sigue pendiente de etiquetado operacional de `expectedChat`.

## 10. Evidencia empírica disponible

La ejecución pública anterior de 23 objetivos produjo:

- Legacy: `CHAT_SURFACE_FOUND = 5/23`, discovery rate `21.7%`.
- Adaptive: `CHAT_SURFACE_FOUND = 6/23`, discovery rate `26.1%`.
- Adaptive: `CANDIDATE_FOUND = 12/23`.
- Adaptive: `NOT_FOUND = 11/23`.

Estos resultados demuestran una mejora de cobertura de descubrimiento en esa ejecución, pero no deben interpretarse como superioridad funcional porque SEND → RECEIVE no se había ejecutado todavía en ese benchmark.

La nueva etapa de interacción y screenshots está implementada y tiene fixture automatizado. La validación pública de esa etapa requiere completar la ejecución CI que se disparó con la integración.

## 11. Problemas técnicos todavía abiertos

### P1 — restauración de estado limitada

Después de un click que modifica el DOM sin cambiar la URL, `restoreAfterExperiment` no reconstruye la página. El estado mutado puede afectar experimentos posteriores.

### P2 — locators recolectados antes de experimentar

Los candidatos se recolectan una sola vez. Después de una mutación importante del DOM, un locator basado en posición puede resolver un elemento diferente o quedar obsoleto.

### P3 — cobertura de clickables limitada

La consulta actual es `button, [role="button"]`, no un modelo completo de elementos activables.

### P4 — threshold de alta confianza todavía no interviene en la selección

`highConfidenceThreshold` se propaga desde configuración, pero el runner actualmente no usa ese valor para modificar el resultado. El ranking sí usa el score.

### P5 — validación pública SEND→RECEIVE pendiente

La capacidad ya está implementada, pero todavía no existe evidencia CI pública cerrada que demuestre qué porcentaje de los seis `CHAT_SURFACE_FOUND` puede completar una conversación y conservar screenshots.

## 12. Estado frente al objetivo del MVP

La comparación Legacy vs Adaptive ya está materializada como arquitectura experimental independiente.

Adaptive ya puede:

- explorar controles;
- priorizarlos por evidencia;
- evitar controles peligrosos conocidos;
- comparar interfaz antes/después;
- detectar señales de una superficie conversacional;
- conservar trazas de cada experimento;
- ejecutar la fase posterior de composer/send/response;
- confirmar SEND → RECEIVE con evidencia visual;
- ejecutarse en paralelo con Legacy en contextos aislados.

Lo que todavía no debe declararse cerrado es la validación empírica a escala del corpus.

## 13. Criterio para el siguiente incremento

No se debe calibrar todavía el scoring por resultados no verificados.

Primero se debe ejecutar la nueva batería pública y revisar:

`CHAT_SURFACE_FOUND -> interaction.execution.conversation -> screenshots`

Después:

1. identificar los casos `VERIFIED`;
2. clasificar los `FAILED` por causa técnica;
3. revisar las capturas reales;
4. construir el etiquetado `expectedChat` y `functionalValidation`;
5. calcular TP/FP/TN/FN, precisión, recall y FPR.

Solo después de esa evidencia se debe decidir si ampliar la cobertura de clickables, corregir restauración de estado o recalibrar scoring.

## 14. Conclusión

Adaptive no es un segundo LLM evaluator ni una variante del análisis semántico. Es un motor experimental de descubrimiento web que usa interacción controlada y cambios observables del DOM/UI para encontrar una superficie conversacional desconocida.

Legacy sigue siendo el control estable.

La nueva etapa funcional permite llevar Adaptive desde:

`descubrimiento de superficie`

hasta:

`composer -> send -> response -> SEND/RECEIVE VERIFIED -> evidencia visual`

La implementación está presente; el cierre metodológico depende ahora de la ejecución pública y de la evidencia resultante. 
