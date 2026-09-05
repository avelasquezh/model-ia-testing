# ADR-006 — Estrategia de pruebas, BDD, Cucumber y TDD

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05

## Contexto

El proyecto exige POO, BDD, Gherkin, Cucumber, automatización con Playwright y validación mediante GitHub Actions. La estrategia debe evitar que las pruebas E2E sean la única forma de validar el sistema.

## Decisión propuesta

Adoptar una estrategia por niveles:

1. **Unitarias:** dominio y reglas puras; feedback rápido.
2. **Aplicación:** casos de uso y puertos mediante dobles de prueba.
3. **Integración:** adaptadores reales contra dependencias controladas.
4. **BDD/Acceptance:** Gherkin + Cucumber para comportamiento observable y criterios de aceptación.
5. **E2E:** Playwright para validar la interacción real con navegador y chatbot objetivo cuando corresponda.

BDD será el mecanismo principal de especificación de comportamiento a nivel de aceptación. TDD se aplicará principalmente a dominio y aplicación cuando ayude a diseñar contratos pequeños y testeables.

## Regla de trazabilidad

Cada comportamiento relevante deberá poder relacionarse, cuando aplique, con:

`REQ → Acceptance Criteria → Feature/Scenario → Step → Use Case → Código → Test → CI`

## POM / Screenplay

No se impone POM ni Screenplay desde este ADR. Se realizará un spike de automatización de UI y se seleccionará la abstracción que mejor reduzca duplicación y mantenga legibilidad. Si una abstracción no aporta valor, deberá documentarse su exclusión.

## Consecuencias

Se obtiene feedback rápido en capas inferiores y se reserva Playwright para comportamientos que realmente requieren navegador. Aumenta el número de artefactos de prueba y exige disciplina de trazabilidad.

## Criterios de validación

- Un caso de uso puede probarse sin navegador.
- Existen features Gherkin trazables a requisitos.
- Cucumber ejecuta escenarios en CI.
- Playwright ejecuta al menos un flujo real.
- Un fallo en una prueba de nivel inferior bloquea el pipeline antes de E2E.

## Estado

**Propuesta.** La estructura definitiva de carpetas y convenciones se definirá durante el diseño detallado.
