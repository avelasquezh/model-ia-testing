# Frente 1 — Backlog

| Epic | Rango | Prioridad base | Dependencia principal |
|---|---|---|---|
| F1-01 Gestión del objetivo | 001-005 | Must | — |
| F1-02 Escenarios | 006-015 | Must | F1-01 |
| F1-03 Ejecución | 016-027 | Must | F1-01, F1-02 |
| F1-04 Evidencia | 028-039 | Must | F1-03 |
| F1-05 Resultados | 040-046 | Must | F1-03, F1-04 |
| F1-06 Hallazgos | 047-054 | Must | F1-05 |
| F1-07 Reportes | 055-065 | Must | F1-05, F1-06 |
| F1-08 Trazabilidad | 066-073 | Must | F1-02 a F1-07 |
| F1-09 Calidad del producto | 074-082 | Must | transversal |
| F1-10 BDD/automatización | 083-092 | Must | transversal |
| F1-11 Seguridad/límites | 093-099 | Must | F1-03 |
| F1-12 CI/CD | 100-108 | Must | F1-09, F1-10 |
| F1-13 Gobierno | 109-115 | Must | transversal |

## Orden de implementación conceptual

1. Requisitos y trazabilidad.
2. Modelo de dominio y contratos.
3. Gestión del objetivo.
4. Escenarios y suites.
5. Ejecución.
6. Evidencia.
7. Resultados.
8. Hallazgos.
9. Reportes.
10. Automatización de pruebas.
11. CI/CD y quality gates.

Este orden no constituye todavía una decisión arquitectónica ni de stack, salvo Playwright para automatización web y GitHub Actions como requisito de CI.
