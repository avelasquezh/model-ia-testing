# Agent Handoff — Objetivo operativo del MVP

**Propósito:** mantener continuidad entre agentes y evitar cambios de dirección durante la implementación del MVP.

## Regla obligatoria de continuidad

`qa` es la **única rama activa de trabajo, integración y validación** mientras exista una tarea en curso. `main` es la rama estable y solo recibe cambios promovidos desde `qa` después de completar pruebas, regresión, revisión de evidencia y quality gates.

**Un agente nuevo no puede iniciar otra tarea por separado mientras exista una tarea activa en `qa`.** Debe primero leer este handoff, `PROJECT-STATUS.md`, los cambios recientes y el estado de CI; después continuará, corregirá o completará la tarea vigente sobre `qa`. No debe crear otra rama funcional para desviar el trabajo ni cambiar de frente sin una decisión explícita y documentada.

Toda tarea debe seguir:

`qa: tarea activa → cambios incrementales → pruebas/regresión → CI/quality gates → revisión de evidencia → main`

La integración de avances realizados en ramas históricas debe ser deliberada. No se permite duplicar una funcionalidad en otra rama y considerarla integrada. Un cambio solo está consolidado cuando sus commits/cambios útiles han sido incorporados a `qa`, validados y posteriormente promovidos a `main`.

Las ramas antiguas o experimentales son únicamente fuentes de recuperación histórica. Una vez reconciliadas y validadas, no deben recibir trabajo nuevo.

## Objetivo vigente

El producto debe recibir una **URL pública arbitraria** y, sin depender de locators específicos del sitio ni de una UI propia del producto, ser capaz de:

`URL → descubrir chat → abrir chat → localizar composer → enviar "Hello" → confirmar envío → observar nueva respuesta → confirmar recepción → VERIFIED`

La evidencia observable de esa interacción es el criterio funcional principal del MVP.

## Modelo Adaptive vigente

`Adaptive` es el modelo prioritario para descubrimiento sobre sitios públicos desconocidos. Debe explorar dinámicamente el DOM y sus contextos de ejecución (Page/Frame), generar y puntuar candidatos, probar rutas de apertura y reevaluar el estado después de cada acción.

Adaptive **no** debe convertirse en una colección de reglas específicas por sitio. Las heurísticas y señales pueden evolucionar, pero deben seguir siendo generalizables.

Una ruta solo puede considerarse una superficie conversacional válida cuando existe evidencia suficiente de un flujo interactivo. Encontrar un botón, formulario, buscador, registro, soporte o texto relacionado con "chat" no equivale a haber encontrado un chatbot.

## Criterio de aceptación funcional

El estado `CHAT_SURFACE_FOUND` o `CANDIDATE_FOUND` no constituye éxito del MVP.

El éxito funcional requiere una verificación end-to-end reproducible:

1. La URL carga.
2. Adaptive identifica una superficie candidata.
3. La ruta de apertura lleva a una interfaz conversacional real.
4. Se identifica una entrada de mensaje utilizable.
5. Se ejecuta el envío de `Hello`.
6. Existe evidencia de que el mensaje fue enviado.
7. Aparece una respuesta nueva posterior al envío.
8. Existe evidencia de recepción de esa respuesta.
9. La ejecución termina como `VERIFIED` y conserva evidencia suficiente para auditar la ruta.

Un incremento que solo mejora discovery pero deja `verifiedCount = 0` no debe presentarse como cierre funcional del MVP.

## Legacy vs Adaptive

`Legacy` es la baseline determinista/heurística de comparación.

`Adaptive` es la vía de evolución del MVP. La comparación debe usar, cuando corresponda, el mismo corpus y el mismo criterio funcional para no confundir mayor detección con mejor interacción.

Métricas de discovery sirven para diagnosticar. La métrica funcional prioritaria es la capacidad de completar la conversación verificable.

## Estado conocido al iniciar este handoff

La batería Adaptive y el CI están operativos, pero la validación pública todavía no demuestra conversación verificada de forma consistente. La última ejecución estable antes de este handoff registró `verifiedCount = 0` para el benchmark público.

El trabajo activo continúa concentrado en P0/P1: reducir falsos positivos, mantener composer/send/response en el mismo contexto conversacional, tolerar frames dinámicos y detectar una respuesta nueva posterior al envío.

No se debe ocultar este estado aumentando timeouts sin evidencia causal.

## Plan vigente de descubrimiento e interacción (hoja de ruta)

Este plan define la dirección estratégica del frente Adaptive. No reemplaza el objetivo vigente ni el criterio de aceptación funcional de arriba; los organiza en incrementos concretos. Cualquier agente que continúe este trabajo debe ubicar en qué punto de esta hoja de ruta está antes de proponer un cambio de dirección.

