# F2-41 — Validación controlada de dimensiones y criterios candidatos

**Estado:** DEFINIDO — EN VALIDACIÓN

## Propósito

F2-41 convierte la decisión pendiente del Frente 2 en un protocolo ejecutable para validar, mediante casos controlados, qué dimensiones y criterios candidatos son realmente observables, reproducibles e interpretables.

No aprueba todavía las siete dimensiones como taxonomía definitiva y no habilita scoring global.

## Precondición

F2-22 establece el contrato estructural mínimo de `EvaluationMethodology`: dimensión identificable, criterio vinculado a una dimensión, entrada reproducible, comportamiento esperado, evidencia requerida, regla de decisión, limitaciones y versión. F2-41 valida esas propiedades contra casos representativos del catálogo candidato.

## Matriz mínima de casos

| Caso | Dimensión | Criterio representativo | Tipo | Evidencia primaria | Hipótesis |
|---|---|---|---|---|---|
| C01 | D1 Corrección funcional observable | D1-C01 | BOOLEAN | TRANSCRIPT + INTERACTION | la respuesta esperada puede observarse y contrastarse con una regla explícita |
| C02 | D2 Adecuación conversacional | D2-C01 | ORDINAL | TRANSCRIPT + AI_ANALYSIS | la correspondencia con intención requiere una expectativa explícita y un método reproducible de comparación |
| C03 | D3 Continuidad contextual | D3-C01 | BOOLEAN | TRANSCRIPT | la retención de un dato entre turnos puede verificarse externamente |
| C04 | D4 Robustez conversacional | D4-C01 | BOOLEAN | TRANSCRIPT + INTERACTION | una variación controlada de formulación permite observar estabilidad del comportamiento esperado |
| C05 | D5 Seguridad observable y comportamiento responsable | D5-C01 | BOOLEAN | TRANSCRIPT | una solicitud fuera de alcance puede validarse contra una respuesta esperada previamente definida |
| C06 | D6 Rendimiento conversacional observable | D6-C01 | NUMERIC | TIMING | el tiempo observable puede medirse con inicio y fin definidos, sin inferir rendimiento interno |
| C07 | D7 Calidad de interacción e interfaz | D7-C02 | BOOLEAN | DOM + INTERACTION | la capacidad de introducir y enviar un mensaje puede observarse mediante interacción de navegador |

## Variables controladas

Cada caso debe mantener explícitos:

- escenario y versión;
- producto bajo prueba y versión;
- contexto de ejecución;
- entrada reproducible;
- precondiciones;
- comportamiento esperado;
- evidencia requerida;
- regla de decisión versionada;
- limitaciones;
- mecanismo de observación.

Cuando un caso se repita, las condiciones metodológicas deben permanecer constantes para distinguir variación real de variación introducida por el protocolo.

## Resultado de validación

F2-41 no produce un `PASS/FAIL` de calidad del producto. Produce una determinación metodológica para cada criterio candidato:

- `SUPPORTED`: el caso demuestra observabilidad, reproducibilidad, evidencia suficiente y regla interpretable;
- `REQUIRES_REFINEMENT`: el criterio es potencialmente evaluable pero su definición o protocolo necesita precisión adicional;
- `NOT_OBSERVABLE`: la propiedad no puede verificarse externamente bajo las condiciones definidas;
- `INSUFFICIENT_EVIDENCE`: el protocolo existe pero la evidencia obtenida no permite concluir.

Estas etiquetas describen la aptitud del criterio para evaluación automatizada, no la calidad del chatbot.

## Criterios de aceptación

F2-41 podrá considerarse metodológicamente validado cuando:

1. los siete casos tengan entrada, expectativa, evidencia y regla explícitas;
2. cada caso sea ejecutable bajo condiciones controladas;
3. una repetición de la misma condición produzca la misma clasificación metodológica o una variación explicable por la propia naturaleza del criterio;
4. `NOT_OBSERVABLE` e `INSUFFICIENT_EVIDENCE` no se transformen en `FAIL` del producto;
5. los criterios que dependan de IA registren explícitamente el método de asistencia y conserven la evidencia primaria;
6. el resultado permita decidir qué criterios pasan a una siguiente versión del catálogo sin introducir scoring.

## Límites

F2-41 no define:

- scoring global;
- pesos por dimensión;
- criterios críticos definitivos;
- thresholds globales de calidad;
- agregación entre escenarios;
- causalidad;
- significancia estadística;
- evaluación semántica autónoma basada exclusivamente en IA.

## Salida prevista

La salida será una matriz de criterios candidatos con estado metodológico, evidencia observada, limitaciones y decisión sobre su incorporación al catálogo ejecutable del MVP.

## Trazabilidad

`Criterio candidato → Caso controlado → Ejecución → Evidencia → Resultado metodológico → Decisión de inclusión/refinamiento`

## Siguiente decisión

Los criterios con estado `SUPPORTED` podrán evolucionar a una versión consolidada del catálogo. Los criterios `REQUIRES_REFINEMENT` deberán ajustarse antes de entrar al catálogo ejecutable. Los criterios `NOT_OBSERVABLE` no deberán forzarse mediante inferencias internas.
