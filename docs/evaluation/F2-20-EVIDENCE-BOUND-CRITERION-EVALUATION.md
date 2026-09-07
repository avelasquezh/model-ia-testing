# F2-20 — Evaluación de criterio vinculada a evidencia

## Propósito

Conectar la ejecución tangible de F2-19 con el `EvaluationPlan` y producir un primer `CriterionEvaluation` auditable.

La cadena implementada es:

`Execution → Evidence → EvaluationPlan → CriterionDecisionRule → CriterionEvaluation`

## Reglas

1. El plan debe pertenecer a la ejecución que se está evaluando.
2. El criterio debe existir en el plan.
3. La evidencia se consulta por `executionId`.
4. Si falta evidencia requerida, el resultado es `INCONCLUSIVE`.
5. Si no existe evidencia, el resultado es `NOT_EVALUABLE`.
6. Si no existe una regla de decisión para el criterio, el resultado es `NOT_EVALUABLE`.
7. La versión de la regla debe coincidir con la versión declarada por el criterio.
8. Una regla compatible puede producir `PASS`, `FAIL`, `PARTIAL` cuando el contrato lo permita, o `INCONCLUSIVE`.
9. No se calcula score ni se agregan resultados por dimensión.

## Decisión metodológica

F2-20 introduce una frontera explícita para las reglas de decisión. El componente de aplicación no interpreta semántica por sí mismo: recibe una `CriterionDecisionRule` versionada.

Esto permite que una futura regla determinista, una regla basada en comparación o una evaluación asistida por IA sean adaptadores intercambiables sin alterar el dominio.

La IA, cuando se incorpore, seguirá sujeta al mismo contrato: evidencia de entrada, versión del método, salida y regla de aceptación trazables.

## Resultado de F2-19

El chatbot controlado ya genera respuesta, timing y screenshot. F2-20 demuestra que esa evidencia puede alimentar un criterio sin mezclar ejecución con conclusión.

El primer `PASS` del test usa una regla controlada y versionada. No representa todavía una afirmación de calidad comercial del chatbot; demuestra el mecanismo de decisión.

## No incluido

- scoring global;
- pesos;
- umbrales universales;
- evaluación autónoma mediante LLM;
- persistencia PostgreSQL;
- interfaz de usuario;
- catálogo comercial definitivo de criterios.

## Criterio de salida

El incremento queda validado cuando un criterio aplicable puede pasar desde evidencia suficiente a `CriterionEvaluation`, mientras que evidencia insuficiente y reglas ausentes producen estados explícitos y auditables.

## Siguiente incremento

F2-21 debe reemplazar la regla controlada por una primera regla determinista observable para un criterio real del catálogo, conectando la respuesta capturada en F2-19 con una condición verificable y produciendo `PASS` o `FAIL` a partir de evidencia real.
