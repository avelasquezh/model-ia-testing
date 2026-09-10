# LLM Model Comparative Battery 0.1

**Classification:** `F2-VAL-05-EXT-01`  
**Status:** PREPARADO PARA EJECUCIÓN CONTROLADA  
**Product version:** `0.1.0`  
**Evaluation method:** `AI-METHOD-0.1`

## 1. Objetivo

Comparar de forma reproducible el comportamiento de dos modelos utilizados como evaluadores semánticos del mismo conjunto de observaciones conversacionales.

La comparación mide diferencias entre evaluadores. No mide directamente la calidad del bot bajo prueba y no constituye una decisión global sobre el producto.

## 2. Alcance arquitectónico

Con la arquitectura actual, el modelo comparado ocupa el rol de **Semantic Evaluator**. El SUT produce `BotObservation`; el evaluador recibe la misma entrada normalizada para cada modelo.

```text
             ┌─> Evaluador A ─> resultado A ─┐
BotObservation│                                ├─> comparación descriptiva
             └─> Evaluador B ─> resultado B ─┘
```

No se introduce una dependencia de proveedor, SDK, canal o interfaz específica en el dominio. El contrato común es `SemanticEvaluatorPort`.

## 3. Matriz inicial

La primera batería utiliza una pareja representativa de modelos activos:

| Rol | Proveedor | Model ID | Model version |
|---|---|---|---|
| Evaluador A | OpenAI | `gpt-5.6-terra` | Debe fijarse en la ejecución |
| Evaluador B | Anthropic | `claude-sonnet-5` | Debe fijarse en la ejecución |

Los identificadores son parámetros operativos, no valores hard-codeados en el dominio. Cada ejecución debe conservar la versión exacta declarada por el proveedor. La matriz puede ampliarse posteriormente a una pareja de mayor capacidad o menor costo sin cambiar el contrato.

## 4. Condiciones controladas

Ambos modelos deben recibir exactamente:

- el mismo archivo `BotObservation`;
- el mismo `userInput`, `observedResponse` y `expectedIntent`;
- la misma `expectedIntentVersion`;
- los mismos `evidenceIds` y en el mismo orden;
- el mismo `criterionId` y `criterionVersion`;
- el mismo `promptVersion`;
- el mismo `methodVersion`;
- el mismo endpoint lógico del evaluador y configuración equivalente de transporte;
- el mismo conjunto de casos y repeticiones.

No se permite modificar las observaciones entre modelos.

## 5. Diseño de casos

La batería mínima contiene exactamente tres clases:

| Case ID | Propósito |
|---|---|
| `ALIGNED` | La respuesta observable atiende explícitamente la intención esperada. |
| `NOT_ALIGNED` | La respuesta observable no atiende la intención esperada. |
| `AMBIGUOUS` | La evidencia disponible no permite determinar suficientemente el cumplimiento. |

Cada caso requiere al menos dos repeticiones independientes. Para una primera comparación exploratoria se recomienda registrar cinco repeticiones por caso cuando el costo y disponibilidad lo permitan.

La unidad de comparación es `caseId + repetition + turn`.

## 6. Variables que deben permanecer constantes

`scenarioId`, `scenarioVersion`, catálogo de criterios, reglas de decisión, contexto, alcance, selección de criterios, aplicabilidad, `conditionFingerprint`, prompt y método deben ser equivalentes cuando se comparen ejecuciones como metodológicamente comparables.

La comparación de ejecuciones existente debe bloquear diferencias incompatibles antes de calcular métricas descriptivas.

## 7. Medidas primarias

Para cada modelo registrar:

- distribución de `PASS`, `PARTIAL`, `FAIL`, `INCONCLUSIVE` y `NOT_EVALUABLE`;
- `nTotal` y `nEvaluable`;
- tasas de `PASS`, `PARTIAL` y `FAIL` sobre observaciones evaluables;
- intervalo de confianza Wilson del 95 % para las tasas disponibles;
- repetibilidad por caso;
- errores de transporte y errores de esquema/procedencia.

Estas medidas ya existen en el modelo de repetición y estadísticas del proyecto.

## 8. Medidas comparativas

Para cada par de resultados con igual `caseId`, `repetition` y `turn`:

