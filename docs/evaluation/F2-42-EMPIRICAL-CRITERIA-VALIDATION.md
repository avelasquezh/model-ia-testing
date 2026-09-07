# F2-42 — Validación empírica controlada de criterios candidatos

**Estado:** DEFINIDO — EN VALIDACIÓN

## Propósito

F2-42 extiende F2-41 desde la aptitud estructural del protocolo hacia evidencia empírica obtenida mediante ejecución repetida sobre un target conversacional controlado.

La finalidad es comprobar si criterios candidatos seleccionados pueden observarse y reproducirse mediante evidencia real de ejecución, sin convertir el resultado en una evaluación global de calidad.

## Alcance

Se validan cuatro propiedades especialmente adecuadas para el MVP actual:

- D1-C01 — respuesta funcional esperada;
- D3-C01 — retención de dato conversacional;
- D6-C01 — tiempo hasta respuesta observable;
- D7-C02 — entrada de mensaje utilizable.

D2-C01 no se valida empíricamente todavía porque depende de un método de comparación semántica asistida por IA que sigue metodológicamente abierto.

D4 y D5 permanecen como candidatos para una fase posterior con protocolos específicos.

## Diseño controlado

Cada ejecución utiliza:

- el mismo escenario y versión;
- el mismo target controlado;
- la misma configuración de interfaz;
- la misma entrada reproducible;
- las mismas precondiciones;
- las mismas reglas metodológicas;
- la misma versión de producto del target controlado.

La repetición se utiliza para verificar estabilidad del mecanismo de observación, no para establecer significancia estadística.

## Evidencia primaria

La prueba debe conservar evidencia de la ejecución observable, incluyendo transcript/observación, interacción, screenshot y timing cuando corresponda.

La evidencia primaria permanece separada de cualquier interpretación posterior.

## Resultado metodológico

Cada criterio podrá clasificarse como:

- `SUPPORTED`: evidencia reproducible y suficiente bajo el protocolo;
- `REQUIRES_REFINEMENT`: observable, pero con ambigüedad o limitaciones que requieren ajustar el criterio;
- `NOT_OBSERVABLE`: el mecanismo no permite verificar la propiedad desde el exterior;
- `INSUFFICIENT_EVIDENCE`: el mecanismo existe, pero las ejecuciones no permiten una conclusión metodológica suficiente.

Estas etiquetas no significan PASS/FAIL del chatbot.

## Criterio de salida

F2-42 se considerará validado cuando las ejecuciones controladas completen los escenarios seleccionados, la evidencia primaria sea capturada y la clasificación metodológica sea reproducible o explicablemente variable.

## Límites

F2-42 no introduce scoring global, ponderaciones, criterios críticos, umbrales globales, reglas de parada, causalidad, significancia estadística ni evaluación semántica autónoma basada exclusivamente en IA.

## Trazabilidad

`Criterio candidato → Escenario controlado → Ejecución repetida → Evidencia primaria → Clasificación metodológica → Decisión de catálogo`
