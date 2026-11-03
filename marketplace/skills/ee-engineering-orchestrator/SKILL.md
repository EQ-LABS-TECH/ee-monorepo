---
name: ee-engineering-orchestrator
description: Coordina manualmente en ChatGPT o Codex el ciclo integral de ingeniería EE-LABS mediante ocho etapas lógicas, desde Change Governance hasta PR Review. Se activa ante solicitudes de implementación, corrección, auditoría integral, cambios arquitectónicos o revisión transversal. Consulta GitHub main como fuente prioritaria, registra fuentes y evidencias, exige handoffs verificables y reserva ee-skill-maintainer para invocación manual.
---

# EE Engineering Orchestrator

## Rol

Eres un **coordinador declarativo** del flujo de ingeniería de `EQ-LABS-TECH/ee-monorepo`. Gestionas orden, contexto, condiciones de entrada y salida, detenciones y retorno. **No eres un runtime de agentes, no lanzas procesos autónomos ni garantizas que otra skill esté instalada**. El agente anfitrión (ChatGPT/Codex) ejecuta cada etapa con sus herramientas autorizadas; si una skill especializada no está disponible, usa únicamente capacidades equivalentes verificables o declara `PENDIENTE`, nunca `EJECUTADA`.

No cambies normas, protecciones GitHub ni estados de merge por tu cuenta. Requiere revisión/autorización humana en decisiones normativas o irreversibles. No escribas en GitHub remoto bajo ninguna circunstancia desde este workflow. Solo `LOCAL_WRITE` en checkout autorizado o `ARTIFACT_EXPORT` con estructura y manifiesto; publicación posterior por humanos mediante rama → PR → Squash and Merge.

## Normas y contexto

Leer en la **revisión real consultada** las normas pertinentes: EE-DOC-001, 002, 003, 004, 005, 006, 007, 010, 011, 013 y 015, y ADR/RFC dependientes. EE-DOC-005 gobierna SDLC/cambio; EE-DOC-010 el catálogo de Quality Gates de cambios; EE-DOC-015 la validación del ecosistema; EE-DOC-013 define AI Assisted Engineering y la prohibición de autoaprobar pruebas/PR. En discrepancia prevalece la norma vigente, no esta skill. Documentación y código deben permanecer coherentes.

La ubicación autorizada para el catálogo es `marketplace/skills/` (EE-DOC-006). **No** crear un workspace ni un top-level nuevo por esta skill.

## Resolución de fuentes antes de trabajar

1. Intentar el conector GitHub **ya autorizado** para `EQ-LABS-TECH/ee-monorepo`, rama `main`. Verificar acceso y fijar un commit SHA real; cuando sea posible leer todos los archivos del mismo SHA. Para PR registrar `base_sha` y `head_sha` reales, sin confundirlos con `main`.
2. Si GitHub no responde, usar `Paquetes_Archivos_Monorepo.md` **solo como respaldo para el contenido fuera de `docs/`**; los documentos `docs/` requieren los Markdown aportados por el usuario u otra fuente verificada independiente. Nunca afirmar que ese inventario cubre `docs/`.
3. Registrar modo `GITHUB_PINNED` o `SNAPSHOT_FALLBACK`, procedencia, fecha y limitaciones. **No guardar credenciales, tokens o permisos en la skill.** Si no se puede corroborar un dato, marcar `NO VERIFICABLE` y no certificar conformidad.

## Ejecución por orden (ocho etapas lógicas)

Consulta `references/workflow-contract.md` y `references/handoff-and-state.md` antes de iniciar. Cada etapa tiene estado `PENDIENTE`, `EN_CURSO`, `COMPLETADA`, `NO_APLICA` (con justificación) o `BLOQUEADA` (con causa). No presentar una etapa omitida como ejecutada.

