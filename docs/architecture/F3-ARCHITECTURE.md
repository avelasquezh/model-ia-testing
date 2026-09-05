# Frente 3 — Arquitectura y diseño de alto nivel

**Versión:** 0.1  
**Estado:** Baseline arquitectónica inicial

## 1. Propósito

Definir una arquitectura inicial para `model-ia-testing` que permita implementar el MVP sin acoplar el dominio a Playwright, PostgreSQL, un proveedor de IA, HTTP, UI o infraestructura concreta.

La arquitectura debe preservar:

- testabilidad;
- mantenibilidad;
- trazabilidad;
- aislamiento de infraestructura;
- evidencia reproducible;
- extensibilidad;
- seguridad operacional;
- validación automática mediante CI/CD.

## 2. Decisión arquitectónica inicial

Se adopta como baseline un **monolito modular con arquitectura hexagonal (Ports and Adapters)** y separación explícita entre dominio, aplicación e infraestructura.

La decisión no implica construir microservicios. El MVP prioriza un único producto desplegable con módulos internos bien delimitados. La separación de responsabilidades deberá permitir extraer componentes posteriormente solo si existe una necesidad demostrable.

## 3. Principios arquitectónicos

### 3.1 Independencia del dominio

Las reglas de negocio y evaluación no deberán depender de Playwright, PostgreSQL, HTTP, Docker, GitHub Actions ni de un proveedor concreto de IA.

### 3.2 Inversión de dependencias

Las dependencias deben apuntar hacia abstracciones estables del dominio/aplicación. Los adaptadores de infraestructura implementan puertos definidos por las capas internas.

### 3.3 Evidencia como objeto de primera clase

La ejecución no deberá limitarse a producir un estado PASS/FAIL. Debe producir observaciones y referencias a evidencia que permitan reconstruir el resultado.

### 3.4 Separación de ejecución y evaluación

La automatización del navegador, la captura de evidencia, la verificación de criterios y la agregación de resultados son responsabilidades distintas.

### 3.5 No acoplamiento prematuro

No se introducirán microservicios, colas, caches, event buses u otros componentes distribuidos si el requisito no los justifica.

### 3.6 Seguridad por aislamiento

La ejecución sobre objetivos externos debe tratarse como una frontera de seguridad. El navegador y sus artefactos deberán poder ejecutarse con restricciones independientes del proceso principal.

## 4. Capas lógicas

### Dominio

Contiene conceptos y reglas independientes de infraestructura.

Responsabilidades esperadas:

- objetivos;
- escenarios;
- criterios;
- ejecuciones;
- observaciones;
- evidencia;
- resultados;
- hallazgos;
- evaluación;
- riesgo;
- reglas de agregación cuando estén aprobadas.

No contiene llamadas a Playwright, SQL, HTTP ni SDKs externos.

### Aplicación

Orquesta casos de uso mediante interfaces/puertos.

Ejemplos conceptuales:

- registrar objetivo;
- crear escenario;
- ejecutar escenario;
- capturar evidencia;
- evaluar criterio;
- registrar hallazgo;
- generar reporte.

Los casos de uso no deberán conocer detalles de implementación de los adaptadores.

### Adaptadores

Implementan las interfaces requeridas por aplicación/dominio.

Categorías iniciales:

- browser automation;
- persistencia;
- reloj/tiempo;
- almacenamiento de evidencia;
- proveedor de IA;
- generación de reportes;
- interfaces de entrada/salida.

### Infraestructura

Contiene configuración, composición de dependencias, procesos, contenedores, observabilidad y mecanismos de despliegue.

## 5. Módulos funcionales propuestos

Los módulos son límites lógicos iniciales, no necesariamente paquetes definitivos.

1. **Target Management** — configuración y ciclo de vida del chatbot objetivo.
2. **Scenario Management** — escenarios, pasos, expectativas y versiones.
3. **Execution** — sesiones, ejecución de escenarios y estados operacionales.
4. **Evidence** — captura, metadatos, referencias e integridad de evidencia.
5. **Verification** — comparación entre observación y condición esperada.
6. **Evaluation** — evaluación de criterios y dimensiones.
7. **Findings** — hallazgos, severidad/riesgo y trazabilidad.
8. **Reporting** — construcción de reportes a partir de resultados persistidos.
9. **AI Evaluation** — integración opcional de modelos para interpretación asistida.

Los límites podrán modificarse durante el diseño detallado si las dependencias reales lo justifican.

## 6. Flujo lógico principal

`Entrada → Caso de uso → Dominio/Aplicación → Puerto → Adaptador → Sistema externo`

Para una ejecución:

`Scenario → Execution → Browser Port → Playwright Adapter → Target Bot → Observation → Evidence → Verification → Result → Finding/Evaluation → Report`

La cadena de evidencia deberá permanecer disponible para auditoría.

## 7. Persistencia

