# F2 — Validación metodológica de falsos positivos y falsos negativos

## 1. Propósito

Validar que el modelo de evaluación pueda distinguir errores del evaluador frente a un resultado de referencia conocido, específicamente:

- `FALSE POSITIVE`: el evaluador reporta `FAIL` cuando la referencia es `PASS`.
- `FALSE NEGATIVE`: el evaluador reporta `PASS` cuando la referencia es `FAIL`.

Este incremento es un spike metodológico. No implementa todavía un evaluador IA productivo ni define umbrales comerciales de calidad.

## 2. Fundamento

En evaluación de sistemas de IA es necesario distinguir la capacidad de detectar casos positivos de la tendencia a generar alarmas incorrectas. ISTQB CT-AI v2.0 utiliza la matriz de confusión para definir true positives, false positives, false negatives y true negatives, y presenta precisión y recall como métricas complementarias. citeturn0search24

Para `model-ia-testing`, esta lógica se adapta al contexto de evaluación de criterios observables: la referencia representa el resultado esperado/establecido mediante un oráculo de evaluación y el resultado evaluado representa la decisión producida por el mecanismo bajo prueba.

La referencia no debe confundirse con la salida de otro evaluador no validado. Para este spike se utiliza una referencia conocida y explícita.

## 3. Hipótesis

Un evaluador puede producir dos clases de error relevantes:

1. declarar un fallo inexistente (`FALSE POSITIVE`);
2. no detectar un fallo existente (`FALSE NEGATIVE`).

Ambos errores deben permanecer diferenciados porque tienen consecuencias distintas sobre la confianza de la evaluación.

## 4. Propiedades validadas

### FPN-V01 — Distinción de errores

`reference = PASS` + `evaluated = FAIL` debe clasificarse como `FALSE POSITIVE`.

`reference = FAIL` + `evaluated = PASS` debe clasificarse como `FALSE NEGATIVE`.

### FPN-V02 — INCONCLUSIVE y NOT_EVALUABLE no son errores de clasificación

Un resultado `INCONCLUSIVE` o `NOT_EVALUABLE` no debe convertirse automáticamente en `FALSE POSITIVE` o `FALSE NEGATIVE`.

Esto preserva la separación metodológica ya definida entre falta de determinación y decisión incorrecta.

### FPN-V03 — Precisión y recall son indicadores complementarios

La precisión permite observar la proporción de decisiones positivas del evaluador que son correctas.

El recall permite observar la proporción de fallos de referencia que el evaluador consigue detectar.

En este spike se valida únicamente su comportamiento matemático sobre casos sintéticos. No se establecen umbrales de aceptación.

### FPN-V04 — Referencia y evaluación permanecen separadas

El resultado de referencia debe conservarse independientemente de la decisión del evaluador. Esto evita que el mecanismo bajo prueba pueda redefinir retrospectivamente el oráculo contra el cual se mide.

### FPN-V05 — Error auditable

Cada clasificación debe conservar la identidad del caso evaluado para permitir reconstruir qué escenario/criterio produjo el error.

## 5. Matriz conceptual

| Referencia | Evaluación | Clasificación |
|---|---|---|
| PASS | PASS | TRUE NEGATIVE |
| PASS | FAIL | FALSE POSITIVE |
| FAIL | PASS | FALSE NEGATIVE |
| FAIL | FAIL | TRUE POSITIVE |
| PASS/FAIL | INCONCLUSIVE | INDETERMINATE |
| PASS/FAIL | NOT_EVALUABLE | INDETERMINATE |

La terminología `positive` representa en este spike la detección de un fallo (`FAIL`), no una valoración positiva de calidad.

## 6. Indicadores candidatos

Para los casos que produzcan una clasificación binaria determinada:

`Precision = TP / (TP + FP)`

`Recall = TP / (TP + FN)`

Los denominadores cero deben tratarse explícitamente y no generar valores numéricos artificiales.

No se define todavía un umbral mínimo de precision, recall o F1 para aceptar un evaluador.

## 7. Alcance de la validación

El spike valida:

- semántica de false positive;
- semántica de false negative;
- exclusión de INCONCLUSIVE y NOT_EVALUABLE de la matriz binaria;
- cálculo de precision;
- cálculo de recall;
- separación entre referencia y evaluación;
- trazabilidad por caso.

No valida todavía:

- calidad de un modelo IA concreto;
- estabilidad entre modelos;
- estabilidad entre versiones del evaluador;
- tamaño mínimo de muestra;
- intervalos de confianza;
- significancia estadística;
- umbrales de aceptación;
- costo relativo de false positive frente a false negative;
- evaluación semántica real de respuestas.

## 8. Implicación para el diseño posterior

La calidad del evaluador debe medirse independientemente de la calidad del chatbot evaluado.

La cadena metodológica propuesta es:

`Caso con referencia → Evidencia → Evaluador → Resultado evaluado → Clasificación del error → Indicador de calidad del evaluador`

Esto evita confundir un fallo del producto evaluado con un fallo del instrumento que lo evalúa.

## 9. Criterio de salida

Queda validado que el modelo necesita distinguir false positives y false negatives como errores diferentes del mecanismo evaluador y que `INCONCLUSIVE`/`NOT_EVALUABLE` deben permanecer fuera de la matriz binaria hasta que exista una política específica para tratarlos.

No se crea todavía una entidad `EvaluatorQuality`, un motor de métricas productivo ni una política de aceptación.
