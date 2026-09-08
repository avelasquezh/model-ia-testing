# F2-44 — Protocolo de evaluación semántica reproducible asistida por IA

**Estado:** **DEFINIDO — PENDIENTE DE EJECUCIÓN**

## Propósito

F2-44 define el protocolo necesario para validar empíricamente D2-C01, cuya propiedad objetivo es la correspondencia de una respuesta con la intención esperada de la entrada.

El objetivo es determinar si la asistencia de IA puede utilizarse como instrumento reproducible para interpretar evidencia conversacional previamente delimitada, sin sustituir la evidencia primaria ni introducir un veredicto global de calidad.

## Candidato

**D2-C01 — Correspondencia con intención**

El catálogo actual define como evidencia mínima la entrada, la respuesta y la intención esperada. F2-41 identificó adicionalmente `AI_ANALYSIS` como mecanismo de evaluación candidato.

## Principio de evaluación

La unidad evaluada será una relación explícita entre:

- entrada del usuario;
- intención esperada previamente definida;
- respuesta observable del sistema;
- contexto permitido para interpretar la interacción;
- resultado de la evaluación asistida por IA.

La IA no podrá inferir por sí sola cuál era la intención correcta a partir de la respuesta. La intención y sus condiciones de evaluación deberán existir antes de invocar el evaluador.

## Diseño controlado

El protocolo deberá controlar, como mínimo:

- caso de evaluación y versión;
- entrada exacta;
- intención esperada y su definición operacional;
- respuesta observable;
- contexto conversacional incluido y excluido;
- modelo/proveedor y versión o identificador equivalente;
- prompt o plantilla de evaluación versionada;
- parámetros relevantes de generación, cuando apliquen;
- esquema de salida esperado;
- reglas metodológicas de decisión.

Una ejecución no será comparable con otra si cambia una variable metodológica relevante sin quedar registrada.

## Contrato mínimo de entrada

El evaluador deberá recibir un objeto determinista que identifique explícitamente:

- `criterionId` y versión;
- `evidenceIds` de evidencia primaria;
- `userInput`;
- `expectedIntent` y versión;
- `observedResponse`;
- `allowedContext`;
- `modelId` y `modelVersion`;
- `promptVersion`;
- `methodVersion`.

La intención no podrá derivarse exclusivamente del texto de la respuesta observada.

## Salida normalizada

El evaluador deberá producir una salida estructurada y validable, como mínimo con:

- resultado ordinal predefinido (`PASS`, `FAIL`, `PARTIAL`, `INCONCLUSIVE`, `NOT_EVALUABLE`);
- justificación breve trazable a la evidencia proporcionada;
- indicación explícita de insuficiencia de evidencia cuando corresponda;
- identificación del modelo/proveedor;
- versión del prompt/plantilla;
- versión del criterio o regla aplicada.

La salida deberá permanecer separada de la evidencia primaria y no podrá mutar el contenido evaluado.

La estructura exacta de persistencia queda abierta para la implementación, pero estos campos son obligatorios para considerar el análisis reconstruible.

## Regla metodológica del resultado

La evaluación semántica no convertirá directamente el resultado ordinal en calidad del producto. El resultado metodológico de F2-44 se obtendrá posteriormente aplicando una regla explícita sobre los resultados observados y su estabilidad.

Como baseline del spike:

- `PASS` en caso alineado → evidencia de correspondencia observable;
- `FAIL` en caso no alineado → evidencia de ausencia de correspondencia;
- `INCONCLUSIVE` o `NOT_EVALUABLE` en caso ambiguo/insuficiente → evidencia insuficiente para decidir;
- `PARTIAL` → requiere una regla explícita de refinamiento antes de cerrar el método.

## Reproducibilidad

La validación deberá comprobar que una misma evidencia, intención, configuración metodológica y modelo producen resultados suficientemente consistentes para el propósito declarado.

La repetición no implica por sí misma significancia estadística. Se utilizará para detectar variabilidad observable, dependencia de configuración y casos ambiguos.

Cuando el evaluador produzca resultados variables, el protocolo deberá conservar todas las observaciones relevantes y clasificar el caso como insuficiente o sujeto a refinamiento según reglas predefinidas, en lugar de ocultar la variabilidad mediante promedios no justificados.

## Evidencia primaria y trazabilidad

La evaluación deberá conservar:

- evidencia conversacional original;
- intención esperada versionada;
- payload de entrada al evaluador, o referencia reproducible equivalente;
- identificación y versión del modelo/proveedor;
- versión del prompt/plantilla;
- salida estructurada del evaluador;
- regla de decisión;
- identificación de la ejecución;
- evidencia de cualquier transformación o normalización previa.

Debe ser posible reconstruir qué evidencia recibió la IA y bajo qué configuración produjo su resultado.

## Control experimental

El protocolo deberá incluir, como mínimo:

1. un caso alineado, donde la respuesta satisface la intención esperada;
2. un caso no alineado, donde la respuesta contradice o no satisface la intención;
3. un caso ambiguo o con evidencia insuficiente, donde el evaluador no deba inventar una intención o evidencia inexistente.

Los tres casos permiten comprobar que el evaluador distingue adecuadamente correspondencia, ausencia de correspondencia e insuficiencia de evidencia.

## Resultado metodológico

El resultado permitido para D2-C01 será uno de los siguientes:

- `SUPPORTED`: el método asistido demuestra comportamiento reproducible y discrimina los casos controlados conforme a la regla establecida;
- `REQUIRES_REFINEMENT`: existen resultados útiles, pero hay variabilidad o explicaciones alternativas que impiden considerar cerrado el método;
- `NOT_OBSERVABLE`: la evidencia disponible no permite evaluar la correspondencia de forma fiable;
- `INSUFFICIENT_EVIDENCE`: el protocolo o las repeticiones no permiten una conclusión metodológica suficiente.

Estas etiquetas no representan PASS/FAIL del producto.

## Límites

F2-44 no introduce:

- scoring global;
- pesos por dimensión;
- criterios críticos definitivos;
- umbrales globales;
- aceptación o rechazo global del sistema;
- causalidad;
- sustitución de evidencia primaria por texto generado por IA;
- inferencia automática de la intención esperada sin especificación previa.

Tampoco fija todavía un proveedor concreto. La selección de proveedor será una decisión posterior a la validación del contrato y del método.

## Criterio de salida

F2-44 podrá validarse cuando:

1. exista un contrato de entrada y salida reproducible para evaluación semántica;
2. la intención esperada esté definida antes de la evaluación;
3. la evidencia primaria quede vinculada al análisis;
4. el modelo/proveedor y configuración metodológica sean trazables;
5. los casos alineado, no alineado y ambiguo sean diferenciables mediante una regla explícita;
6. las repeticiones permitan caracterizar la estabilidad del método;
7. no se requiera scoring global para concluir sobre la aptitud metodológica del criterio.

## Trazabilidad

`D2-C01 → Evidencia primaria → Intención esperada versionada → Contrato de evaluación → Configuración del evaluador → Análisis IA trazable → Regla de decisión → Repetición → Resultado metodológico`
