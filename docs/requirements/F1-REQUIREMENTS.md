# Frente 1 — Especificación de Requisitos

**Versión:** 0.2  
**Estado:** Draft para validación  

## Propósito

`model-ia-testing` automatiza pruebas sobre sistemas conversacionales mediante interacción externa controlada. El MVP configura un chatbot web, ejecuta escenarios conversacionales, captura evidencia y produce resultados y hallazgos trazables.

La cadena conceptual es:

**ejecución → evidencia → resultado → hallazgo → evaluación → calificación**

Evaluación y calificación quedan fuera de esta baseline.

## Alcance incluido

- Chatbot accesible mediante navegador.
- Automatización de navegador.
- Escenarios conversacionales y multi-turno.
- Entradas, respuestas y resultados esperados.
- Ejecución automatizada.
- Evidencia: transcript, timestamps, duración, screenshots, URL y errores observables.
- Resultados por escenario.
- Hallazgos.
- Reportes.
- Persistencia.
- Trazabilidad.
- Pruebas automatizadas del producto.
- GitHub Actions.

## Fuera del MVP

WhatsApp, Messenger, Telegram, APIs privadas del chatbot, código fuente, prompt interno, RAG interno, bases de datos internas, pentesting profundo, infraestructura interna, entrenamiento/fine-tuning, ejecución distribuida, monitoreo continuo e integración CI/CD con sistemas externos.

## Principio de evidencia

> La IA interpreta evidencia; no reemplaza evidencia.

El sistema deberá distinguir comportamiento observado, interpretación e información no observable. No deberá presentar como hecho una característica interna que no haya sido observada o proporcionada explícitamente como información autorizada.

## Requisitos

### F1-01 — Gestión del objetivo

- REQ-F1-001: Registrar un chatbot objetivo mediante identificador único.
- REQ-F1-002: Registrar la URL de acceso.
- REQ-F1-003: Activar o desactivar un chatbot registrado.
- REQ-F1-004: Validar disponibilidad antes de ejecutar.
- REQ-F1-005: Conservar la configuración efectiva utilizada por cada ejecución.

### F1-02 — Gestión de escenarios

- REQ-F1-006: Crear escenarios.
- REQ-F1-007: Identificar cada escenario de forma única.
- REQ-F1-008: Registrar nombre, objetivo y descripción.
- REQ-F1-009: Definir secuencia de entradas conversacionales.
- REQ-F1-010: Definir comportamiento esperado.
- REQ-F1-011: Representar múltiples turnos.
- REQ-F1-012: Definir condiciones de finalización.
- REQ-F1-013: Versionar escenarios.
- REQ-F1-014: Conservar la versión utilizada por cada ejecución.
- REQ-F1-015: Agrupar escenarios en suites.

### F1-03 — Ejecución

- REQ-F1-016: Ejecutar un escenario individual.
- REQ-F1-017: Ejecutar una suite.
- REQ-F1-018: Crear una sesión de navegador controlada.
- REQ-F1-019: Acceder al objetivo configurado.
- REQ-F1-020: Interactuar con la interfaz conversacional.
- REQ-F1-021: Enviar entradas definidas.
- REQ-F1-022: Identificar la respuesta del chatbot.
- REQ-F1-023: Soportar múltiples turnos.
- REQ-F1-024: Registrar tiempos observables.
- REQ-F1-025: Detectar errores técnicos observables.
- REQ-F1-026: Impedir ejecuciones indefinidas.
- REQ-F1-027: Registrar estado final.

Estados iniciales previstos: `PENDING`, `RUNNING`, `PASSED`, `FAILED`, `PARTIALLY_PASSED`, `INCONCLUSIVE`, `NOT_EVALUABLE`, `ERROR`, `CANCELLED`.

### F1-04 — Evidencia

- REQ-F1-028: Generar evidencia asociada a cada ejecución.
- REQ-F1-029: Conservar transcript.
- REQ-F1-030: Registrar timestamps relevantes.
- REQ-F1-031: Registrar duraciones relevantes.
- REQ-F1-032: Capturar screenshots.
- REQ-F1-033: Registrar URL utilizada.
- REQ-F1-034: Registrar errores técnicos observados.
- REQ-F1-035: Asociar evidencia con ejecución.
- REQ-F1-036: Relacionar evidencia con resultados y hallazgos.
- REQ-F1-037: Conservar contexto mínimo para reproducibilidad/investigación.
- REQ-F1-038: Identificar versión del escenario.
- REQ-F1-039: Identificar versión del sistema de pruebas.

### F1-05 — Resultados

- REQ-F1-040: Producir resultado por escenario.
- REQ-F1-041: Asociar resultado a ejecución.
- REQ-F1-042: Relacionar resultado con evidencia.
- REQ-F1-043: Distinguir resultado de ejecución y evaluación de calidad.
- REQ-F1-044: Identificar ejecuciones inconclusas.
- REQ-F1-045: Identificar comportamientos no evaluables mediante evidencia observable.
- REQ-F1-046: Registrar causa de resultado inconcluso o no evaluable.

### F1-06 — Hallazgos

- REQ-F1-047: Registrar hallazgos derivados de pruebas.
- REQ-F1-048: Identificar cada hallazgo de forma única.
- REQ-F1-049: Registrar título y descripción.
- REQ-F1-050: Identificar escenario relacionado.
- REQ-F1-051: Registrar esperado y observado cuando aplique.
- REQ-F1-052: Relacionar hallazgo con evidencia.
- REQ-F1-053: Registrar impacto, severidad y riesgo.
- REQ-F1-054: Sujetar impacto, severidad y riesgo a metodología posterior.

