# F2-42 — Validación empírica controlada de criterios candidatos

**Estado:** **CERRADO / VALIDADO**

## Propósito

F2-42 extiende F2-41 desde la aptitud estructural del protocolo hacia evidencia empírica obtenida mediante ejecución repetida sobre un target conversacional controlado.

La finalidad fue comprobar si criterios candidatos seleccionados pueden observarse y reproducirse mediante evidencia real de ejecución, sin convertir el resultado en una evaluación global de calidad.

## Alcance empírico

El target controlado permite validar directamente tres candidatos:

- D1-C01 — respuesta funcional esperada;
- D6-C01 — tiempo hasta respuesta observable;
- D7-C02 — entrada de mensaje utilizable.

D3-C01 se excluyó porque el target utilizado no conserva contexto conversacional entre turnos. D2-C01 permanece fuera por depender de un método de comparación semántica asistida por IA que sigue metodológicamente abierto. D4 y D5 requieren protocolos específicos adicionales.

## Diseño controlado

Cada ejecución utilizó:

- el mismo escenario y versión;
- el mismo target controlado;
- la misma configuración de interfaz;
- la misma entrada reproducible;
- las mismas precondiciones;
- las mismas reglas metodológicas;
- la misma versión de producto del target controlado.

Se ejecutaron tres repeticiones independientes. La repetición se utilizó para verificar estabilidad del mecanismo de observación, no para establecer significancia estadística.

## Evidencia primaria

Cada repetición generó y verificó evidencia observable mediante el runner y `ExecutionEvidencePublisher`, incluyendo respuesta, duración y screenshot. Se comprobó la correspondencia entre la evidencia y el `ExecutionId` de cada ejecución.

La evidencia primaria permaneció separada de cualquier interpretación posterior.

## Resultado metodológico

Bajo el protocolo ejecutado, D1-C01 y D7-C02 resultaron reproduciblemente observables y D6-C01 resultó medible mediante la evidencia capturada.

La ejecución no produjo un juicio de calidad del chatbot. El estado del runner continuó siendo `INCONCLUSIVE`, coherente con la separación entre ejecución/observación y evaluación metodológica.

Estas etiquetas metodológicas no significan PASS/FAIL del chatbot:

- `SUPPORTED`: evidencia reproducible y suficiente bajo el protocolo;
- `REQUIRES_REFINEMENT`: observable, pero con ambigüedad o limitaciones que requieren ajustar el criterio;
- `NOT_OBSERVABLE`: el mecanismo no permite verificar la propiedad desde el exterior;
- `INSUFFICIENT_EVIDENCE`: el mecanismo existe, pero las ejecuciones no permiten una conclusión metodológica suficiente.

## Evidencia de validación

La validación final quedó registrada sobre el commit `6e82f308181c230fe6ad1da4798d67041ba1b5a6`.

- CI `34171940346` (`#302`) — **SUCCESS** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.
- Architecture Spike `34171940304` (`#470`) — **SUCCESS** en TypeScript, pruebas unitarias/arquitectura, BDD, Playwright, migraciones PostgreSQL, integración de repositorio/versioning, manifiesto de evidencia, publicación de artefactos y Quality Gate.

El primer intento de validación de esta implementación falló únicamente por `TS18048` sobre el acceso a `result.observations`, debido al modo estricto de TypeScript. La corrección consistió en estrechar explícitamente la observación primaria y no modificó el contrato metodológico.

## Criterio de salida

F2-42 se considera validado porque los casos seleccionados completaron ejecuciones repetidas bajo las mismas condiciones, la evidencia primaria fue capturada y la estabilidad del mecanismo de observación se demostró sin introducir inferencias internas ni juicios globales de calidad.

La evidencia debe interpretarse como validación empírica sobre un doble controlado representativo, no como evidencia de comportamiento de un sistema conversacional de producción.

## Límites

F2-42 no introduce scoring global, ponderaciones, criterios críticos, umbrales globales, reglas de parada, causalidad, significancia estadística ni evaluación semántica autónoma basada exclusivamente en IA.

## Trazabilidad

`Criterio candidato → Escenario controlado → Ejecución repetida → Evidencia primaria → Clasificación metodológica → Decisión de catálogo`