**Principio rector:** descubrir el chat y confirmar la conversación son dos problemas distintos que deben resolverse con evidencia de naturaleza distinta. Descubrimiento y apertura siguen siendo un problema de DOM/visual (posición, z-index, iconografía, comportamiento al click). Confirmación de envío/recepción no debe depender solo del DOM — debe apoyarse también en tráfico de red observado (WebSocket/xhr/fetch), porque la mayoría de los chatbots modernos entregan la respuesta por esa vía y no solo por mutación visual del DOM.

1. **Embudo de descubrimiento en tres pasadas** (de más barata/confiable a más costosa/especulativa):
   - Pasada 1 — huella de proveedor conocido (Intercom, Drift, Zendesk, Tawk.to, Crisp, LiveChat, Freshchat, HubSpot, Salesforce...): dominios de script/iframe, variables globales inyectadas, IDs de contenedor predecibles. Da velocidad y cobertura inmediata para la mayoría del mercado real. **No implementado todavía** — es el siguiente incremento de mayor apalancamiento si `verifiedCount` sigue en 0 tras confirmar el punto 3.
   - Pasada 2 — heurística posicional/visual cuando no hay huella conocida (`position: fixed`/`sticky`, esquina inferior derecha, tamaño de botón circular 40–80px, z-index alto, iconografía SVG de burbuja de diálogo). Ya cubierto en gran parte por el discovery Adaptive existente.
   - Pasada 3 — interacción exploratoria controlada solo sobre los candidatos mejor puntuados de la pasada 2: diff de DOM antes/después del click, y verificación de que apareció un `role="dialog"` o un contenedor `aria-live`/`role="log"`/`role="status"` (señal semántica de que hay mensajes que se anuncian, no solo un menú o acordeón).

2. **Diferenciar chat real de formulario/buscador/registro:** la señal confiable es estructura conversacional (turnos alternados usuario/bot + input de texto libre + control de envío), no la presencia de la palabra "chat" en el DOM. Sigue siendo un riesgo activo de falso positivo mencionado en este handoff (`CHAT_SURFACE_FOUND` no es éxito).

3. **Confirmación de envío/recepción robusta a streaming — EN PROGRESO.** Incremento aplicado en los commits `094cf97`/`17c7051` sobre `qa`: `PlaywrightConversationUi` ahora escucha frames de WebSocket y respuestas `xhr`/`fetch` a nivel de página, y no acepta un texto del DOM como respuesta final mientras haya tráfico de red entrante activo asociado al envío (streaming/SSE/WS). CI confirmado en verde (`34547022795`/`34547022667` sobre `17c7051`); ver el detalle completo, incluyendo qué NO queda confirmado por este CI (si `verifiedCount` subió contra los targets reales), en `PROJECT-STATUS.md`. **Siguiente acción de este punto:** inspeccionar el artifact `public-sut-locator-candidate-registry-*` de la corrida `34547022795` (o la más reciente en `qa`) para ver si algún target alcanzó `VERIFIED`; si ninguno lo alcanza, el cuello de botella probablemente está en discovery/apertura (puntos 1–2), no en send/receive.

4. **Impedimentos — clasificar, no resolver, y convertirlos en hallazgo de negocio:**
   - Captcha: detectar por huella conocida (reCAPTCHA, hCaptcha, Cloudflare Turnstile), marcar `BLOCKED_CAPTCHA` (ya existe como valor de `executionFailureReason` en `ChatDiscoveryReport.ts`) y continuar con el siguiente candidato. No intentar resolverlo.
   - Formulario de pre-chat (nombre/email antes de escribir): completar con un perfil sintético reutilizable y continuar; registrar cuántos campos exige como métrica de fricción.
   - Modales anidados: restringir la búsqueda de candidatos al contexto de apilamiento activo (el `role="dialog"` de mayor z-index abierto), sin expandir a selectores globales de la página — coherente con la regla ya vigente en este handoff.
   - Shadow DOM/iframes/frameworks distintos: recorrer documento principal, iframes y shadow roots como nodos de un mismo grafo recorrido de forma recursiva y uniforme, no como reglas por sitio.

5. **Cache de patrones aprendidos (velocidad e iterabilidad):** cuando una ruta llegue a `VERIFIED`, conservar la huella de cómo se abrió y dónde vivía el composer como prior de scoring reutilizable (no como regla dura por dominio). Esto es lo que sostiene, a mediano plazo, el modelo de negocio (analizar el chatbot de un sitio y venderle retroalimentación al dueño): cuantos más sitios se analizan, más rápido y barato se vuelve analizar el siguiente. **No implementado todavía** — depende de que exista al menos una ruta `VERIFIED` real de la que aprender.

Ningún punto de esta hoja de ruta autoriza a saltarse el orden de prioridad P0/P1 ya definido, ni a declarar cierre del punto 3 sin la evidencia pendiente descrita ahí mismo.

## Estado de continuidad — commits `094cf97` / `17c7051` (rama `qa`)

