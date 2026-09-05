# ADR-011 — API y contratos

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

El producto necesita una interfaz de entrada para registrar objetivos, escenarios, ejecutar pruebas y consultar resultados sin acoplar los casos de uso a un framework HTTP concreto.

Los contratos externos también deben ser versionables y trazables a casos de uso y requisitos.

## Decisión

Se define una API HTTP como adaptador de entrada del sistema. El framework HTTP concreto queda subordinado al puerto de aplicación y se seleccionará durante el spike tecnológico.

Los contratos de entrada y salida deberán:

- representar casos de uso, no estructuras internas del dominio;
- validar sintaxis y restricciones de entrada en el borde;
- utilizar identificadores y estados explícitos;
- separar DTOs de entidades de dominio;
- definir errores funcionales y técnicos de forma consistente;
- versionarse cuando exista incompatibilidad contractual;
- conservar trazabilidad hacia requisitos y casos de uso.

La API no ejecutará directamente lógica de infraestructura ni accederá directamente a repositorios.

## Principios y patrones

- Hexagonal Architecture: API como adaptador de entrada.
- Dependency Inversion: casos de uso independientes del framework HTTP.
- DTO: contrato externo separado del dominio.
- Application Service / Use Case: orquestación de operaciones.
- Validation at the Boundary: rechazo temprano de entradas inválidas.

## Decisiones no tomadas

No se fija todavía framework HTTP, formato definitivo de errores, estrategia completa de autenticación ni versionado mayor/menor del API. Se resolverán en ADRs específicos o spike.

## Criterios de validación

1. Un caso de uso puede probarse sin servidor HTTP.
2. Los contratos pueden validarse independientemente del dominio.
3. Una petición inválida no alcanza infraestructura.
4. Los errores mantienen una clasificación estable.
5. Existe trazabilidad API → caso de uso → requisito.
6. Los cambios incompatibles son detectables en CI.

## Consecuencia

La API queda desacoplada del núcleo y podrá evolucionar sin contaminar las reglas de negocio.