1. verificar igualdad de condiciones metodológicas;
2. comprobar si ambos evaluadores producen el mismo `outcome`;
3. registrar `AGREEMENT` o `DISAGREEMENT`;
4. conservar el resultado individual de cada modelo y sus `evidenceIds`;
5. describir diferencias sin atribuir causalidad al modelo salvo que exista evidencia adicional.

Se debe conservar como mínimo una matriz de desacuerdos por combinación de resultados, por ejemplo:

```text
                 Modelo B
             PASS PARTIAL FAIL INCONCLUSIVE NOT_EVALUABLE
Modelo A PASS     ·      ·     ·      ·            ·
         PARTIAL  ·      ·     ·      ·            ·
         FAIL     ·      ·     ·      ·            ·
         INCONCLUSIVE
                  ·      ·     ·      ·            ·
         NOT_EVALUABLE
                  ·      ·     ·      ·            ·
```

No se debe convertir esta matriz en un score global de calidad.

## 9. Ejecución del arnés existente

El arnés actual exige un evaluador externo real y un archivo de observaciones que contenga `ALIGNED`, `NOT_ALIGNED` y `AMBIGUOUS`, con al menos dos repeticiones por caso.

Para cada modelo se debe proporcionar externamente:

```text
SEMANTIC_EVALUATOR_ENDPOINT=<endpoint externo>
SEMANTIC_EVALUATOR_AUTHORIZATION=<credencial opcional>
BOT_OBSERVATIONS_FILE=<archivo real de observaciones>
SEMANTIC_EVALUATOR_MODEL_ID=<model id>
SEMANTIC_EVALUATOR_MODEL_VERSION=<versión exacta>
SEMANTIC_EVALUATOR_PROMPT_VERSION=<versión del prompt>
SEMANTIC_EVALUATOR_METHOD_VERSION=AI-METHOD-0.1
```

Y ejecutar:

```bash
npm run evaluation:semantic:live
npm run evaluation:report -- <resultado-normalizado.json>
```

El resultado debe conservar la procedencia completa y la identidad exacta de `evidenceIds`.

## 10. Evidencia mínima de la batería

Para cada modelo:

```text
01-observations.json
02-evaluation-result.json
03-visual-report.html
04-execution-notes.md
```

Para la comparación:

```text
05-model-comparison.json
06-model-comparison-report.html
07-comparison-notes.md
```

`05` debe poder reconstruirse a partir de los dos resultados normalizados sin volver a consultar el SUT.

## 11. Criterios de aceptación

La batería puede considerarse ejecutada cuando:

- ambos modelos fueron invocados contra el mismo conjunto de observaciones reales;
- cada caso tuvo al menos dos repeticiones independientes;
- cada resultado conserva `modelId`, `modelVersion`, `promptVersion` y `methodVersion`;
- `evidenceIds` se conservaron sin modificación;
- los errores de transporte y esquema quedaron registrados;
- los desacuerdos pueden rastrearse hasta `caseId`, `repetition` y `turn`;
- las condiciones metodológicas son comparables;
- no se genera un score global ni una aceptación/rechazo global del producto.

## 12. Interpretación permitida

Ejemplos de conclusiones válidas:

- "El modelo A y el modelo B coincidieron en 5 de 6 observaciones comparables."
- "El desacuerdo se concentró en `AMBIGUOUS`."
- "El modelo A presentó una mayor proporción descriptiva de `INCONCLUSIVE` en esta muestra."
- "La repetibilidad del modelo B fue menor en el caso `NOT_ALIGNED`."

No son válidas conclusiones como "el modelo A es mejor" sin una metodología adicional que defina qué significa mejor y cómo se valida.

## 13. Dependencia de evidencia externa

Este documento no constituye por sí mismo ejecución de `F2-VAL-05`. La validación requiere un SUT externo real, observaciones reales y un evaluador semántico externo real, de acuerdo con `F2-VAL-05-EXECUTION-PROTOCOL.md`.

El archivo `examples/bot-observations.example.json` es únicamente ilustrativo y no debe utilizarse como evidencia de ejecución real.

## 14. Siguiente fase

La siguiente ejecución controlada debe usar un único conjunto de `BotObservation` real y ejecutar la misma batería contra los dos modelos definidos en la matriz. Una vez disponibles ambos resultados, el proyecto puede incorporar una comparación automatizada reutilizable sin modificar el contrato del dominio.
