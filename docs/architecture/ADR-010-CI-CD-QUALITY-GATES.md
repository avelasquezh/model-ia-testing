# ADR-010 — CI/CD y Quality Gates

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05

## Contexto

El proyecto debe validar automáticamente su propio funcionamiento mediante GitHub Actions. La calidad no debe depender únicamente de una revisión manual antes del despliegue.

## Decisión propuesta

GitHub Actions será el mecanismo CI/CD del repositorio. El pipeline se estructurará progresivamente en gates:

1. validación de formato y lint;
2. compilación/type-check;
3. pruebas unitarias;
4. pruebas de aplicación;
5. pruebas de integración;
6. BDD/Cucumber;
7. E2E/Playwright cuando el entorno de CI lo permita;
8. generación y publicación de artefactos de prueba/evidencia;
9. quality gate final.

Los niveles costosos no deberán ejecutarse antes de los checks rápidos salvo que exista una razón explícita.

## Política de fallo

Un gate obligatorio fallido bloquea la promoción del cambio. Los checks informativos no deben presentarse como aprobaciones.

Los artefactos de pruebas deberán conservarse cuando sean necesarios para diagnóstico y auditoría, respetando límites de tamaño y datos sensibles.

## Trazabilidad

El pipeline deberá poder relacionar:

`Commit/PR → Workflow → Job → Test → Resultado → Artefacto`

## Seguridad

Secretos se gestionarán mediante mecanismos de secretos del entorno de CI y nunca se almacenarán en el repositorio. Los workflows deberán utilizar permisos mínimos y versiones fijadas o controladas de acciones cuando sea viable.

## Patrones y principios

- Quality Gate: cada etapa establece condiciones objetivas de promoción.
- Fail Fast: primero validaciones rápidas.
- Test Pyramid: priorización de pruebas inferiores.
- Infrastructure as Code será considerado cuando la infraestructura del proyecto sea codificada.

## Criterios de validación

1. Un commit defectuoso puede ser bloqueado automáticamente.
2. El pipeline ejecuta las pruebas requeridas en orden lógico.
3. Los resultados son visibles en GitHub.
4. Los artefactos necesarios son recuperables.
5. Ningún secreto requerido por CI aparece en código o logs.
6. La misma suite puede ejecutarse localmente y en CI con diferencias documentadas.

## Estado

**Propuesta.** Los workflows concretos y thresholds de quality gates se definirán después de existir una base ejecutable y durante el Frente de CI/CD.
