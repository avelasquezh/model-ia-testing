# F2-43 — Protocolo controlado de retención de contexto conversacional

**Estado:** **CERRADO / VALIDADO**

## Propósito

F2-43 define y valida empíricamente D3-C01, cuya propiedad objetivo es la retención de contexto entre turnos.

La validación demuestra, sobre un doble conversacional controlado, que una información introducida en un turno puede ser recuperada de forma observable en un turno posterior, conservando la secuencia completa y la evidencia primaria necesaria para interpretar el resultado.

## Candidato

**D3-C01 — Retención de contexto conversacional**

La propiedad se evaluó mediante dependencia observable entre dos turnos relacionados.

## Diseño controlado

El escenario validado contiene:

1. **Turno de establecimiento:** `Mi color favorito es azul`.
2. **Turno de verificación:** `¿Cuál es mi color favorito?`.

El segundo input no contiene literalmente el dato `azul`, por lo que la respuesta esperada requiere recuperar información establecida en el turno anterior.

Las tres ejecuciones utilizaron el mismo escenario, versión, target lógico, configuración de interfaz, precondiciones, entradas y secuencia, con una sesión de navegador independiente por repetición.

## Evidencia primaria observada

Cada ejecución produjo:

- las dos entradas en orden;
- respuesta observable del turno de establecimiento;
- respuesta observable del turno de verificación;
- duración no negativa por turno;
- screenshot no vacío por turno;
- dos eventos `OBSERVATION` publicados mediante `ExecutionEvidencePublisher`;
- `executionId` consistente;
- `turnIndex` `[0, 1]`.

La prueba no transforma el resultado del runner en un veredicto de calidad del producto: el runner permanece en `INCONCLUSIVE`.

## Control contra coincidencia accidental

La verificación no repite literalmente el dato establecido. El doble controlado conserva el dato en estado conversacional y la respuesta de verificación lo recupera únicamente después del primer turno.

La evidencia permite distinguir la secuencia de interacción requerida para el protocolo. Esta validación no demuestra por sí sola la ausencia de todas las explicaciones alternativas en un sistema de producción.

## Repetición

Se realizaron tres ejecuciones independientes bajo las mismas condiciones.

En las tres repeticiones la segunda respuesta fue exactamente:

`Bot response: Tu color favorito es azul.`

La repetición se utiliza para observar estabilidad del mecanismo y del comportamiento observable, no para afirmar significancia estadística.

## Resultado metodológico

**Resultado: `SUPPORTED`.**

La evidencia obtenida en el doble controlado satisface el protocolo: existe relación explícita entre turnos, el segundo turno requiere el dato establecido, la secuencia y evidencia primaria quedan registradas y el comportamiento observado se repite de forma estable en tres ejecuciones.

El resultado `SUPPORTED` es metodológico y no equivale a PASS del producto ni constituye evidencia de un sistema de producción.

## Límites

F2-43 no introduce scoring global, ponderaciones, criterios críticos, umbrales globales, significancia estadística, causalidad ni evaluación semántica autónoma basada exclusivamente en IA.

## Validación técnica

La implementación se mantiene exclusivamente en el spike de navegador; no fue necesario modificar el contrato de producción `ConversationPort` ni `PlaywrightExecutionRunner`.

Validación final:

- Commit `99ab76be7d2e1349d9abd89640501cf1cdd76b18`.
- CI `34172666958` (`#309`) — **SUCCESS** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.
- Architecture Spike `34172666905` (`#477`) — **SUCCESS** en TypeScript, pruebas unitarias/arquitectura, BDD, Playwright, migraciones PostgreSQL, integración de repositorio/versionado, manifiesto de evidencia, artefactos y Quality Gate.

El primer intento de F2-43 falló únicamente por TypeScript (`TS2339`) al acceder a `turnIndex` sobre la unión `ExecutionEvidenceEvent`. Se corrigió mediante narrowing explícito a eventos `OBSERVATION`, sin relajar el compilador ni cambiar el contrato metodológico.

## Criterio de salida

F2-43 queda cerrado porque:

1. existen dos turnos relacionados por diseño;
2. la segunda verificación requiere el dato establecido;
3. la secuencia completa y la evidencia primaria quedan registradas;
4. tres repeticiones independientes muestran estabilidad;
5. las limitaciones y el carácter controlado del target están explícitamente documentados.

## Trazabilidad

`D3-C01 → Escenario multturno → Ejecuciones independientes → Secuencia completa → Evidencia primaria → Control de coincidencia → Resultado metodológico SUPPORTED`
