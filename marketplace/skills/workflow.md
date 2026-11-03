# EE-LABS — Workflow manual coordinado v1.0

**Modelo actual:** el humano invoca al agente ChatGPT/Codex, el agente lee el orquestador y las skills desde `marketplace/skills/` en GitHub si dispone del conector, y ejecuta sus procedimientos en una sesión. No existe runtime de agentes ni trigger automático. Este documento es operacional y no sustituye EE-DOC-005.

| Orden | Skill                              | Entrega                                                                                     | Condición                                          |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 01    | `ee-change-governance`             | Clasificación, autoridad, criterios de aceptación                                           | No continuar con decisión normativa no autorizada  |
| 02    | `ee-engineering-auditor` (inicial) | Baseline, problemas preexistentes                                                           | Hallazgos trazables o limitaciones explícitas      |
| 03    | `ee-architecture-designer`         | Diseño, alternativas, impactos                                                              | `NO_APLICA` solo si justificado                    |
| 04    | `ee-documentation-engineer`        | Especificación aprobada/propuesta                                                           | Documentation First y control de normas congeladas |
| 05    | `ee-implementation-engineer`       | Código/tests/docs locales o exportados                                                      | No afirmar que se aplicó un ZIP al checkout        |
| 06    | `ee-validation-engineer`           | Comandos reales, QG y evidencias                                                            | `NO_EJECUTADO` no es PASS                          |
| 07    | `ee-engineering-auditor` (final)   | Reporte detallado en `docs/validation/audit/reports/`; referencias en Log y Rules si aplica | No confundir reporte con publicación               |
| 08    | `ee-pr-reviewer`                   | Revisión independiente, decisión recomendada                                                | No aprobar, abrir ni fusionar PR por defecto       |

El auditor se invoca dos veces: **ocho etapas, siete skills operativas**. `ee-skill-maintainer` es la octava skill especializada del catálogo, pero queda fuera del flujo y se invoca **solo manualmente**.

Todas las etapas se recorren en orden con estado y justificación si `NO_APLICA`; una etapa puede ser bloqueada. Si un hallazgo obliga a volver atrás, repetir las validaciones afectadas. La skill orquestadora **no ejecuta procesos autónomos**, es un contrato para el agente anfitrión.

## Modos de entrega

- Checkout local escribible y autorizado: `LOCAL_WRITE`.
- Sin acceso a checkout local: `ARTIFACT_EXPORT` con árbol relativo del monorepo y manifiesto de operaciones y hashes; el usuario revisa y reemplaza mediante comparación.
- Para auditorías, el reporte detallado mantiene la ruta `docs/validation/audit/reports/` tanto en `LOCAL_WRITE` como en el árbol del ZIP exportado.
- GitHub: solo lectura. No realizar commits ni publicar PR desde skills. La publicación posterior se gestiona fuera del workflow mediante rama → PR → Squash and Merge.
