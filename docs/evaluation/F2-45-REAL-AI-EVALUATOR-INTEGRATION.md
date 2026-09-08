# F2-VAL-05 — Validación controlada de evaluador semántico IA real

**Estado:** **EN EJECUCIÓN — ARNÉS AGNÓSTICO AL BOT MATERIALIZADO**

## Propósito

F2-VAL-05 valida comportamiento semántico observable de un evaluador IA real sin convertir el bot bajo prueba en una dependencia arquitectónica del proyecto.

La prueba separa explícitamente dos sistemas:

1. **Bot bajo prueba (SUT):** cualquier bot que produzca una respuesta observable.
2. **Evaluador semántico:** componente externo que juzga esa respuesta contra una intención esperada.

El proyecto no asume una URL, SDK, proveedor, framework, canal, webhook, estructura de conversación ni mecanismo de autenticación del bot bajo prueba.

## Límite arquitectónico

El dominio depende únicamente de `SemanticEvaluatorPort`. No conoce SDKs, formatos propietarios, credenciales ni detalles de infraestructura externa.

La frontera del bot se representa mediante `BotObservation`, definida en `src/domain/evaluation/BotObservation.ts`. Esta observación contiene únicamente hechos necesarios para evaluar el comportamiento:

- mensaje de entrada;
- respuesta observable;
- intención esperada y su versión;
- evidencia primaria;
- repetición, turno y conversación;
- metadatos opcionales de canal, transporte, bot, versión y ejecución.

Ninguno de esos campos obliga a que el SUT sea web, Messenger, WhatsApp u otra arquitectura.

La integración del evaluador continúa utilizando `HttpSemanticEvaluatorAdapter`. El endpoint pertenece al evaluador, no al bot bajo prueba.

## Separación SUT / evaluador

El flujo canónico es:

`canal o interfaz del bot -> bot bajo prueba -> respuesta observable -> BotObservation -> SemanticEvaluatorPort -> resultado normalizado`

La adquisición de `BotObservation` es deliberadamente externa al núcleo. Puede provenir de:

- captura manual controlada;
- un adaptador de navegador;
- una integración con una API de mensajería;
- una integración con webhooks;
- un export de conversaciones;
- cualquier otro mecanismo que produzca la observación contractual.

Agregar un adaptador para un canal no modifica el dominio ni el contrato del evaluador.

## Compatibilidad con bots de páginas web y mensajería

El contrato permite representar un bot probado desde una interfaz web o desde un canal de mensajería sin incorporar esas tecnologías al proyecto.

Por ejemplo, ChatBot.com dispone de un Testing Tool que permite conversar con el bot dentro del builder y activar Debug Mode para observar las acciones y pasos ejecutados. También ofrece una Sample Page para comprobar el comportamiento del Chat Widget. Estas capacidades son fuentes posibles de observaciones, no dependencias del framework de evaluación. citeturn0search0turn0search2turn0search4

El mismo contrato puede recibir observaciones provenientes de Messenger, WhatsApp u otro canal sin cambiar `BotObservation`. El canal solo se registra como metadato cuando sea útil para reconstrucción.

## Arnés controlado

`npm run evaluation:semantic:live` ya no contiene casos de negocio ni respuestas de un bot específico.

Ahora recibe las observaciones mediante:

`BOT_OBSERVATIONS_FILE`

Ejemplo neutral disponible en:

`examples/bot-observations.example.json`

La validación del archivo se centraliza en `src/application/evaluation/BotObservationSetValidator.ts`, evitando que el arnés y futuras fuentes de observación implementen reglas divergentes.

El arnés:

- valida el esquema de observaciones;
- conserva conversación, turno y repetición;
- conserva evidencia primaria;
- envía cada observación al evaluador semántico;
- verifica identidad y versión del criterio;
- verifica identidad y versión del evaluador;
- verifica versión de prompt y método;
- verifica identidad exacta de evidencia;
- valida el resultado contra `EvaluationMethodology`;
- calcula repetibilidad descriptiva por caso;
- conserva metadatos del SUT cuando hayan sido proporcionados;
- falla explícitamente ante respuestas incompatibles con el contrato.

La validación estructural cuenta con pruebas unitarias para versión de esquema, campos obligatorios, repetición, turno y evidencia.

Variables operativas del evaluador:

- `SEMANTIC_EVALUATOR_ENDPOINT` — obligatorio;
- `SEMANTIC_EVALUATOR_AUTHORIZATION` — opcional y externo al repositorio;
- `SEMANTIC_EVALUATOR_MODEL_ID`;
- `SEMANTIC_EVALUATOR_MODEL_VERSION`;
- `SEMANTIC_EVALUATOR_PROMPT_VERSION`;
- `SEMANTIC_EVALUATOR_METHOD_VERSION`;
- `SEMANTIC_EVALUATOR_CRITERION_ID` — opcional;
- `SEMANTIC_EVALUATOR_CRITERION_VERSION` — opcional.

## Criterio de cierre

F2-VAL-05 no se cerrará por la existencia del arnés. Requiere una ejecución reproducible contra un SUT real y un evaluador semántico externo real, con evidencia suficiente, procedencia completa y resultados trazables.

No se introducirá scoring global ni se transformará la salida semántica en un veredicto global del producto.
