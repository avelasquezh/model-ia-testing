# F2-41 — Validación controlada de dimensiones y criterios candidatos

**Estado:** CERRADO / VALIDADO

## Propósito

F2-41 convierte la decisión pendiente del Frente 2 en un protocolo ejecutable para validar, mediante casos controlados, qué dimensiones y criterios candidatos son realmente observables, reproducibles e interpretables.

No aprueba automáticamente las siete dimensiones como taxonomía definitiva y no habilita scoring global.

## Matriz validada

Se cubrió un caso representativo por cada dimensión candidata D1–D7:

| Caso | Dimensión | Criterio representativo | Tipo | Evidencia primaria |
|---|---|---|---|---|
| C01 | D1 Corrección funcional observable | D1-C01 | BOOLEAN | TRANSCRIPT + INTERACTION |
| C02 | D2 Adecuación conversacional | D2-C01 | ORDINAL | TRANSCRIPT + AI_ANALYSIS |
| C03 | D3 Continuidad contextual | D3-C01 | BOOLEAN | TRANSCRIPT |
| C04 | D4 Robustez conversacional | D4-C01 | BOOLEAN | TRANSCRIPT + INTERACTION |
| C05 | D5 Seguridad observable y comportamiento responsable | D5-C01 | BOOLEAN | TRANSCRIPT |
| C06 | D6 Rendimiento conversacional observable | D6-C01 | NUMERIC | TIMING |
| C07 | D7 Calidad de interacción e interfaz | D7-C02 | BOOLEAN | DOM + INTERACTION |

Cada caso declara entrada reproducible, precondiciones, comportamiento esperado, evidencia requerida, mecanismo de observación, regla de decisión y limitaciones.

## Resultado de validación

El Architecture Spike demuestra estructuralmente que:

- las siete dimensiones candidatas están representadas;
- cada criterio contiene los elementos mínimos exigidos por `EvaluationMethodology`;
- el criterio numérico declara método de medición;
- el criterio asistido por IA conserva evidencia primaria junto con `AI_ANALYSIS`;
- la metodología permanece en estado `DRAFT`;
- no se introduce `qualityScore`, `REGRESSION` ni `IMPROVEMENT` como salida del protocolo.

La validación confirma la aptitud estructural del protocolo candidato. No constituye todavía validación empírica de comportamiento sobre un chatbot productivo; esa validación requerirá ejecuciones controladas con evidencia real del sistema bajo prueba.

## Evidencia CI

Corrección final registrada en el commit `020e9b8a638fd02fd4a881ea183a151d2cc936ec`.

CI `34171221703` (`#293`) — **SUCCESS** en:

- TypeScript;
- migraciones PostgreSQL;
- pruebas unitarias/aplicación;
- BDD;
- Playwright;
- Quality Gate.

Architecture Spike `34171221652` (`#461`) — **SUCCESS** en:

- TypeScript;
- pruebas unitarias/arquitectura;
- BDD;
- Playwright;
- migraciones PostgreSQL;
- integración de repositorio/versionado;
- manifiesto de evidencia;
- publicación de artefactos;
- Quality Gate.

## Decisión metodológica

F2-41 queda cerrado porque el protocolo candidato es ejecutable, compilable y verificable en CI/Architecture Spike, manteniendo la taxonomía en `DRAFT` y separando aptitud metodológica de calidad del producto.

La evidencia obtenida permite avanzar a una siguiente fase de validación empírica y consolidación del catálogo, pero no justifica todavía scoring global ni ponderaciones.

## Trazabilidad

`Criterio candidato → Caso controlado → Ejecución CI/Spike → Evidencia → Resultado metodológico → Decisión de siguiente versión`

## Siguiente decisión

El siguiente incremento deberá introducir validación empírica controlada sobre criterios candidatos seleccionados, con evidencia real de ejecución y repetición. Los resultados deberán distinguir soporte, refinamiento, no observabilidad e insuficiencia de evidencia sin convertirlos en juicio de calidad global.
