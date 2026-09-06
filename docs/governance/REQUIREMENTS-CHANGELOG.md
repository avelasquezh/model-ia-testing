# Registro de cambios de requisitos

Este documento registra cambios relevantes sobre requisitos de la baseline de Frente 1. El historial de Git conserva la autoría, fecha y commit de cada modificación.

## 2026-09-06 — Baseline F1-13

- Se formaliza el registro de cambios relevantes de requisitos.
- Se mantiene `docs/requirements/F1-REQUIREMENTS.md` como fuente normativa de identificadores REQ-F1.
- Se mantiene `docs/requirements/F1-TRACEABILITY.md` como matriz auditable de cobertura.
- Se incorpora la regresión/autoevaluación como criterio operativo adicional para autorizar la continuidad entre incrementos.
- No se modifican los requisitos funcionales F1-01 a F1-12; el cambio es de gobierno y control de entrega.

## 2026-09-06 — F1-12 CI/CD

- Se materializan REQ-F1-100 … REQ-F1-108 mediante GitHub Actions.
- Se establecen gates secuenciales: TypeScript/unit, BDD, Playwright y quality gate final.
- Se incorpora evidencia CI con commit evaluado y artefactos de Playwright.
- Se mantiene `npm install` mientras el repositorio no disponga de `package-lock.json`.
- La protección efectiva del merge queda condicionada a Branch Protection/Rulesets.

## Regla de mantenimiento

Un cambio de requisito deberá actualizar, como mínimo, `F1-REQUIREMENTS.md`, esta bitácora y la matriz de trazabilidad cuando exista impacto en cobertura. Los cambios arquitectónicos o metodológicos deberán reflejarse además en el ADR o documento de gobierno correspondiente.
