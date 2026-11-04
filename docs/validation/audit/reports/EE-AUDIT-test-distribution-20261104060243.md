# EE-AUDIT-test-distribution — Matriz de suites y aplicabilidad

## Metadatos

| Campo                  | Valor                                               |
| :--------------------- | :-------------------------------------------------- |
| Repositorio            | EQ-LABS-TECH/ee-monorepo                            |
| Rama                   | fix/phase-6-test-validator-gaps                     |
| Commit base            | d475891ee17b357e6baff94d393dbb43579bf34f            |
| Fecha de auditoría UTC | 2026-11-04 11:02:43                                 |
| Evidencia              | Manifests, suites encontradas y `pnpm run validate` |
| Persistencia           | LOCAL_WRITE                                         |
| Publicación            | PENDIENTE DE PUBLICACIÓN                            |

## 1. Alcance y conclusión

Se inspeccionaron los 26 manifests de workspace bajo `apps/`, `packages/` y `connectors/`. La inspección encontró suites dentro de `@eq-labs/knowledge` y `@eq-labs/dashboard`; la lógica de `@eq-labs/governance` se prueba desde `scripts/tests/`. No se asumió que un workspace sin suite no necesite pruebas: la decisión se basó en su comportamiento actual y se registra por paquete.

La distribución revela tres gaps de suites propias para código ejecutable: `@eq-labs/cli`, `@eq-labs/foundation` y `@eq-labs/intelligence`. Este informe deja esos gaps visibles; no añade las suites porque excede los defectos específicos de validadores aprobados para esta fase. Los workspaces que hoy solo exponen `export {}` quedan como no aplicables hasta que incorporen comportamiento. Las configuraciones se clasifican como condicionales y se validan mediante gates consumidores; requieren pruebas directas cuando incorporen lógica de transformación o reglas ejecutables.

## 2. Matriz por workspace