- **Demostrado:** el incremento de guardia de red para send/receive (punto 3 de la hoja de ruta) compila, pasa lint, no rompe ningún test existente, y el pipeline completo de CI (unit tests, Playwright E2E, BDD, quality gate, discovery público contra 4 targets) corre en verde sobre `17c7051`.
- **Continúa sin demostrarse:** que este incremento haya elevado `verifiedCount` por encima de 0 contra alguno de los targets públicos reales configurados en CI. No se pudo inspeccionar el contenido de los artifacts de esa corrida desde el entorno donde se hizo este trabajo (sin acceso de red a `blob.core.windows.net`, dominio de descarga de artifacts/logs de GitHub Actions).
- **Evidencia:** CI `34547022795` (success) y Architecture Spike `34547022667` (success) sobre `17c7051`; corrida previa `34545786139` (failure) sobre `094cf97` con el detalle del fallo y su corrección documentados en `PROJECT-STATUS.md`.
- **Siguiente acción de la tarea activa:** descargar/inspeccionar `public-sut-locator-candidate-registry-*` de la corrida más reciente en `qa` para confirmar el estado final por target. Si `verifiedCount` sigue en 0, el siguiente incremento de mayor apalancamiento es la Pasada 1 de la hoja de ruta (huella de proveedores conocidos), no seguir ajustando la guardia de red ya aplicada.

## Incidente de gobernanza — reset de `qa` a `f8dddd3`, commit de recuperación `8c4413e`

Después de `17c7051`, otro agente aplicó **15 commits seguidos a `qa` sin actualizar `PROJECT-STATUS.md` ni este archivo en ninguno de ellos**, dejando la punta de la rama rota (`CI`/`Architecture Spike`/`Discovery QA Stages` en `failure`). Esto viola directamente la regla obligatoria de continuidad al inicio de este documento. Se revirtió `qa` (con force-push) al último commit verde conocido, `f8dddd3`, tras respaldar la punta rota completa en la rama `qa-broken-backup-79e5634` (no se perdió nada). Se diagnosticó la causa raíz real del quiebre — un bug de aserción en un test nuevo, verificado ejecutando la función real, no solo por lectura de código — y se reaplicó selectivamente lo que valía la pena, corregido. **Detalle completo, con la evidencia exacta, en `PROJECT-STATUS.md` → "Incidente de recuperación".**

**Regla derivada de este incidente, para cualquier agente futuro:** ningún commit se considera aceptable sin (a) haber corrido `npm run build` y `lint` localmente antes de subirlo, y (b) haber actualizado el estado verificable en `PROJECT-STATUS.md` en el mismo commit o inmediatamente después. Apilar commits sobre una punta que no se sabe si está verde, sin dejar rastro documentado de la intención de cada uno, es exactamente el patrón que causó este incidente.



Antes de modificar código, leer este archivo, `docs/governance/PROJECT-STATUS.md`, `docs/governance/PENDING-DECISIONS.md` y los documentos del flujo Adaptive relacionados.

No sustituir el objetivo por otro más cómodo, como únicamente descubrir un launcher, encontrar un formulario, identificar un iframe o producir capturas.

No introducir proveedores de IA, Ollama, scoring global u otros frentes que no sean necesarios para el objetivo conversacional actual.

No crear nuevos identificadores `F2-XX` para este trabajo. Clasificar extensiones posteriores según la gobernanza existente o como trabajo específico del MVP Adaptive.

No declarar éxito por CI verde cuando la evidencia funcional siga en `verifiedCount = 0`.

No modificar `main` directamente durante una tarea experimental o de validación.

No crear una segunda tarea funcional mientras exista una tarea activa en `qa`.

No ampliar la observación de respuestas a locators globales de la página cuando la conversación ya fue localizada dentro de un frame; la evidencia debe permanecer dentro de la superficie conversacional seleccionada.

## Gobierno de ramas

`qa` es la **fuente única de verdad para la tarea activa**. Todos los agentes que continúen el trabajo deben operar sobre esta rama hasta que el objetivo quede validado o se documente formalmente un cambio de alcance.

`main` recibe únicamente cambios ya validados desde `qa`. Un merge a `main` no sustituye la obligación de conservar la continuidad de la tarea en `qa` hasta que el incremento esté realmente terminado.

Las ramas históricas se pueden consultar para recuperar cambios concretos, pero no deben convertirse nuevamente en líneas de desarrollo paralelas.

## Orden de prioridad

**P0:** conversación pública verificable.

**P1:** robustez generalizable del descubrimiento y de la interacción Adaptive.

**P2:** comparación objetiva Legacy vs Adaptive.

**P3:** mejoras metodológicas no necesarias para el flujo conversacional.

Las decisiones de menor prioridad no deben desplazar P0/P1.

## Condición de continuidad

Cada agente debe terminar dejando explícito:

- qué parte del flujo end-to-end está demostrada;
- qué parte continúa fallando;
- qué evidencia respalda esa conclusión;
- cuál es la siguiente acción de la tarea activa en `qa`.

Si la tarea continúa abierta, el siguiente agente debe continuarla; no debe sustituirla por otra tarea independiente.

Este documento funciona como handoff operativo y complemento de los ADR y requisitos normativos; no los reemplaza.
