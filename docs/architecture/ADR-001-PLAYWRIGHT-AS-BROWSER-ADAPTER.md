# ADR-001 — Playwright como adaptador de automatización web

**Estado:** Aceptada como baseline  
**Fecha:** 2026-09-05

## Contexto

El MVP necesita interactuar con chatbots accesibles mediante navegador y capturar evidencia observable: respuestas, tiempos, screenshots, DOM y errores visibles.

La automatización de navegador no debe contaminar las reglas de negocio ni impedir pruebas rápidas sin navegador.

## Decisión

Se utilizará **Playwright** como implementación inicial del puerto de automatización de navegador.

Playwright quedará detrás de una abstracción propia del sistema. El dominio y los casos de uso no deberán importar directamente APIs de Playwright.

## Justificación

La herramienta cubre interacción con navegadores y captura de artefactos necesarios para el objetivo del MVP. La decisión se limita al adaptador web; no implica que Playwright sea responsable de evaluación, scoring o generación de conclusiones.

## Alternativas

**Selenium:** técnicamente viable, pero no se selecciona como primera implementación porque el proyecto prioriza una API moderna de automatización y capacidades integradas de captura.

**Automatización HTTP directa:** no es suficiente para el alcance inicial porque el producto debe evaluar el comportamiento observable de una interfaz web y sus interacciones.

## Consecuencias

Positivas: separación entre automatización y dominio, posibilidad de usar dobles de prueba y capacidad de conservar evidencia del navegador.

Negativas: ejecución de navegador es más costosa que pruebas puramente unitarias y requiere controles de aislamiento, timeout, navegación y seguridad.

## Restricción de seguridad

Los objetivos externos deben tratarse como no confiables. La arquitectura de ejecución deberá incorporar aislamiento, límites de tiempo, control de navegación y manejo seguro de artefactos antes de considerar la ejecución como producción-ready.

## Validación

La implementación deberá demostrar mediante pruebas que el puerto de navegador puede ser simulado y que los casos de uso no dependen de Playwright.

## Trazabilidad

Se relaciona con los requisitos de ejecución, interacción web, captura de evidencia, reproducibilidad, seguridad y automatización del Frente 1.