| Workspace                       | Ruta                             | Suite actual                                       | Aplicabilidad y dictamen                                                                                                                           |
| :------------------------------ | :------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@eq-labs/cli`                  | `apps/cli`                       | Sin suite local                                    | **Sí; gap.** CLI y composition roots contienen comportamiento ejecutable. Requiere pruebas unitarias/de comando.                                   |
| `@eq-labs/config`               | `packages/config`                | Sin suite propia                                   | **Condicional.** Manifest agregador de paquetes de configuración; verificar a través de los paquetes consumidores.                                 |
| `@eq-labs/config-eslint`        | `packages/config/eslint`         | Sin suite propia                                   | **Condicional.** Configuración consumida por LINT; las reglas ejecutables requieren pruebas dedicadas cuando cambien.                              |
| `@eq-labs/config-jest`          | `packages/config/jest`           | Sin suite propia                                   | **Condicional.** Artefacto de configuración; pruebas de consumidor al incorporarse a una suite Jest.                                               |
| `@eq-labs/config-playwright`    | `packages/config/playwright`     | Sin suite propia                                   | **Condicional.** Consumida por Dashboard; validación mediante E2E y typecheck del consumidor.                                                      |
| `@eq-labs/config-prettier`      | `packages/config/prettier`       | Sin suite propia                                   | **Condicional.** Config declarativa validada por el gate de formato.                                                                               |
| `@eq-labs/config-typescript`    | `packages/config/typescript`     | Sin suite propia                                   | **Condicional.** Config consumida por workspaces y validada mediante typecheck/build.                                                              |
| `@eq-labs/config-vite`          | `packages/config/vite`           | Sin suite propia                                   | **Condicional.** Config consumida por Dashboard y validada mediante build/typecheck.                                                               |
| `@eq-labs/config-vitest`        | `packages/config/vitest`         | Sin suite propia                                   | **Condicional.** Consumida por Knowledge; el suite de Knowledge actúa como comprobación del consumidor.                                            |
| `@eq-labs/connector-a2a`        | `connectors/official/a2a`        | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío; agregar pruebas de contrato cuando exista adaptador.                                |
| `@eq-labs/connector-docker`     | `connectors/official/docker`     | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío; agregar pruebas de contrato cuando exista adaptador.                                |
| `@eq-labs/connector-github`     | `connectors/official/github`     | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío; agregar pruebas de contrato cuando exista adaptador.                                |
| `@eq-labs/connector-kubernetes` | `connectors/official/kubernetes` | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío; agregar pruebas de contrato cuando exista adaptador.                                |
| `@eq-labs/connector-mcp`        | `connectors/official/mcp`        | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío; agregar pruebas de contrato cuando exista adaptador.                                |
| `@eq-labs/connector-notebooklm` | `connectors/official/notebooklm` | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío; agregar pruebas de contrato cuando exista adaptador.                                |
| `@eq-labs/dashboard`            | `apps/dashboard`                 | `tests/e2e/dashboard.spec.ts` — una suite E2E      | **Sí; implementado.** La suite prueba el flujo E2E disponible; no implica cobertura E2E de todos los workspaces.                                   |
| `@eq-labs/execution`            | `packages/execution`             | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío.                                                                                     |
| `@eq-labs/extensions`           | `apps/extensions`                | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío.                                                                                     |
| `@eq-labs/foundation`           | `packages/foundation`            | Sin suite local                                    | **Sí; gap.** Contiene constructores y type guards además de contratos TypeScript. Requiere pruebas de helpers públicos.                            |
| `@eq-labs/governance`           | `packages/governance`            | Suites externas en `scripts/tests/pr-governance.*` | **Sí; cubierto desde scripts.** Las pruebas importan directamente la lógica del paquete; no se duplica el suite dentro del paquete en este cambio. |
| `@eq-labs/integration`          | `packages/integration`           | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío.                                                                                     |
| `@eq-labs/intelligence`         | `packages/intelligence`          | Sin suite local                                    | **Sí; gap.** Routing y observabilidad contienen lógica ejecutable que requiere pruebas unitarias.                                                  |
| `@eq-labs/knowledge`            | `packages/knowledge`             | `src/unit.in-memory-port.test.ts` — una suite      | **Sí; implementado.** Cubre `ids`, todos los `tags` solicitados, `source`, `limit` e interfaces básicas.                                           |
| `@eq-labs/registry`             | `packages/registry`              | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío.                                                                                     |
| `@eq-labs/sdk`                  | `packages/sdk`                   | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío.                                                                                     |
| `@eq-labs/shared`               | `packages/shared`                | Sin suite                                          | **No aplicable hoy.** El entrypoint fuente solo exporta vacío.                                                                                     |

## 3. Cobertura auxiliar verificada

- `scripts/tests/` contiene suites de gates y validadores; la ejecución registrada encontró 57 archivos, 627 tests, 625 pasados, cero fallidos y dos omitidos.
- `@eq-labs/governance` tiene pruebas desde `scripts/tests/` para clasificación, aprobaciones, ownership, CODEOWNERS, eventos, workflow, evaluación y publicación del check.
- Los wrappers de typecheck, lint, test y build comparten un contrato verificado por `unit.workspace-quality-gates.test.mjs`; `unit.e2e-gate.test.mjs` cubre el wrapper E2E.
- Los escenarios de recuperación de release están cubiertos por `release-integrity.test.mjs`, `release-publish-order.test.mjs` y las pruebas del workflow. No se ejecutó una publicación real.

## 4. Estado de hallazgos de Fase 6

| Hallazgo               | Estado local                                                                                                                                                | Evidencia                                                    |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| AUD-05                 | Parcial; matriz completada y gaps de CLI, Foundation e Intelligence identificados para seguimiento.                                                         | Esta matriz.                                                 |
| AUD-13                 | Cerrado localmente; cero archivos y proceso sin exit code devuelven `ERROR`.                                                                                | `unit.run-script-tests.test.mjs`.                            |
| AUD-15, AUD-19, AUD-26 | Cerrados localmente; JSON reconocido se procesa por campos estructurados; JSON inválido, esquema no reconocido y GHSA solo textual fallan de forma cerrada. | `unit.security-audit.test.mjs`.                              |
| AUD-16, AUD-30         | Cerrados localmente; se detectan candidatos por `template.json`, `files/` o `.hbs`; carpetas sin marcadores se ignoran y errores de lectura se reportan.    | `unit.validate-templates.test.mjs`.                          |
| AUD-27, AUD-31         | Cerrados localmente; rutas requeridas deben ser directorios y fallos de `statSync` se reportan.                                                             | `unit.repository-structure.test.mjs`.                        |
| AUD-43                 | Cerrado localmente; los filtros `tags`, `source` y `limit` tienen regresiones.                                                                              | `packages/knowledge/src/unit.in-memory-port.test.ts`.        |
| AUD-44                 | Cerrado localmente para los wrappers y escenarios release inspeccionados; no hubo publicación real.                                                         | Suites de wrappers, `release-*` e integración de `validate`. |

## 5. Validación y límites

`pnpm run validate` pasó todos los gates locales: naming, branch, commits, arquitectura, typecheck, lint, tests, E2E, tests de scripts, build y formato. El gate de seguridad informó un advisory low de `deepmerge`; no hay advisories high/critical sin waiver.

La matriz describe el checkout local de esta rama. CI remoto y merge permanecen pendientes. Los tres gaps anotados bajo AUD-05 requieren priorización por sus responsables; no se clasifican como “sin necesidad de tests”.
