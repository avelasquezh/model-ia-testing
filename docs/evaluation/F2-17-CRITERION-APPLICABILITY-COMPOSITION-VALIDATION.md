# F2-17 — Validación de aplicabilidad y composición de criterios

## 1. Propósito

Definir cómo `model-ia-testing` determina qué criterios son aplicables a una ejecución concreta y cómo esos criterios se relacionan con las dimensiones de evaluación, sin convertir todavía la composición en scoring global.

F2-16 definió cómo una regla interpreta evidencia cuando el criterio aplica. F2-17 valida ahora la selección de criterios antes de esa interpretación.

## 2. Cadena ampliada

La cadena metodológica queda:

`Contexto → Dimensión → Criterio aplicable → Evidencia requerida → Suficiencia → Medición/Observación → Regla → Resultado`

Un criterio no debe evaluarse simplemente porque exista en el catálogo.

## 3. Contrato mínimo

Cada criterio debe declarar como mínimo:

- identificador único;
- dimensión a la que pertenece;
- tipo de criterio;
- contextos en los que puede aplicar;
- evidencia requerida.

La aplicabilidad debe poder explicarse y quedar registrada en la ejecución.

## 4. Contexto de ejecución

La aplicabilidad depende del contexto probado. Entre los contextos posibles pueden existir, por ejemplo:

- `web-chatbot`;
- `api-chatbot`;
- `load-test`;
- otros contextos que posteriormente sean definidos.

No todos los criterios son válidos para todos los contextos.

Ejemplo: un criterio de rendimiento bajo carga no debe marcarse como incumplido cuando la ejecución fue una prueba funcional individual que no incluía protocolo de carga.

## 5. No aplicable no significa FAIL

Cuando un criterio no corresponde al contexto, debe conservarse como `NOT_APPLICABLE` a nivel de aplicabilidad y no convertirse automáticamente en `FAIL`.

La ausencia de aplicabilidad tampoco debe reducir artificialmente una métrica de cumplimiento.

## 6. Relación dimensión → criterio

Una dimensión agrupa criterios relacionados, pero no implica que todos los criterios de la dimensión deban ejecutarse en todas las pruebas.

Ejemplo:

`D6 — Rendimiento conversacional observable`

puede contener:

- D6-C01 tiempo hasta respuesta observable;
- D6-C02 variabilidad temporal;
- D6-C03 timeout observable;
- D6-C04 disponibilidad durante la prueba;
- D6-C05 rendimiento bajo carga.

Una ejecución normal de un chatbot web puede aplicar D6-C01, D6-C03 y D6-C04, mientras D6-C05 permanece fuera del contexto si no existe una prueba de carga.

## 7. Composición por ejecución

La composición de criterios debe producir una selección explícita:

`Ejecución → contexto → criterios aplicables → criterios no aplicables`

Para cada criterio seleccionado deben conservarse al menos:

- criterionId;
- dimensionId;
- applicability;
- reason;
- requiredEvidence;
- ruleVersion.

Esto permite reconstruir por qué un criterio fue o no evaluado.

## 8. Cobertura y aplicabilidad

La cobertura debe distinguir entre:

- criterios aplicables evaluados;
- criterios aplicables no evaluados;
- criterios no aplicables;
- criterios con evidencia insuficiente;
- criterios inconclusos.

No se debe tratar `no aplicable` como una ejecución omitida accidentalmente.

Tampoco debe confundirse cobertura de criterios con porcentaje de calidad.

## 9. Dependencias entre criterios

F2-17 no introduce todavía un motor de dependencias.

Sin embargo, una composición puede declarar posteriormente que un criterio requiere evidencia producida por otro paso o criterio.

La dependencia no debe utilizarse para ocultar un resultado ni convertir automáticamente un resultado de otro criterio en PASS o FAIL.

## 10. Evidencia requerida

Cada criterio debe declarar las clases de evidencia necesarias para poder evaluar su regla.

Ejemplos:

- D1-C01 → TRANSCRIPT;
- D6-C01 → TIMING;
- D7-C02 → INTERACTION + DOM.

Si la evidencia requerida no está disponible, la ejecución debe pasar a la semántica definida en F2-16 (`INCONCLUSIVE` o `NOT_EVALUABLE`) en lugar de inferir un incumplimiento.

## 11. Independencia del scoring

F2-17 no define:

- pesos por criterio;
- pesos por dimensión;
- score global;
- fórmula de calidad global;
- umbrales comerciales;
- compensación entre dimensiones.

La composición responde a la pregunta: **¿qué debe evaluarse en esta ejecución?**

No responde todavía: **¿qué puntuación final obtiene el sistema?**

## 12. Trazabilidad

La cadena de trazabilidad debe permitir:

`Ejecución → Contexto → Dimensión → Criterio → Regla → Evidencia → Resultado`

Si una conclusión no puede reconstruirse mediante esa cadena, la evaluación debe considerarse metodológicamente incompleta.

## 13. Implicación para el observable del producto

F2-17 acerca el modelo a la primera ejecución tangible porque permite que una futura ejecución real no intente evaluar todo el catálogo indiscriminadamente.

El motor podrá seleccionar un conjunto explícito de criterios aplicables al escenario y producir posteriormente resultados y evidencias para ese conjunto.

Esto prepara el paso desde la validación metodológica hacia un evaluador ejecutable.

## 14. Criterio de salida

F2-17 queda validado cuando:

1. un contexto determina qué criterios aplican;
2. los criterios no aplicables quedan separados de FAIL;
3. cada criterio conserva su dimensión y evidencia requerida;
4. la composición es auditable por ejecución;
5. la composición permanece separada del scoring global.

## 15. Próximo paso

El siguiente incremento debe comenzar a convertir estas reglas en un componente ejecutable del dominio/aplicación: una composición de criterios que pueda recibir un contexto de ejecución y producir un plan de evaluación auditable.
