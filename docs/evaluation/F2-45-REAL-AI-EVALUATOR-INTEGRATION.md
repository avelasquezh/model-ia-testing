# F2-45 — Integración controlada de evaluador semántico IA real

**Estado:** **EN EJECUCIÓN — FRONTERA HTTP MATERIALIZADA**

## Propósito

F2-45 lleva F2-44 desde un doble controlado hacia una frontera de integración capaz de recibir un evaluador IA real sin acoplar el dominio a un proveedor concreto.

La primera decisión del incremento es separar el contrato metodológico del mecanismo de transporte o proveedor. La validación con un modelo real queda condicionada a una ejecución posterior con credenciales y entorno controlados; esta fase no declara validado ningún proveedor.

## Resultado objetivo

Demostrar que un evaluador IA real puede conectarse mediante `SemanticEvaluatorPort` y producir una salida normalizada compatible con F2-44 conservando:

- evidencia primaria y sus identificadores;
- intención esperada previamente definida;
- respuesta observable;
- contexto permitido;
- identidad y versión del modelo;
- versión del prompt y del método;
- resultado ordinal y justificación;
- insuficiencia explícita de evidencia.

## Límite arquitectónico

El dominio no conocerá SDKs, nombres de proveedores, formatos propietarios ni credenciales.

La dependencia admitida será únicamente el contrato `SemanticEvaluatorPort`. Un adaptador de infraestructura podrá transformar una solicitud normalizada al protocolo de un proveedor y transformar posteriormente la respuesta al contrato interno.

## Estado actual

Se materializó:

- `src/domain/evaluation/SemanticEvaluator.ts` con entrada y salida normalizadas y `SemanticEvaluatorPort`;
- `src/infrastructure/evaluation/HttpSemanticEvaluatorAdapter.ts` como frontera HTTP de infraestructura;
- `spike/evaluation/f2-45-semantic-evaluator-port.test.ts` con validación del límite provider-neutral;
- `spike/evaluation/f2-45-http-semantic-evaluator-adapter.test.ts` con transporte simulado, normalización y errores HTTP;
- separación explícita entre evidencia primaria y salida del evaluador;
- conservación de procedencia de modelo, prompt, método, criterio y evidencia.

El adaptador HTTP no contiene conocimiento de un proveedor concreto. El mapeo de una respuesta externa se inyecta mediante `SemanticEvaluatorResponseMapper`, y las credenciales se suministran externamente mediante headers. Esta materialización todavía no constituye evidencia de comportamiento de un modelo IA real.

## Próxima prueba controlada

La siguiente ejecución de F2-45 deberá usar un proveedor/modelo real en un entorno controlado y registrar como mínimo:

1. identidad y versión del proveedor/modelo;
2. prompt/plantilla versionada;
3. parámetros relevantes de generación, si existen;
4. mismo conjunto de casos alineado, no alineado y ambiguo de F2-44;
5. repetición bajo condiciones metodológicas equivalentes;
6. respuesta normalizada del adaptador;
7. evidencia primaria vinculada;
8. cualquier error de transporte, límite o validación de esquema.

No se deberá introducir scoring global ni convertir la salida del modelo en un veredicto global del producto.

## Criterio de salida de F2-45

F2-45 podrá considerarse validado cuando un proveedor real pueda conectarse mediante el puerto sin contaminar el dominio y las repeticiones controladas permitan clasificar su comportamiento como `SUPPORTED`, `REQUIRES_REFINEMENT`, `NOT_OBSERVABLE` o `INSUFFICIENT_EVIDENCE` conforme a F2-44.

Hasta entonces, el incremento permanece abierto.
