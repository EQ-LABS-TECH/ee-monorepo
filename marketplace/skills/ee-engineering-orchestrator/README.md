# EE Engineering Orchestrator

Skill declarativa de coordinación manual para ChatGPT/Codex. Define **ocho etapas lógicas** basadas en **siete skills especializadas** (el auditor se utiliza al inicio y al cierre). No constituye un runtime ni crea automáticamente otras skills. `ee-skill-maintainer` se invoca exclusivamente de forma manual.

## Uso

Pedir «Aplica ee-engineering-orchestrator a esta solicitud, registra las ocho etapas y ejecuta las aplicables con evidencia». Para revisión de PR, aportar número/URL; para trabajo local, aportar el repositorio o acceso efectivo. El agente selecciona las capacidades disponibles y nunca reporta una skill no instalada como ejecutada.

## Ubicación y publicación

Fuente de verdad propuesta: `marketplace/skills/ee-engineering-orchestrator/`. Publicar por rama y PR; no modificar `main` directamente. Los paquetes ZIP destinados a ChatGPT/Codex deben generarse desde esta fuente versionada y no contener credenciales.

## Referencias normativas

EE-DOC-005 (SDLC), EE-DOC-006 (estructura), EE-DOC-010 (gates), EE-DOC-013 (IA asistida), EE-DOC-015 (validación), y artefactos AUDIT cuando proceda. Consultar versiones vigentes de `main`, nunca considerar esta README como norma.
