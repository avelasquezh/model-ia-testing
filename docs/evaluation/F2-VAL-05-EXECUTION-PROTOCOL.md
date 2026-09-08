# F2-VAL-05 — Protocolo de ejecución de validación semántica externa

**Estado:** PREPARADO PARA EJECUCIÓN CONTROLADA  
**Clasificación:** `F2-VAL-05`  
**Metodología:** `0.1`  
**Versión de producto:** `0.1.0`

## Objetivo

Ejecutar el arnés de evaluación semántica contra un evaluador externo real y conservar evidencia suficiente para determinar si la clasificación semántica es reproducible y trazable bajo condiciones controladas.

Esta validación no convierte el resultado semántico en un score global del producto ni autoriza una decisión global de calidad.

## Separación de responsabilidades

El sistema bajo prueba (SUT) produce la respuesta observable. El evaluador semántico externo interpreta esa respuesta contra la intención esperada. El repositorio solo normaliza, valida y registra la evidencia; no debe asumir el canal, proveedor, SDK o interfaz del SUT.

Flujo:

```text
SUT externo
  -> respuesta observable
  -> BotObservation
  -> SemanticEvaluatorPort
  -> resultado normalizado
  -> reporte visual
```

## Entorno externo controlado

Para el SUT se admite cualquier interfaz que permita obtener respuestas reproducibles y conservar evidencia. Un ejemplo operativo compatible es el Testing Tool o Sample Page de ChatBot.com. Estas superficies permiten probar el bot y, mediante Debug Mode, inspeccionar las interacciones y el JSON asociado. La implementación del repositorio no depende de ChatBot.com.

Para el evaluador se requiere un endpoint externo que acepte `SemanticEvaluationInput` y devuelva un objeto compatible con `SemanticEvaluationOutput`.

Las credenciales, URLs privadas, tokens y parámetros secretos deben permanecer fuera del repositorio.

## Preparación del SUT

1. Publicar la versión controlada del bot antes de iniciar la ejecución.
2. Definir una versión o identificador del SUT que pueda registrarse en `botVersion`.
3. Preparar al menos tres casos del protocolo F2-VAL-04:
   - `ALIGNED`: la respuesta atiende explícitamente la intención esperada.
   - `NOT_ALIGNED`: la respuesta no atiende la intención esperada.
   - `AMBIGUOUS`: la evidencia no permite determinar de forma suficiente si la intención fue atendida.
4. Ejecutar cada caso con al menos dos repeticiones independientes cuando el entorno lo permita.
5. Reiniciar el contexto entre repeticiones cuando el caso requiera independencia conversacional.
6. Conservar `caseId`, `conversationId`, `turn`, entrada del usuario, respuesta observada y evidencia primaria.

## Construcción de `BotObservation`

Cada observación debe contener como mínimo:

- `caseId`
- `conversationId`
- `repetition`
- `turn`
- `userInput`
- `observedResponse`
- `expectedIntent`
- `expectedIntentVersion`
- `evidenceIds`

Cuando estén disponibles, registrar además `channel`, `transport`, `botId`, `botVersion`, `executionId` y `observedAt`.

Los `evidenceIds` deben identificar artefactos reales de la ejecución. No deben ser nombres inventados para completar el esquema.

## Ejecución del arnés

Configurar fuera del repositorio:

```text
SEMANTIC_EVALUATOR_ENDPOINT=<endpoint externo>
SEMANTIC_EVALUATOR_AUTHORIZATION=<credencial opcional>
BOT_OBSERVATIONS_FILE=<archivo de observaciones>
SEMANTIC_EVALUATOR_MODEL_ID=<identidad del evaluador>
SEMANTIC_EVALUATOR_MODEL_VERSION=<versión del evaluador>
SEMANTIC_EVALUATOR_PROMPT_VERSION=<versión del prompt>
SEMANTIC_EVALUATOR_METHOD_VERSION=AI-METHOD-0.1
```

Ejecutar:

```bash
npm run evaluation:semantic:live
```

Guardar la salida JSON completa como evidencia de ejecución. Después generar el reporte visual:

```bash
npm run evaluation:report -- <resultado-normalizado.json>
```

## Criterios de aceptación de F2-VAL-05

La validación puede considerarse metodológicamente ejecutada solo si:

1. existe un SUT externo real y una ejecución reproducible;
2. existe un evaluador semántico externo real;
3. cada resultado conserva identidad/versionado del evaluador;
4. la identidad de `evidenceIds` se conserva sin modificación;
5. los casos ALIGNED, NOT_ALIGNED y AMBIGUOUS producen resultados normalizados compatibles con el protocolo;
6. las repeticiones equivalentes pueden compararse por `caseId`, `repetition` y `turn`;
7. los errores de transporte, esquema o procedencia quedan registrados;
8. el reporte conserva trazabilidad desde la entrada hasta el resultado;
9. no se introduce un score global ni una decisión global del producto.

## Evidencia mínima

La ejecución debe conservar, como mínimo:

```text
01-observations.json
02-evaluation-result.json
03-visual-report.html
04-execution-notes.md
```

`execution-notes.md` debe registrar fecha/hora, SUT, versión del SUT, interfaz utilizada, evaluador, modelo, versión, prompt, método, casos, repeticiones, incidencias y limitaciones.

## Regla de estado

La presencia del protocolo, el arnés o un resultado sintácticamente válido no constituye por sí sola validación de F2-VAL-05. El estado solo puede pasar a `VALIDADO` después de disponer de evidencia de una ejecución externa real y reproducible.
