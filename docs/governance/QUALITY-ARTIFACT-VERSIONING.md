# Versionado de artefactos de calidad

Los artefactos de calidad forman parte del producto y se versionan junto con el código mediante Git.

## Alcance

Se consideran artefactos versionables, entre otros:

- requisitos y matriz de trazabilidad;
- criterios de aceptación y escenarios Gherkin;
- pruebas automatizadas y configuración de CI;
- ADR y decisiones metodológicas;
- Definition of Done y registros de gobierno;
- configuraciones de prueba no sensibles;
- documentos de seguridad y arquitectura.

## Reglas

1. Cada cambio relevante debe quedar asociado a un commit.
2. Los identificadores estables de requisitos, escenarios y ADR no deben reutilizarse para conceptos diferentes.
3. La evidencia generada por CI se conserva como artefacto de la ejecución; no se incorpora automáticamente al repositorio.
4. Los artefactos de CI no deben contener secretos ni datos sensibles.
5. Los documentos históricos no deben alterarse para ocultar decisiones anteriores; las correcciones relevantes se registran como nuevos cambios.

## Relación con CI

La ejecución de CI debe permitir relacionar el commit evaluado con el workflow, sus jobs, pruebas y artefactos publicados. La evidencia operativa de una ejecución se conserva en GitHub Actions según la política de retención configurada.

## Estado

Esta política corresponde a la baseline de Frente 1. Las reglas específicas de retención, clasificación de datos y promoción a entornos productivos se podrán endurecer cuando exista el diseño de despliegue y seguridad correspondiente.
