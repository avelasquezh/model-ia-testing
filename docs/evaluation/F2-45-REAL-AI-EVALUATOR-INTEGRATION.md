# F2-VAL-05 — Validación controlada de evaluador semántico IA real

**Estado:** **EN EJECUCIÓN — ARNÉS CONTROLADO MATERIALIZADO**

## Propósito

F2-VAL-05 valida comportamiento semántico observable de un evaluador IA real conectado mediante `SemanticEvaluatorPort`, sin acoplar el dominio a un proveedor concreto.

La validación separa tres niveles: contrato metodológico, integración/transporte y comportamiento observado del evaluador. Solo el tercer nivel aporta evidencia para cerrar este incremento.

## Límite arquitectónico

El dominio depende únicamente de `SemanticEvaluatorPort`. No conoce SDKs, formatos propietarios, credenciales ni detalles de infraestructura externa.

La integración utiliza `HttpSemanticEvaluatorAdapter`. El endpoint externo debe entregar la salida normalizada definida por el contrato interno o estar respaldado por una capa externa que realice ese mapeo.

## Arnés controlado

Se materializó `scripts/run-live-semantic-evaluator.ts`, ejecutable mediante `npm run evaluation:semantic:live`.

El arnés:

- ejecuta tres casos semánticos de D2-C01: alineado, no alineado y ambiguo;
- ejecuta cada caso en un número configurable de repeticiones, por defecto tres;
- verifica identidad de criterio y versión;
- verifica identidad y versión del modelo;
- verifica versión de prompt y método;
- verifica identidad de evidencia;
- valida el resultado contra `EvaluationMethodology`;
- informa si cada caso conserva el mismo resultado ordinal entre repeticiones;
- falla explícitamente ante respuestas incompatibles con el contrato.

Variables operativas:

- `SEMANTIC_EVALUATOR_ENDPOINT` — obligatorio;
- `SEMANTIC_EVALUATOR_AUTHORIZATION` — opcional, externo al repositorio;
- `SEMANTIC_EVALUATOR_MODEL_ID`;
- `SEMANTIC_EVALUATOR_MODEL_VERSION`;
- `SEMANTIC_EVALUATOR_PROMPT_VERSION`;
- `SEMANTIC_EVALUATOR_METHOD_VERSION`;
- `SEMANTIC_EVALUATOR_REPETITIONS` — opcional, por defecto `3`.

No se almacenan credenciales ni secretos en Git.

## Matriz de validación

| Caso | Propósito | Evidencia esperada |
|---|---|---|
| D2-C01-1 | Respuesta alineada con la intención | Resultado ordinal consistente |
| D2-C01-2 | Respuesta no alineada con la intención | Resultado ordinal consistente |
| D2-C01-3 | Evidencia ambigua o insuficiente | Resultado ordinal consistente y/o `evidenceInsufficient=true` cuando corresponda |

Cada caso se repite bajo condiciones metodológicas equivalentes. La repetibilidad se registra descriptivamente y no se transforma en score global.

## Evidencia requerida para cerrar F2-VAL-05

La ejecución real debe conservar:

1. identidad y versión del modelo evaluador;
2. versión de prompt y método;
3. parámetros relevantes de generación, si existen;
4. entrada, expectativa y respuesta observable de cada caso;
5. salida normalizada del evaluador;
6. evidencia primaria vinculada;
7. resultado de cada repetición;
8. errores de transporte, límite o esquema, si ocurren;
9. fecha/identificador de ejecución suficiente para reconstruir la prueba.

## Criterio de salida

F2-VAL-05 podrá cerrarse cuando exista una ejecución real reproducible del conjunto controlado, con procedencia completa, contrato válido y resultados observables suficientes para clasificar el comportamiento conforme al protocolo metodológico vigente.

La existencia o ejecución del arnés por sí sola no constituye evidencia de comportamiento IA real.

No se introduce scoring global, ponderación ni aceptación/rechazo global del producto.
