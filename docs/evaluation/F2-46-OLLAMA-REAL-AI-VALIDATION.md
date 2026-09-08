# F2-46 — Validación controlada de evaluador IA real con Ollama

**Estado:** **EN EJECUCIÓN — INTEGRACIÓN MATERIALIZADA, VALIDACIÓN LIVE PENDIENTE**

## Propósito

F2-46 lleva el contrato de F2-45 a un proveedor/modelo real, utilizando Ollama como primera implementación concreta para evitar acoplar el dominio a un servicio comercial o a un SDK específico.

El objetivo es comprobar que un modelo real puede consumir el contrato de D2-C01 y devolver una salida normalizada y trazable sin sustituir la evidencia primaria.

## Decisión técnica

Se utiliza un adaptador `OllamaSemanticEvaluator` implementado sobre HTTP nativo. El dominio continúa dependiendo únicamente de `SemanticEvaluatorPort`.

La configuración externa controla:

- URL base de Ollama;
- modelo;
- versión o identificador operativo del modelo;
- versión del prompt;
- versión del método;
- timeout.

No se almacenan credenciales, URLs privadas ni secretos en el repositorio.

## Contrato de evaluación

La entrada mantiene `criterionId`, versión del criterio, `evidenceIds`, entrada del usuario, intención esperada versionada, respuesta observable, contexto permitido e identidad/versionado del evaluador.

La intención esperada permanece definida antes de invocar el modelo.

## Normalización

El adaptador exige una salida JSON con:

- `outcome`: `PASS`, `FAIL`, `PARTIAL`, `INCONCLUSIVE` o `NOT_EVALUABLE`;
- `justification` no vacía;
- `evidenceInsufficient` booleano.

La salida se completa con identidad/versionado del modelo, prompt, método, criterio y evidencia de entrada.

Una respuesta no JSON, un outcome desconocido o campos requeridos ausentes provocan fallo explícito del adaptador; no se transforma silenciosamente en PASS/FAIL.

## Control experimental

El spike live define un caso alineado de D2-C01 con intención explícita y respuesta observable. La ejecución real se habilita únicamente con `F2_46_LIVE_AI=true` y configuración externa del modelo Ollama.

La prueba no se ejecuta de forma implícita en CI sin un modelo configurado, evitando falsos verdes derivados de omitir la integración real.

La validación live deberá repetir el mismo caso bajo configuración idéntica y conservar todas las respuestas, metadatos y resultados para caracterizar estabilidad y variabilidad.

## Interpretación

F2-46 no considera que una sola respuesta PASS demuestre calidad del producto. La evidencia de esta fase sirve para evaluar la aptitud del instrumento real respecto del contrato.

Un comportamiento variable deberá conservarse como observación metodológica y conducir a `REQUIRES_REFINEMENT` o `INSUFFICIENT_EVIDENCE` según el protocolo, no ocultarse mediante promedios.

## Criterio de salida

F2-46 podrá cerrarse cuando exista evidencia live suficiente para demostrar, como mínimo:

1. conexión reproducible al proveedor/modelo configurado;
2. cumplimiento del contrato de entrada;
3. salida estructurada y normalizada;
4. trazabilidad de modelo, prompt, método, criterio y evidencia;
5. diferenciación controlada de evidencia suficiente e insuficiente;
6. repeticiones bajo condiciones idénticas y caracterización de su estabilidad;
7. ausencia de acoplamiento del dominio al proveedor.

## Límites

Esta fase no introduce scoring global, ponderaciones, umbrales globales, aceptación/rechazo global, inferencia autónoma de intención ni persistencia irreversible de texto generado por IA.

La selección de Ollama como primer proveedor de prueba no congela la arquitectura para proveedores futuros.

## Trazabilidad

`D2-C01 → evidencia primaria → intención esperada → SemanticEvaluatorPort → OllamaSemanticEvaluator → modelo/version → promptVersion → salida JSON → normalización → repetición → resultado metodológico`