PostgreSQL se establece como candidato preferido para el MVP por la naturaleza relacional de la trazabilidad entre objetivos, escenarios, ejecuciones, pasos, evidencia, resultados y hallazgos.

La elección se formaliza en un ADR específico antes de implementar persistencia.

El dominio no deberá depender de SQL ni de ORM.

## 8. Ejecución de navegador

Playwright se tratará como un adaptador de infraestructura detrás de un puerto de automatización de navegador.

La implementación deberá permitir sustituir o simular el navegador durante pruebas unitarias y de aplicación.

Para ejecución real, se prioriza un entorno de navegador aislado del proceso principal. El grado exacto de aislamiento —proceso, contenedor o servicio dedicado— se decidirá según los requisitos de seguridad y operación del MVP.

## 9. IA evaluadora

La IA no será una dependencia obligatoria del dominio.

Se definirá un puerto para análisis semántico/asistido. Un adaptador podrá conectarse posteriormente a un proveedor o modelo concreto.

La evaluación determinista deberá existir cuando el criterio pueda resolverse mediante reglas observables sin IA.

Toda conclusión asistida por IA deberá conservar método, versión/configuración y evidencia de entrada.

## 10. Patrones y principios aplicables

Se adoptan o evalúan explícitamente:

- **Hexagonal Architecture / Ports and Adapters:** aislamiento de infraestructura.
- **Dependency Inversion Principle:** dominio/aplicación dependen de abstracciones.
- **Single Responsibility Principle:** separación entre ejecución, evidencia, verificación y evaluación.
- **Open/Closed Principle:** incorporación de adaptadores sin modificar reglas centrales cuando sea viable.
- **Dependency Injection:** composición de dependencias fuera de los casos de uso.
- **Strategy:** candidatos naturales para reglas de evaluación o mecanismos de comparación intercambiables.
- **Adapter:** integración de Playwright, persistencia, IA y reporting.
- **Factory:** candidato para construcción controlada de sesiones/adaptadores cuando existan variantes reales.
- **Repository:** candidato para persistencia de agregados cuando el modelo de dominio lo justifique.

No se implementará un patrón únicamente por cumplir una lista. Cada uso deberá estar justificado por una necesidad concreta y ser verificable mediante pruebas.

## 11. BDD, TDD y arquitectura

BDD definirá comportamiento verificable desde requisitos y criterios de aceptación.

TDD podrá utilizarse en reglas de dominio y casos de uso donde aporte feedback rápido y diseño testeable.

Cucumber/Gherkin se integrará en la capa de aceptación/BDD del stack seleccionado.

Las pruebas de navegador no deberán convertirse en el único nivel de prueba. Se mantendrá una estrategia por niveles para reducir costo y tiempo de feedback.

## 12. Arquitectura de despliegue conceptual

`Cliente/API/UI`

`        ↓`

`Aplicación model-ia-testing`

`        ↓`

`Caso de uso / worker de ejecución`

`        ↓`

`Browser Automation Adapter`

`        ↓`

`Playwright + navegador`

`        ↓`

`Chatbot objetivo`

`
`Persistencia y evidencia quedan conectadas mediante puertos independientes.`

La topología física definitiva se definirá en el diseño de despliegue y seguridad.

## 13. Restricciones arquitectónicas iniciales

- No introducir microservicios por defecto.
- No acoplar el dominio a Playwright.
- No permitir que la IA determine resultados sin evidencia primaria suficiente.
- No mezclar estado operacional de ejecución con estado metodológico de evaluación.
- No almacenar evidencia sin contexto suficiente para reconstruir su origen.
- No ejecutar objetivos externos sin límites operacionales definidos.
- No convertir criterios metodológicos pendientes en código permanente sin decisión aprobada.

## 14. Decisiones todavía abiertas

Permanecen pendientes de ADR o diseño detallado:

- lenguaje y framework principal;
- estructura exacta de módulos/packages;
- PostgreSQL y estrategia de migraciones;
- almacenamiento de evidencia binaria;
- aislamiento definitivo de Playwright;
- API/UI del producto;
- estrategia de jobs/ejecución asíncrona;
- proveedor/modelo de IA;
- observabilidad;
- autenticación y autorización;
- estrategia definitiva de BDD/Cucumber;
- política de ramas y PR;
- quality gates de GitHub Actions.

## 15. Criterio de aceptación arquitectónico

La arquitectura se considerará suficientemente definida para iniciar implementación cuando:

1. los límites de módulos estén definidos;
2. las dependencias entre módulos sean explícitas;
3. los puertos principales estén identificados;
4. las decisiones tecnológicas críticas tengan ADR;
5. los riesgos arquitectónicos relevantes tengan tratamiento;
6. la estrategia de pruebas por niveles esté definida;
7. la estrategia CI/CD tenga quality gates trazables;
8. cada decisión pueda relacionarse con requisitos del Frente 1 y restricciones metodológicas del Frente 2.