### F1-07 — Reportes

- REQ-F1-055: Generar reporte de una ejecución o conjunto de ejecuciones.
- REQ-F1-056: Identificar objetivo.
- REQ-F1-057: Identificar versión del escenario.
- REQ-F1-058: Presentar escenarios ejecutados.
- REQ-F1-059: Presentar resultados.
- REQ-F1-060: Presentar hallazgos.
- REQ-F1-061: Relacionar hallazgos con evidencia.
- REQ-F1-062: Distinguir evidencia observada de interpretación.
- REQ-F1-063: Identificar limitaciones de observabilidad.
- REQ-F1-064: Identificar aspectos no evaluables.
- REQ-F1-065: Identificar versión del sistema ejecutor.

### F1-08 — Trazabilidad

- REQ-F1-066: Identificar requisitos de forma única.
- REQ-F1-067: Relacionar escenarios con requisitos.
- REQ-F1-068: Relacionar ejecuciones con escenarios.
- REQ-F1-069: Relacionar resultados con ejecuciones.
- REQ-F1-070: Relacionar hallazgos con evidencia.
- REQ-F1-071: Determinar cobertura de pruebas por requisito.
- REQ-F1-072: Identificar requisitos sin cobertura.
- REQ-F1-073: Mantener trazabilidad como artefacto auditable.

### F1-09 — Calidad del producto

- REQ-F1-074: Mantener separación adecuada de responsabilidades.
- REQ-F1-075: Permitir pruebas aisladas cuando corresponda.
- REQ-F1-076: Desacoplar dependencias externas del dominio cuando resulte apropiado.
- REQ-F1-077: Aplicar POO cuando sea pertinente.
- REQ-F1-078: Evaluar SOLID.
- REQ-F1-079: Aplicar Clean Code.
- REQ-F1-080: Documentar y justificar patrones utilizados.
- REQ-F1-081: Evitar patrones introducidos solo por formalismo.
- REQ-F1-082: Documentar decisiones arquitectónicas relevantes.

### F1-10 — BDD y automatización

- REQ-F1-083: Definir criterios de aceptación verificables para requisitos funcionales relevantes.
- REQ-F1-084: Representar comportamientos funcionales mediante BDD cuando sea apropiado.
- REQ-F1-085: Utilizar Gherkin.
- REQ-F1-086: Mantener trazabilidad BDD → requisito.
- REQ-F1-087: Automatizar comportamientos críticos.
- REQ-F1-088: Organizar pruebas según estrategia de niveles.
- REQ-F1-089: Considerar riesgo en la estrategia de pruebas.
- REQ-F1-090: Determinar dónde aplicar TDD y BDD.
- REQ-F1-091: Utilizar Playwright para automatización de interfaz del MVP.
- REQ-F1-092: Seleccionar y justificar patrón de abstracción de UI.

### F1-11 — Seguridad y límites

- REQ-F1-093: Aislar ejecución automatizada del entorno principal cuando la arquitectura lo requiera.
- REQ-F1-094: Evitar secretos en código fuente.
- REQ-F1-095: Gestionar configuración sensible mediante mecanismos seguros.
- REQ-F1-096: Limitar ejecuciones a objetivos autorizados.
- REQ-F1-097: Controlar tiempo máximo de ejecución.
- REQ-F1-098: Registrar errores de seguridad u operación detectados.
- REQ-F1-099: Considerar aislamiento y restricciones de navegación hacia objetivos externos.

### F1-12 — CI/CD

- REQ-F1-100: Disponer de GitHub Actions.
- REQ-F1-101: Validar cambios automáticamente.
- REQ-F1-102: Ejecutar pruebas automatizadas.
- REQ-F1-103: Ejecutar validaciones BDD aplicables.
- REQ-F1-104: Ejecutar validaciones de calidad de código seleccionadas.
- REQ-F1-105: Aplicar quality gates.
- REQ-F1-106: Producir evidencia de pruebas cuando sea viable.
- REQ-F1-107: Identificar versión evaluada en artefactos CI.
- REQ-F1-108: Impedir integración de cambios que incumplan quality gates cuando las reglas del repositorio estén configuradas.

### F1-13 — Documentación y gobierno

- REQ-F1-109: Mantener requisitos actualizados.
- REQ-F1-110: Mantener matriz de trazabilidad.
- REQ-F1-111: Mantener Definition of Done.
- REQ-F1-112: Documentar decisiones arquitectónicas mediante ADR.
- REQ-F1-113: Documentar decisiones metodológicas que afecten evaluación.
- REQ-F1-114: Registrar cambios relevantes de requisitos.
- REQ-F1-115: Versionar artefactos de calidad junto con el producto.

## Criterio de aceptación del MVP

El MVP deberá demostrar de extremo a extremo: registrar objetivo, crear escenario, ejecutar mediante Playwright, completar una interacción multi-turno, capturar evidencia, producir resultado, asociar evidencia, registrar un hallazgo cuando corresponda, generar reporte, mantener trazabilidad y validar el producto mediante GitHub Actions.

## Pendientes explícitos

La definición de dimensiones de evaluación, criterios de calidad, métricas, scoring, pesos, fórmula, umbrales y reglas de interpretación queda fuera de esta baseline y deberá definirse en el Frente 2.
