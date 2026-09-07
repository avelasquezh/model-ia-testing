# F2-19 — Primera ejecución tangible de chatbot

## Propósito

Convertir los contratos de ejecución y evidencia en una prueba ejecutable contra un chatbot controlado por HTTP, usando Playwright como adaptador de navegador.

Este incremento es el primer punto tangible del proyecto: ya no se valida únicamente el modelo metodológico; se ejecuta una conversación y se capturan observables.

## Flujo

`Scenario → Target → Execution → PlaywrightConversationAdapter → PlaywrightExecutionRunner → Observation → Evidence event`

El objetivo es demostrar que una ejecución puede producir:

- entrada enviada;
- respuesta observable;
- duración observable;
- screenshot;
- evento de evidencia asociado a la ejecución.

## Target controlado

El test levanta un servidor HTTP efímero dentro de la prueba. El chatbot controlado:

1. presenta un compositor de mensaje;
2. recibe el texto;
3. genera una respuesta observable basada en la entrada;
4. expone la respuesta mediante un elemento identificable;
5. permite que Playwright capture el estado resultante.

No se depende de Internet ni de un proveedor externo para esta validación arquitectónica.

## Resultado

El runner devuelve `INCONCLUSIVE` deliberadamente porque F2-19 demuestra ejecución y observabilidad, no todavía evaluación semántica del criterio.

Esto mantiene separadas tres capas:

`Ejecución observable ≠ Evaluación de criterio ≠ Scoring`

La respuesta observada puede utilizarse como evidencia para el siguiente incremento, donde se conectará con el `EvaluationPlan` y las reglas de decisión.

## Evidencia producida

Para el turno probado se verifica:

- input observable;
- response observable;
- timing observable en milisegundos;
- screenshot como evidencia binaria;
- evento `OBSERVATION` con `executionId`.

El timing representa tiempo observable de interacción. No representa tiempo interno de inferencia del modelo.

## Separación arquitectónica

El dominio y la aplicación no conocen Playwright. El adaptador de navegador implementa la interacción observable y el runner coordina la ejecución.

La configuración de localizadores permanece fuera del dominio y permite cambiar la estructura de la UI sin modificar el contrato de escenario.

## Alcance no incluido

F2-19 no implementa todavía:

- evaluación automática PASS/FAIL del criterio;
- evaluación mediante IA;
- scoring;
- persistencia PostgreSQL;
- interfaz web de administración;
- ejecución contra un chatbot comercial externo.

## Criterio de salida

F2-19 queda validado cuando Playwright ejecuta una conversación real sobre un target HTTP controlado y la ejecución conserva observaciones y evidencia observable sin introducir dependencias de infraestructura en el dominio.

## Siguiente paso

F2-20 debe conectar la ejecución tangible con el `EvaluationPlan`: seleccionar criterios aplicables, comprobar evidencia requerida y producir un primer `CriterionEvaluation` trazable. La primera demostración de valor será entonces:

`mensaje → respuesta → evidencia → criterio → PASS/FAIL/INCONCLUSIVE`
