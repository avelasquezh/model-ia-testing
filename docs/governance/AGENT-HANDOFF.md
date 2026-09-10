# Agent Handoff — Objetivo operativo del MVP

**Propósito:** mantener continuidad entre agentes y evitar cambios de dirección durante la implementación del MVP.

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

La batería Adaptive y el CI están operativos, pero la validación pública todavía no demuestra conversación verificada de forma consistente. En la última ejecución registrada antes de este documento, `verifiedCount = 0` para el benchmark público.

Esto implica que el trabajo actual debe concentrarse en:

- reducir falsos positivos de superficies no conversacionales;
- robustecer la transición entre apertura, composer, envío y respuesta;
- detectar respuestas nuevas respecto al estado previo al envío;
- conservar la evidencia de la ruta Adaptive;
- convertir al menos una ruta pública real en `VERIFIED` antes de declarar éxito funcional.

No se debe ocultar este estado aumentando timeouts sin evidencia causal.

## Reglas para cualquier agente nuevo

Antes de modificar código, leer este archivo, `docs/governance/PROJECT-STATUS.md`, `docs/governance/PENDING-DECISIONS.md` y los documentos del flujo Adaptive relacionados.

No sustituir el objetivo por otro más cómodo, como únicamente descubrir un launcher, encontrar un formulario, identificar un iframe o producir capturas.

No introducir proveedores de IA, Ollama, scoring global u otros frentes que no sean necesarios para el objetivo conversacional actual.

No crear nuevos identificadores `F2-XX` para este trabajo. Clasificar extensiones posteriores según la gobernanza existente o como trabajo específico del MVP Adaptive.

No declarar éxito por CI verde cuando la evidencia funcional siga en `verifiedCount = 0`.

No cambiar `main` como parte de una implementación experimental. Mantener el trabajo en la rama de la iniciativa hasta contar con evidencia y quality gates satisfactorios.

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
- cuál es el siguiente incremento directamente relacionado con P0/P1.

Este documento funciona como handoff operativo y complemento de los ADR y requisitos normativos; no los reemplaza.
