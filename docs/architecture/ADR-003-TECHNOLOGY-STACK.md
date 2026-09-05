# ADR-003 — Selección del stack tecnológico principal

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05
**Decisores:** Proyecto model-ia-testing

## Contexto

El MVP necesita implementar una plataforma de pruebas conversacionales cuyo núcleo incluye casos de uso, dominio, persistencia, automatización de navegador con Playwright, BDD/Gherkin/Cucumber, pruebas automatizadas y CI/CD.

La selección del stack debe favorecer testabilidad, tipado, mantenibilidad, integración con Playwright y Cucumber, facilidad de ejecución en contenedores y capacidad de evolución sin acoplar el dominio a infraestructura.

## Decisión propuesta

Adoptar **TypeScript sobre Node.js** como lenguaje y runtime principal del producto.

Componentes previstos:

- TypeScript para dominio, aplicación y adaptadores propios.
- Node.js como runtime.
- Playwright para automatización de navegador.
- Cucumber.js para BDD/Gherkin.
- Framework HTTP desacoplado mediante un adaptador, cuya selección concreta queda para diseño detallado.
- PostgreSQL como persistencia relacional, sujeto al ADR específico de persistencia.
- GitHub Actions como plataforma CI/CD.

La decisión no obliga a que cada componente use una librería concreta cuando exista una alternativa mejor justificada.

## Justificación

TypeScript permite tipado estático, favorece contratos explícitos y comparte ecosistema con Playwright y Cucumber.js. Esto reduce la cantidad de tecnologías necesarias para el MVP y facilita que las pruebas de aceptación y la automatización de navegador pertenezcan al mismo ecosistema técnico.

Node.js proporciona un runtime adecuado para automatización de navegador y servicios HTTP, y permite ejecutar las mismas bases de código en desarrollo, contenedores y CI.

## Alternativas consideradas

### Java + Cucumber + Playwright Java

Ventajas: ecosistema empresarial maduro, fuerte tipado y amplia experiencia en automatización.

Desventajas: introduce un ecosistema distinto al de Playwright principal y aumenta la superficie tecnológica del MVP.

### Python + pytest/Behave + Playwright Python

Ventajas: excelente ecosistema para IA y automatización.

Desventajas: la integración BDD/Cucumber requerida introduce una combinación menos directa que TypeScript + Cucumber.js para el objetivo definido.

### JavaScript sin TypeScript

Ventaja: menor barrera inicial.

Desventaja: menor seguridad de tipos y menor capacidad para mantener contratos explícitos en un sistema con múltiples puertos, adaptadores y objetos de dominio.

## Consecuencias positivas

- Un único lenguaje para núcleo, automatización y BDD.
- Integración natural con Playwright.
- Tipado estático para contratos y puertos.
- Buen encaje con contenedores y CI.
- Menor diversidad tecnológica inicial.

## Consecuencias negativas

- Requiere disciplina para evitar que TypeScript se convierta en JavaScript con tipos superficiales.
- El ecosistema Node permite múltiples formas de estructurar el código; deberán imponerse convenciones arquitectónicas mediante linting, revisión y pruebas.
- Algunas capacidades de IA pueden estar más maduras en Python; si posteriormente se requiere un componente especializado, deberá integrarse mediante un puerto y no contaminar el dominio.

## Patrones y principios afectados

- Dependency Inversion: los contratos del dominio/aplicación no dependen del runtime concreto.
- Hexagonal Architecture: TypeScript no determina los límites arquitectónicos.
- Dependency Injection: las dependencias se compondrán fuera de los casos de uso.
- BDD: Gherkin/Cucumber será una capa de especificación y aceptación.
- Test Pyramid: Playwright no será el único nivel de prueba.

## Criterios de validación

La decisión deberá validarse mediante un spike técnico que demuestre:

1. compilación TypeScript con configuración estricta;
2. ejecución de una prueba unitaria de dominio;
3. ejecución de un escenario Cucumber/Gherkin;
4. ejecución de una prueba Playwright mínima;
5. ejecución completa en GitHub Actions;
6. separación verificable entre dominio y Playwright.

## Estado

**Propuesta.** No se considera decisión definitiva hasta ejecutar y documentar el spike técnico y comprobar los criterios anteriores.
