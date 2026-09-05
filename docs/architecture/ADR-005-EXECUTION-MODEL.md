# ADR-005 — Modelo de ejecución controlada

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05
**Decisores:** Proyecto model-ia-testing

## Contexto

La ejecución de escenarios requiere abrir un navegador, interactuar con un sistema externo, capturar evidencia y finalizar de manera determinista. El sistema debe impedir ejecuciones indefinidas y debe aislar los riesgos derivados de objetivos externos.

El requisito funcional ya establece sesión de navegador controlada, interacción multi-turno, tiempos observables, detección de errores y límites de ejecución. fileciteturn6file0

## Decisión propuesta

Para el MVP se adopta un **modelo de ejecución síncrona a nivel de caso de uso**, con una frontera clara entre el orquestador de aplicación y el adaptador de navegador.

La ejecución deberá tener:

- identificador único;
- estado operacional explícito;
- timeout global;
- timeout por operación cuando corresponda;
- cancelación controlada;
- captura de evidencia durante la ejecución;
- registro de errores técnicos observables;
- resultado final persistido.

La ejecución asíncrona mediante cola/worker queda como evolución posterior y no se introduce hasta que concurrencia, duración o aislamiento operacional lo justifiquen.

## Justificación

El MVP necesita reducir complejidad y conservar trazabilidad directa entre solicitud, ejecución y resultado. Una cola distribuida desde el inicio introduciría infraestructura adicional antes de demostrar que existe una necesidad real.

La frontera de ejecución debe permanecer abstraída para permitir posteriormente ejecutar mediante worker sin modificar el dominio ni los criterios de evaluación.

## Alternativas consideradas

### Cola + worker desde el MVP

Ventajas: mejor desacoplamiento temporal y posibilidad de escalar ejecuciones.

Desventajas: añade broker, estados distribuidos, reintentos, idempotencia y observabilidad antes de necesitarlos.

### Ejecución completamente dentro de la capa HTTP

No recomendada: acopla una operación potencialmente larga al ciclo de solicitud HTTP y dificulta control, cancelación y evolución.

### Ejecución síncrona en el proceso de aplicación

Es la opción base para el MVP siempre que la API no mantenga abierta una solicitud HTTP durante toda la ejecución; el caso de uso podrá ser invocado por una interfaz adecuada y su duración deberá estar controlada.

## Seguridad operacional

Los objetivos externos se consideran no confiables desde el punto de vista operacional. La implementación deberá aplicar límites de navegación, tiempo, recursos y almacenamiento.

El detalle del aislamiento físico del navegador se mantiene en el ADR de Playwright y en el diseño de despliegue.

## Patrones y principios

- Command/Application Service: una ejecución representa una operación explícita del sistema.
- State Machine: los estados operacionales deben permitir transiciones válidas y verificables.
- Dependency Inversion: el caso de uso depende de puertos de ejecución.
- Adapter: Playwright implementa el puerto de navegador.
- Strategy: la estrategia de ejecución podrá evolucionar sin alterar el dominio.
- Idempotency: deberá analizarse para operaciones que puedan ser reintentadas en el futuro.

## Criterios de validación

1. Una ejecución no puede quedar indefinidamente en `RUNNING`.
2. Un timeout produce un estado final trazable.
3. Una cancelación produce un estado final trazable.
4. Los errores del adaptador no destruyen la evidencia ya capturada.
5. Una ejecución conserva la configuración efectiva utilizada.
6. La lógica de dominio puede probarse sin iniciar un navegador real.

## Estado

**Propuesta.** La necesidad de ejecución distribuida y el modelo definitivo de concurrencia se decidirán después del spike y de las pruebas de carga del MVP.
