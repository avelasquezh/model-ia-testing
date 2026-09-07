# F2-18 — Plan ejecutable de evaluación por contexto

## Propósito

Convertir las reglas de F2-17 en un componente ejecutable que reciba un contexto de ejecución y produzca un plan de evaluación auditable.

## Contrato

`ComposeEvaluationPlan` recibe:

- `executionId`;
- `context`;
- un catálogo de criterios mediante un puerto de aplicación.

Produce un `EvaluationPlan` que conserva, por criterio:

- `criterionId`;
- `dimensionId`;
- tipo de criterio;
- aplicabilidad;
- razón de la decisión;
- evidencia requerida;
- versión de la regla.

## Regla de composición

Para cada criterio del catálogo:

`contexto ∈ applicableContexts → APPLICABLE`

`contexto ∉ applicableContexts → NOT_APPLICABLE`

`NOT_APPLICABLE` es una propiedad de aplicabilidad y no un resultado de calidad. No se transforma en `FAIL`.

## Trazabilidad

El plan queda vinculado a una ejecución mediante `executionId`. La reconstrucción mínima es:

`Ejecución → Contexto → Criterio → Dimensión → Aplicabilidad → Evidencia requerida → Regla/version`

La composición es determinista para un catálogo y contexto dados.

## Separación arquitectónica

El componente pertenece a dominio/aplicación y no depende de Playwright, navegador, proveedor de IA ni persistencia. El catálogo se consume mediante un puerto, por lo que la implementación actual puede permanecer en memoria.

## Validaciones

F2-18 verifica:

1. composición por contexto;
2. separación entre aplicable y no aplicable;
3. conservación de evidencia requerida;
4. conservación de versión de regla;
5. rechazo de identificadores de criterio duplicados;
6. ausencia de scoring, pesos o resultado global.

## Alcance no incluido

Este incremento no implementa:

- evaluación de evidencia;
- PASS/FAIL de criterios;
- scoring;
- agregación por dimensión;
- persistencia;
- ejecución Playwright.

## Criterio de salida

F2-18 queda validado cuando un caso de uso ejecutable puede construir un plan de evaluación específico para una ejecución, explicando qué criterios aplican y cuáles no, y conservando la evidencia y versión de regla necesarias para la siguiente etapa.

## Siguiente incremento lógico

Con el plan ejecutable disponible, el siguiente paso debe conectar el plan con evidencia observable de una ejecución real, evitando continuar indefinidamente con contratos abstractos. La primera ruta tangible será una ejecución de escenario de chatbot que produzca transcript, screenshot y timing, y permita posteriormente evaluar criterios seleccionados por el plan.
