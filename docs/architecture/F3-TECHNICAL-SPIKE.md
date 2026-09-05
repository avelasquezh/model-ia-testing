# Frente 3 — Spike técnico de arquitectura

**Versión:** 1.0  
**Estado:** Pendiente de ejecución

## 1. Objetivo

Validar mediante un incremento ejecutable que las decisiones arquitectónicas principales pueden materializarse sin romper los límites definidos.

El spike no pretende construir el MVP. Su propósito es reducir incertidumbre arquitectónica antes de iniciar desarrollo productivo.

## 2. Hipótesis

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions puede proporcionar una base mantenible, testeable y auditable para el MVP.

## 3. Alcance mínimo

El spike deberá contener un vertical slice mínimo que atraviese:

`Gherkin → Step → Caso de uso → Dominio → Puerto → Adaptador → Evidencia → Persistencia → CI`

Debe existir además una ejecución Playwright controlada.

## 4. Validaciones

| ID | Validación | Evidencia requerida | Criterio |
|---|---|---|---|
| SPIKE-001 | TypeScript estricto | Log de compilación | Compila sin errores |
| SPIKE-002 | Dominio independiente | Test unitario | Ejecuta sin infraestructura |
| SPIKE-003 | Aplicación mediante puertos | Test con doble | Caso de uso sin adapter real |
| SPIKE-004 | Gherkin/Cucumber | Resultado Cucumber | Escenario ejecutado |
| SPIKE-005 | Playwright | Reporte/artifact | Interacción controlada exitosa |
| SPIKE-006 | Sustitución browser | Test de aplicación | No requiere navegador real |
| SPIKE-007 | PostgreSQL | Migración + test | Esquema reproducible |
| SPIKE-008 | Evidencia | Artifact + metadata | Evidencia relacionada con run |
| SPIKE-009 | GitHub Actions | Workflow run | Gates ejecutados |
| SPIKE-010 | Dependencias arquitectónicas | Análisis estático/configuración | Violaciones críticas detectables |
| SPIKE-011 | Configuración | Test de configuración | Fallo explícito ante configuración inválida |
| SPIKE-012 | Observabilidad | Logs estructurados | Run correlacionable |

## 5. Criterios de éxito

El spike será **VALIDADO** cuando todas las validaciones obligatorias pasen y no exista una contradicción arquitectónica crítica.

Será **VALIDADO CON CAMBIOS** cuando la hipótesis sea viable pero una o más decisiones deban modificarse sin invalidar la arquitectura general.

Será **NO VALIDADO** cuando exista una incompatibilidad fundamental que obligue a replantear la arquitectura o el stack.

## 6. Evidencia del spike

La evidencia deberá incluir como mínimo:

- commit exacto;
- workflow de GitHub Actions;
- resultados de tests;
- logs relevantes;
- reporte Cucumber;
- artefactos Playwright;
- migraciones ejecutadas;
- referencia a la evidencia generada;
- incidencias o desviaciones encontradas;
- conclusión final.

## 7. Regla de decisión

No se considerará que una tecnología fue validada solo porque instala o compila. Debe demostrar que funciona dentro de los límites arquitectónicos definidos.

No se aprobará un patrón por presencia nominal. Debe existir un problema que resuelva y una evidencia que demuestre que no introduce complejidad injustificada.

## 8. Resultado esperado

El spike debe producir una decisión formal sobre:

- stack;
- estructura modular;
- estrategia BDD/TDD;
- estrategia de automatización de navegador;
- persistencia;
- evidencia;
- CI/CD;
- controles arquitectónicos.

Las decisiones que continúen siendo inciertas permanecerán como propuestas en sus ADR correspondientes.
