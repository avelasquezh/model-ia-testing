# ADR-002 — Estilo arquitectónico del MVP

**Estado:** Aceptada como baseline  
**Fecha:** 2026-09-05

## Contexto

El producto debe automatizar pruebas sobre chatbots web, conservar evidencia, evaluar resultados y generar reportes. Los requisitos exigen testabilidad, trazabilidad, mantenibilidad, extensibilidad y separación entre evidencia e interpretación.

La arquitectura debe permitir sustituir Playwright, persistencia o proveedores de IA sin trasladar dependencias de infraestructura al dominio.

## Decisión

El MVP utilizará un **monolito modular con arquitectura hexagonal (Ports and Adapters)**.

La aplicación se desplegará inicialmente como una unidad principal, con módulos y límites internos explícitos. El dominio no dependerá de frameworks ni infraestructura. Los casos de uso utilizarán puertos y los adaptadores implementarán integraciones externas.

## Alternativas

**Microservicios:** no se seleccionan para el MVP porque introducen complejidad distribuida antes de que exista evidencia de necesidad.

**Capas tradicional:** es viable, pero no establece por sí sola un límite suficientemente fuerte frente a infraestructura.

**Clean/Onion:** son compatibles conceptualmente. Se adoptan sus principios de dependencia hacia el núcleo sin duplicar estructuras arquitectónicas.

## Consecuencias

Positivas: alta testabilidad del dominio, sustitución controlada de adaptadores, simulación de navegador/reloj/persistencia/IA y evolución posterior si aparece una necesidad real.

Negativas: exige disciplina para mantener límites y puede producir abstracciones innecesarias si se diseñan antes de conocer casos reales.

## Patrones relacionados

- Ports and Adapters.
- Adapter.
- Dependency Injection.
- Repository cuando la persistencia lo justifique.
- Strategy cuando existan algoritmos intercambiables.

## Validación

Las pruebas deberán demostrar que las reglas de dominio y casos de uso pueden ejecutarse sin depender directamente de Playwright, PostgreSQL o un proveedor concreto de IA.

## Trazabilidad

Esta decisión se relaciona con los requisitos de mantenibilidad, testabilidad, trazabilidad y ejecución, y con el Frente 2 respecto a la separación entre observación, evidencia, verificación y evaluación.
