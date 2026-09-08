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

Variables operativas del evaluador:

- `SEMANTIC_EVALUATOR_ENDPOINT` — obligatorio;
- `SEMANTIC_EVALUATOR_AUTHORIZATION` — opcional y externo al repositorio;
- `SEMANTIC_EVALUATOR_MODEL_ID`;
- `SEMANTIC_EVALUATOR_MODEL_VERSION`;
- `SEMANTIC_EVALUATOR_PROMPT_VERSION`;
- `SEMANTIC_EVALUATOR_METHOD_VERSION`.

Variable operativa del SUT:

- `BOT_OBSERVATIONS_FILE` — archivo de observaciones producido por el mecanismo de prueba elegido.

No se almacena ninguna URL del bot, token de canal, credencial o secreto en el repositorio.

## Principio de no contaminación

El ambiente de evaluación no debe contener:

- URL fija de un bot;
- selector CSS/XPath de una plataforma concreta;
- ID fijo de página o número de teléfono;
- webhook específico de proveedor;
- SDK de Messenger, WhatsApp u otro canal en el dominio;
- credenciales de un SUT;
- respuestas esperadas codificadas para un bot concreto.

Los adaptadores específicos, cuando se implementen, deben vivir fuera del dominio y producir `BotObservation`.

## Matriz de validación

La matriz ya no prescribe un bot concreto. Cada ejecución aporta sus propios casos y observaciones.

| Dimensión | Evidencia |
|---|---|
| Intención alineada | Resultado ordinal del evaluador |
| Intención no alineada | Resultado ordinal del evaluador |
| Evidencia ambigua o insuficiente | Resultado ordinal y/o `evidenceInsufficient=true` |
| Repetición | Consistencia ordinal por caso |
| Proveniencia | Modelo, versión, prompt, método, evidencia y ejecución |
| Canal | Metadato opcional, sin efecto arquitectónico |

Cada caso se repite bajo condiciones metodológicas equivalentes. La repetibilidad se registra descriptivamente y no se transforma en score global.

## Evidencia requerida para cerrar F2-VAL-05

La ejecución real debe conservar:

1. identidad y versión del modelo evaluador;
2. versión de prompt y método;
3. parámetros relevantes de generación, si existen;
4. entrada del usuario y respuesta observable del SUT;
5. intención esperada y versión;
6. evidencia primaria vinculada;
7. identidad del bot y versión, cuando estén disponibles;
8. canal/transporte, cuando estén disponibles;
9. salida normalizada del evaluador;
10. resultado de cada repetición;
11. errores de transporte, límite o esquema, si ocurren;
12. fecha e identificador de ejecución suficiente para reconstrucción.

## Criterio de salida

F2-VAL-05 podrá cerrarse cuando exista una ejecución real reproducible contra un SUT real, con procedencia completa, contrato válido y resultados observables suficientes para clasificar el comportamiento conforme al protocolo metodológico vigente.

La ejecución contra ChatBot.com puede utilizarse como una primera fuente de evidencia, pero no debe convertir esa plataforma en una dependencia del proyecto. Una posterior ejecución contra Messenger, WhatsApp o un bot web debe poder reutilizar el mismo contrato sin modificar el núcleo.

La existencia o ejecución del arnés por sí sola no constituye evidencia de comportamiento IA real.

No se introduce scoring global, ponderación ni aceptación/rechazo global del producto.
