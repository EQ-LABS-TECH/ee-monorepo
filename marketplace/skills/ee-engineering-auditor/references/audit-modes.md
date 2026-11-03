# Modos de auditoría y revisión incremental

| Modo           | Evidencia mínima                            | Controles principales                                                       | Veredicto                                         |
| -------------- | ------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `document`     | Documento íntegro, normas, AUDIT            | Metadatos, plantilla, jerarquía, referencias, implementación cuando aplique | C1–C8, solo con fuentes suficientes               |
| `code`         | Código, contratos, tests pertinentes        | Correctitud, seguridad de tipos, reutilización, regresión                   | Técnico, no «auditado» documental                 |
| `architecture` | Normas, ADR/RFC, dependencia real           | Límites, APIs, ciclos, acoplamiento, capas                                  | Técnico y contradicciones normativas evidenciadas |
| `repository`   | Árbol, manifiestos, scripts, normas         | Workspaces, top-levels, naming, configuración                               | Técnico                                           |
| `ci-quality`   | Workflows, jobs, logs de ejecución          | Lint/typecheck/test/build, caches, skips, waivers                           | Resultado literal por gate                        |
| `security`     | Trust boundaries, dependencias y evidencias | Secretos, validación, permisos, exposición; no explotar sistemas            | Técnico y riesgos                                 |
| `pr-change`    | Base/head/diff, contexto de consumo         | Cambios y regresiones, contratos, docs, Changesets, CI                      | Técnico contextual                                |
| `full`         | Unión de inputs aplicables                  | Ejecutar módulos pertinentes; no inferir cobertura universal                | Separado por dominio                              |

## Incremental

1. Resolver SHA base y head del PR, lista exacta de archivos modificados y renombrados; si no hay diff fiable, declarar auditoría parcial.
2. Identificar impacto directo e indirecto: imports/dependientes, API pública, workflows, documentación, contratos y reglas aplicables.
3. Revisar los archivos modificados, los consumidores y los tests/gates pertinentes. No limitarse al diff si el cambio afecta comportamiento externo.
4. Distinguir `nuevo`, `preexistente`, `regresión` y `no determinado`; no atribuir al PR hallazgos preexistentes sin prueba.
5. Emitir hallazgos y actualizaciones AUDIT; no marcar como aprobados los quality gates solo por existir sus definiciones.

## Seguridad y alcance

- Sólo lectura y análisis salvo autorización explícita.
- No confundir carácter sensible con defecto confirmado sin prueba, ni reportar secretos en texto plano.
- Mantener separado estado documental, estado de implementación, evidencia de validación y estado del PR.