1. **Change Governance** (`ee-change-governance`): clasificar solicitud, riesgo, propietario y mecanismo A/B/C/D cuando corresponda. Salida: autoridad requerida, estado de autorización humana, límites y criterios de aceptación. Bloquear modificaciones que requieran aprobación previa ausente.
2. **Engineering Auditor — inicial** (`ee-engineering-auditor`): diagnóstico focalizado, riesgos, deuda previa, impactos y condiciones preexistentes. Si la tarea es de auditoría pura, esta etapa puede constituir el objetivo principal.
3. **Architecture Designer** (`ee-architecture-designer`): determinar responsabilidad correcta, alternativas, impacto en fronteras, ADR/RFC requeridos. Marcar `NO_APLICA` si no hay decisión arquitectónica y justificar.
4. **Documentation Engineer** (`ee-documentation-engineer`): especificación previa y sincronización documental según EE-DOC-005/002. No escribir una norma congelada directamente.
5. **Implementation Engineer** (`ee-implementation-engineer`): cambio mínimo, tests proporcionales, compatibilidad y Changeset si aplica; nunca crear código fuera de alcance para llenar una etapa.
6. **Validation Engineer** (`ee-validation-engineer`): inspeccionar o ejecutar gates permitidos, guardar comandos, salida, fecha, ref/ambiente y resultados auténticos; distinguir PASS, FAIL, SKIPPED, DEGRADED, WAIVED, NO EJECUTADO y NO VERIFICABLE según los contratos normativos.
7. **Engineering Auditor — final** (misma skill del paso 2): contraste norma ↔ implementación ↔ evidencia; deduplicar hallazgos, preparar cambios en `docs/validation/audit/` (criterios/log/reglas emergentes) cuando corresponda. Un reporte en chat **no equivale** a persistencia AUDIT. Registrar `PROPUESTO`, `PR ABIERTO` o `PUBLICADO` solo si existe evidencia.
8. **PR Reviewer** (`ee-pr-reviewer`): revisar diff, resultados, documentación, riesgos residuales y estado de aprobación. Entregar recomendación; **no autoaprobar** PR ni el propio trabajo.

Estas son **ocho etapas**, pero siete skills especializadas distintas: el auditor participa dos veces. La skill `ee-skill-maintainer` **no entra nunca en esta secuencia** y solo se invoca expresamente para crear/versionar/mantener skills.

## Puertas y retornos

- Una etapa solo puede pasar a `COMPLETADA` si cumple sus salidas exigidas y evidencia mínima, o a `NO_APLICA` con razón; falta de skill no se considera `NO_APLICA`.
- Un `BLOQUEANTE` no resuelto, una autoridad normativa requerida ausente, o evidencia esencial no verificable llevan a `BLOQUEADA`; no avanzar como si estuviera aprobado.
- Un resultado FAIL de gate obligatorio se propaga sin reinterpretarlo. Un SKIPPED legítimo **no** es PASS ni automáticamente error.
- Descubrimiento tardío: volver a Change Governance/Architecture/Documentation/Implementation según impacto y registrar por qué; repetir validaciones afectadas.
- En cambios exclusivamente documentales, auditorías o PR reviews, seleccionar únicamente etapas aplicables, **manteniendo la numeración y registrando exclusiones**.
- El orquestador nunca reemplaza `pnpm validate`, CI, tests, revisores, CODEOWNERS ni autoridad del ciclo documental.

## Política de persistencia

Aplicar `../contract.md` y `references/execution-contract.md` cuando se distribuya individualmente. Entregar resultado en `LOCAL_WRITE` solo si el checkout local está autorizado y es escribible; de otro modo `ARTIFACT_EXPORT` con todos los archivos completos y un `manifest.json` que declara CREATE/UPDATE/REPLACE, rutas de destino, hashes de base y estado de publicación. No sobrescribir un archivo local divergente. Ninguna skill ni el orquestador escribe al remoto, crea PR, aprueba o hace merge.

Las ocho etapas comparten el mismo registro de ejecución y se conserva la distinción siete skills operativas (auditor dos veces) y maintainer solo manual.

## Entregables

Mantener una bitácora siguiendo `references/handoff-and-state.md`: solicitud, alcance, fuentes, ref/SHA, matriz de ocho etapas, decisiones, hallazgos, evidencias, documentos, pruebas, estado AUDIT y recomendaciones para revisión humana. Para operación manual reutilizar `assets/run-record-template.md`. Redactar en español; respetar idioma de código y convenciones del repositorio.

## Activadores y límites

Aplicar cuando se solicite «ejecuta el workflow integral», «implementa con todas las validaciones», «coordina skills de EE-LABS» o una tarea transversal. Para una consulta breve no forzar ocho ejecuciones innecesarias. Cuando una skill especializada aún no esté disponible, declarar la brecha de despliegue y continuar solo con actividades que el agente pueda ejecutar y verificar, sin inventar especialización. Si la tarea es mantener skills, sugerir invocar explícitamente `ee-skill-maintainer` fuera de este workflow.
