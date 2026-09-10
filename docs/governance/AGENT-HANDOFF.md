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

## Reglas para cualquier agente nuevo

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
