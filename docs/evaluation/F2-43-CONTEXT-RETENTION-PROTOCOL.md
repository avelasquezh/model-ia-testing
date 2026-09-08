# F2-43 — Protocolo controlado de retención de contexto conversacional

**Estado:** **DEFINIDO — PENDIENTE DE EJECUCIÓN**

## Propósito

F2-43 define el protocolo necesario para validar empíricamente D3-C01, cuya propiedad objetivo es la retención de contexto entre turnos.

La finalidad es demostrar que una información introducida en un turno puede ser utilizada de manera verificable en un turno posterior, conservando la secuencia completa de interacción y la evidencia primaria necesaria para distinguir memoria conversacional de coincidencia accidental.

## Candidato

**D3-C01 — Retención de contexto conversacional**

La propiedad no debe inferirse a partir de una única respuesta. El protocolo exige una dependencia observable entre dos o más turnos.

## Diseño controlado

El escenario deberá contener al menos dos turnos relacionados:

1. **Turno de establecimiento:** el usuario introduce un dato específico que no aparece posteriormente de forma literal en la petición de verificación.
2. **Turno de verificación:** el usuario formula una solicitud cuya respuesta esperada requiere recuperar el dato establecido en el turno anterior.

Las ejecuciones deben mantener constantes:

- escenario y versión;
- target y versión de producto;
- configuración de interfaz;
- precondiciones;
- reglas metodológicas;
- entradas exactas de cada turno;
- secuencia temporal de interacción.

El dato establecido debe elegirse de forma que una respuesta correcta no pueda justificarse únicamente por coincidencia literal con el segundo turno.

## Evidencia primaria

La ejecución debe conservar, como mínimo:

- entrada de cada turno;
- orden de los turnos;
- respuesta observable de cada turno;
- timestamps o duración cuando estén disponibles;
- evidencia visual de la conversación cuando el adaptador la proporcione;
- identificación de la ejecución;
- publicación mediante `ExecutionEvidencePublisher`.

La secuencia completa es obligatoria para la interpretación del criterio. No es suficiente conservar solamente la última respuesta.

## Control contra coincidencia accidental

El protocolo debe incluir una segunda formulación de verificación que requiera el dato previamente establecido sin repetirlo literalmente.

Cuando sea posible, se recomienda utilizar un dato controlado que no sea deducible de la segunda entrada por sí mismo. El objetivo es reducir la posibilidad de que una respuesta correcta provenga de patrones estáticos, información visible en la interfaz o coincidencia accidental.

## Repetición

Se realizarán al menos tres ejecuciones independientes con las mismas condiciones y secuencia conversacional.

La repetición busca demostrar estabilidad del mecanismo de observación y del comportamiento observable del protocolo. No se utilizará para afirmar significancia estadística.

## Resultado metodológico

El resultado permitido para D3-C01 será uno de los siguientes:

- `SUPPORTED`: la evidencia demuestra recuperación reproducible del dato establecido en turnos posteriores;
- `REQUIRES_REFINEMENT`: existe evidencia de recuperación, pero el protocolo permite explicaciones alternativas relevantes;
- `NOT_OBSERVABLE`: el canal externo no permite verificar de forma fiable la retención del contexto;
- `INSUFFICIENT_EVIDENCE`: existe interacción contextual, pero las repeticiones no permiten establecer una conclusión metodológica suficiente.

Estas etiquetas no representan PASS/FAIL del producto.

## Límites

F2-43 no introduce scoring global, ponderaciones, criterios críticos, umbrales globales, significancia estadística, causalidad ni evaluación semántica autónoma basada exclusivamente en IA.

Una respuesta correcta en el segundo turno no será considerada evidencia suficiente si el dato pudo obtenerse sin utilizar el contexto previo.

## Criterio de salida

F2-43 podrá validarse cuando:

1. existan al menos dos turnos causalmente relacionados por diseño;
2. la segunda verificación requiera el dato establecido previamente;
3. la secuencia completa y la evidencia primaria queden registradas;
4. las repeticiones permitan observar estabilidad del mecanismo;
5. las explicaciones alternativas relevantes estén controladas o registradas como limitaciones.

## Trazabilidad

`D3-C01 → Escenario multitur​​no → Ejecución independiente → Secuencia completa → Evidencia primaria → Control de coincidencia → Clasificación metodológica`
