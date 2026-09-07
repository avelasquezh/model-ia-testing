# Frente 3 — Spike técnico de arquitectura

**Versión:** 1.0  
**Estado:** **VALIDADO**

## 1. Objetivo

Validar mediante un incremento ejecutable que las decisiones arquitectónicas principales pueden materializarse sin romper los límites definidos.

El spike no pretende construir el MVP. Su propósito es reducir incertidumbre arquitectónica antes de iniciar desarrollo productivo.

## 2. Hipótesis

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions puede proporcionar una base mantenible, testeable y auditable para el MVP.

## 3. Alcance mínimo

El spike contiene un vertical slice mínimo que atraviesa:

`Gherkin → Step → Caso de uso → Dominio → Puerto → Adaptador → Evidencia → Persistencia → CI`

Existe además una ejecución Playwright controlada.

## 4. Validaciones

| ID | Validación | Evidencia observada | Resultado |
|---|---|---|---|
| SPIKE-001 | TypeScript estricto | Workflow `34089149510`, compilación sin errores | PASS |
| SPIKE-002 | Dominio independiente | Pruebas unitarias del dominio sin infraestructura | PASS |
| SPIKE-003 | Aplicación mediante puertos | Pruebas con dobles de aplicación | PASS |
| SPIKE-004 | Gherkin/Cucumber | Cucumber ejecutado en workflow | PASS |
| SPIKE-005 | Playwright | Reporte HTML publicado en artifact | PASS |
| SPIKE-006 | Sustitución browser | Pruebas de aplicación sin navegador real | PASS |
| SPIKE-007 | PostgreSQL | Migraciones y pruebas de integración reproducibles | PASS |
| SPIKE-008 | Evidencia | Manifiesto `artifacts/spike-008-evidence-manifest.json` con run, commit y SHA-256 | PASS |
| SPIKE-009 | GitHub Actions | Gates CI ejecutados y completados | PASS |
| SPIKE-010 | Dependencias arquitectónicas | Regla estática que detecta dependencias prohibidas en dominio | PASS |
| SPIKE-011 | Configuración | Prueba de configuración inválida con fallo explícito | PASS |
| SPIKE-012 | Observabilidad | Log JSON estructurado correlacionado mediante `runId` | PASS |

## 5. Criterios de éxito

El spike queda **VALIDADO** porque todas las validaciones obligatorias pasan y no se observó una contradicción arquitectónica crítica en la evidencia ejecutable.

## 6. Evidencia del spike

Evidencia principal de cierre:

- workflow: `Architecture Spike` run `34089149510`;
- commit evaluado: `3fb8db1877679486d75cd7ff1af30ef94740c1a6`;
- artifact: `architecture-spike-evidence`;
- manifiesto: `artifacts/spike-008-evidence-manifest.json`;
- digest del artifact: `sha256:50fdcb7f797593a84b770a7b5a6f82bfe3603726b4fc8eb56dfd50a48844e169`;
- el manifiesto registra además hashes SHA-256 de los archivos de evidencia publicados.

## 7. Regla de decisión

No se considera que una tecnología fue validada solo porque instala o compila. En este spike las tecnologías y límites incluidos en las validaciones demostraron comportamiento observable dentro de la arquitectura definida.

No se aprueba un patrón por presencia nominal. La evidencia del spike respalda las decisiones que pasan las validaciones; las decisiones fuera de este alcance permanecen pendientes.

## 8. Resultado

La hipótesis arquitectónica es **VALIDADA** para continuar hacia el desarrollo incremental del MVP.

Quedan fuera del cierre de F3 las decisiones aún pendientes en `PENDING-DECISIONS.md`, incluyendo aspectos de seguridad operativa, SAST/secret scanning, políticas definitivas de ramas/protección y decisiones metodológicas del Frente 2.
