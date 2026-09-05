# ADR-013 — Observabilidad

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

Una plataforma de testing necesita distinguir fallos funcionales de fallos operacionales de su propia infraestructura. Además, la ejecución debe ser reconstruible mediante logs, métricas y trazas sin exponer información sensible.

## Decisión

La observabilidad se tratará como una capacidad transversal y desacoplada del dominio.

El sistema deberá producir, cuando aplique:

- logs estructurados;
- métricas operacionales;
- correlación mediante identificadores de ejecución/caso/escenario;
- eventos técnicos relevantes;
- información suficiente para diagnosticar errores sin depender del texto libre de los logs.

Los logs no serán la fuente primaria de evidencia funcional cuando exista evidencia capturada específicamente para el criterio.

Se evitará registrar secretos, credenciales, tokens y datos sensibles innecesarios. El contenido conversacional deberá tratarse según una política de retención y exposición definida.

## Identificadores mínimos

Las operaciones relevantes deberán poder correlacionarse con un identificador de ejecución y, cuando corresponda, escenario, paso y evidencia.

## Principios y patrones

- Separation of Concerns.
- Structured Logging.
- Correlation Identifier.
- Observability as Cross-Cutting Concern.
- Adapter para mecanismos concretos de logging/metrics/tracing.

## Criterios de validación

1. Un fallo técnico puede correlacionarse con una ejecución concreta.
2. Los logs son estructurados y consultables.
3. Los secretos no aparecen en logs.
4. La observabilidad no modifica las reglas de negocio.
5. Las pruebas pueden verificar eventos operacionales relevantes.

## Consecuencia

Se facilita diagnóstico y auditoría sin convertir logs en una dependencia del dominio ni confundir observabilidad técnica con evidencia de calidad del chatbot evaluado.
