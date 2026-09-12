# Adaptive v2 — Network-Correlated Conversation Verification

**Estado:** EXPERIMENTO EN QA  
**Producto:** `0.1.0`  
**Base:** `qa` sobre `a8d1cd71d8f3f4bc97e29aed7e8bf6acc540bf2f`  
**Fecha:** 2026-09-10

## Objetivo

Introducir un tercer modelo experimental en paralelo a `LEGACY` y `ADAPTIVE`, sin modificar su comportamiento existente.

La hipótesis es que el principal cuello de botella actual está después del descubrimiento: una interfaz puede haber abierto correctamente un chat aunque `SEND -> RECEIVE` no sea observable de forma fiable únicamente mediante DOM.

## Modelos comparados

- `LEGACY`: descubrimiento dirigido existente.
- `ADAPTIVE`: descubrimiento experimental DOM/UI existente.
- `ADAPTIVE_V2_NETWORK`: usa el mismo descubrimiento Adaptive como control de apertura y añade observación de red durante la conversación.

Esta primera fase cambia deliberadamente solo la evidencia de conversación. Así se puede medir si la señal de red aporta valor sin mezclar simultáneamente cambios de scoring, Shadow DOM, fingerprints o heurísticas de nuevos clickables.

## Evidencia de red

Se observan eventos Playwright de:

- `request` / `response` para HTTP;
- `websocket` y sus frames;
- tráfico que ocurre después del inicio del intento de envío.

La observación es metadata-first. No se persisten cuerpos completos ni credenciales. Cuando existe payload textual, se conserva únicamente una representación truncada y saneada para correlación experimental.

Las señales se normalizan como:

- `NETWORK_OUTBOUND_MESSAGE_CANDIDATE`;
- `NETWORK_INBOUND_RESPONSE_CANDIDATE`.

Un evento de red por sí solo no equivale a `VERIFIED`.

## Correlación

La verificación usa orden temporal:

`SEND(t0) -> outbound(t1) -> inbound(t2)`

junto con evidencia de UI cuando esté disponible:

`user message visible + new response visible`.

El resultado `VERIFIED` requiere evidencia funcional suficiente; una petición HTTP genérica, heartbeat, analytics o conexión WebSocket no se considera conversación.

## Comparabilidad

Los tres modelos deben ejecutarse con:

- el mismo corpus;
- la misma URL por objetivo;
- contexto Playwright independiente;
- mismo timeout de navegación;
- mismo mensaje no destructivo;
- métricas separadas por etapa.

Métricas mínimas:

`discovery -> chat open -> composer -> send -> outbound -> inbound -> receive -> verified`

Métrica primaria:

`VERIFIED / objetivos evaluables`

Métricas secundarias:

- tasa de descubrimiento;
- tasa de apertura;
- tasa de composer;
- tasa de envío;
- tasa de evidencia outbound;
- tasa de evidencia inbound;
- tasa de recepción UI;
- tiempo por etapa;
- causa de fallo.

## Regla de no contaminación

`LEGACY` y `ADAPTIVE` no se modifican para este experimento.

`ADAPTIVE_V2_NETWORK` vive en archivos, tipos, script y artefactos propios. No cambia scoring, thresholds, locators ni reglas de Legacy/Adaptive.

El experimento no puede declararse superior por encontrar más tráfico de red. Solo una mejora reproducible de `VERIFIED` sobre el mismo corpus puede justificar evolución posterior.

## Criterio de decisión

- **Promover hipótesis:** evidencia reproducible de `VERIFIED` adicional o más estable sin introducir reglas específicas por sitio.
- **Ajustar:** la red aporta señales pero la correlación es insuficiente o genera falsos positivos.
- **Reconsiderar:** no mejora `SEND -> RECEIVE -> VERIFIED` en objetivos donde los modelos actuales llegan a conversación, o requiere excepciones específicas por proveedor/sitio.

## Alcance de esta primera implementación

Se implementa únicamente la capa de observación y correlación de red sobre el flujo Adaptive existente.

No se implementan todavía:

- fingerprints de proveedores como reglas duras;
- recorrido recursivo de Shadow DOM;
- expansión general de todos los elementos clickeables;
- cache de patrones aprendidos;
- recalibración del scoring Adaptive.

Esas variables quedan aisladas para experimentos posteriores y no deben mezclarse con la primera medición de esta hipótesis.
