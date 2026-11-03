# marketplace/skills/

Catálogo versionado de skills de ingeniería para agentes ChatGPT/Codex. Su presencia en el monorepo **no las instala automáticamente** en ChatGPT, ni supone que un agente pueda ejecutar procesos sin herramientas.

## Catálogo

| Skill                         | Alcance                                           | Invocación                             |
| ----------------------------- | ------------------------------------------------- | -------------------------------------- |
| `ee-engineering-orchestrator` | Coordina ocho etapas mediante el agente anfitrión | Punto de entrada manual                |
| `ee-change-governance`        | Clasificación/autoridad de cambio                 | Etapa 01                               |
| `ee-engineering-auditor`      | Auditoría inicial/final y AUDIT                   | Etapas 02 y 07                         |
| `ee-architecture-designer`    | Arquitectura/alternativas/impacto                 | Etapa 03                               |
| `ee-documentation-engineer`   | Documentación y especificación                    | Etapa 04                               |
| `ee-implementation-engineer`  | Código, pruebas y compatibilidad                  | Etapa 05                               |
| `ee-validation-engineer`      | Evidencias/QG/validación                          | Etapa 06                               |
| `ee-pr-reviewer`              | Revisión independiente de diff/PR                 | Etapa 08                               |
| `ee-skill-maintainer`         | Mantener, probar y empaquetar el catálogo         | **Solo manual**, fuera del orquestador |

**Instrucciones:** [workflow.md](workflow.md), [contract.md](contract.md). Cada carpeta contiene `SKILL.md` y referencias propias. Las normas vigentes viven en `docs/` y no se reproducen como normativa en skills.

**Fuentes:** GitHub `main` prioritario, fallback limitado de `Paquetes_Archivos_Monorepo.md` fuera de `docs/`; archivos `.md` separados para documentación. **Salida:** checkout local autorizado o ZIP exportable con rutas y hashes. Nunca escribir directamente al remoto.

**Gobernanza:** EE-DOC-005, EE-DOC-006, EE-DOC-010, EE-DOC-013, EE-DOC-015 y los ADR/RFC pertinentes; rama → PR → Squash and Merge ejecutados por flujo humano independiente.
