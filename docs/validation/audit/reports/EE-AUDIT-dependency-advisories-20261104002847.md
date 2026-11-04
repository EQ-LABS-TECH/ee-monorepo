# EE-AUDIT-dependency-advisories — Remediación de dependencias

## Metadatos

| Campo                  | Valor                                    |
| :--------------------- | :--------------------------------------- |
| Repositorio            | EQ-LABS-TECH/ee-monorepo                 |
| Rama                   | docs/phase-1-security-waivers            |
| Commit base            | 8166f80d4c4d8d5878cac66e60cce6c844939e4b |
| Fecha de auditoría UTC | 2026-11-04 00:28:47                      |
| Evidencia              | Checkout local y `pnpm audit`            |
| Persistencia           | LOCAL_WRITE                              |
| Publicación            | PENDIENTE DE PUBLICACIÓN                 |

## 1. Alcance y conclusión

Se revisaron las seis instancias low/moderate de advisories identificadas en la auditoría completa: GHSA-gcqx-w48m-w2h4 (`deepmerge`), GHSA-3g3m-2fjr-6pw4 (`glob`) y GHSA-g3hv-75wg-m249 (`minimatch`). La revisión cubre el lockfile, las rutas de dependencia, la aplicación de overrides y la validación local.

Los overrides de `glob` y `minimatch` retiraron cinco instancias del resultado de `pnpm audit`. Permanece una instancia low de `deepmerge@4.3.1`, transitiva de Jest. No se aplicó un parche local: el advisory no publica una versión corregida (`patched_versions <0.0.0`) y el usuario indicó que no se debe parchear localmente esta dependencia.

El resultado es **parcial**: los advisories de `glob` y `minimatch` ya no aparecen en la auditoría del lockfile; `deepmerge` sigue abierto y no cuenta con waiver.

## 2. Hallazgos iniciales

| Advisory            | Severidad | Instancias iniciales | Ruta de dependencia observada                                                 |
| :------------------ | :-------- | -------------------: | :---------------------------------------------------------------------------- |
| GHSA-gcqx-w48m-w2h4 | low       |                    1 | `packages/config/jest → jest → @jest/core → jest-config → deepmerge@4.3.1`    |
| GHSA-3g3m-2fjr-6pw4 | moderate  |                    2 | `rimraf → glob@13.0.6`; Jest → `test-exclude → glob@10.5.0`                   |
| GHSA-g3hv-75wg-m249 | moderate  |                    3 | ESLint → `minimatch@3.1.5`; TypeScript ESLint → `10.2.6`; Jest/glob → `9.0.9` |

## 3. Cambios revisados

- `package.json`: se añadieron overrides para resolver `glob@<14` a `14.0.3` y `minimatch@<11` a `11.0.2`.
- `pnpm-lock.yaml`: se regeneró con las versiones resueltas. Las copias usadas por `glob@14.0.3` incluyen `minimatch@11.0.4` según su rango.
- `deepmerge`: no se añadió `patchedDependencies`, se eliminó el intento de parche local y se retiró su prueba temporal.

Los overrides reemplazan versiones fuera del rango declarado por algunos paquetes padres. `pnpm install --frozen-lockfile` y la validación completa local pasaron en el checkout observado. Esto aporta evidencia de compatibilidad funcional del monorepo, pero no equivale a soporte declarado por los upstreams ni a CI remoto.

## 4. Estado posterior

`pnpm audit --json` informa una incidencia low y ninguna moderate, high o critical:

- GHSA-gcqx-w48m-w2h4 — `deepmerge@4.3.1`, una instancia. No existe versión corregida publicada en el advisory.
- GHSA-3g3m-2fjr-6pw4 — sin instancias reportadas tras resolver `glob` a `14.0.3`.
- GHSA-g3hv-75wg-m249 — sin instancias reportadas tras resolver `minimatch` a `11.0.2`/`11.0.4`.

`pnpm audit --audit-level high` termina con exit 0 por el umbral configurado, aunque el advisory low de `deepmerge` sigue presente. No se debe interpretar ese exit 0 como ausencia de advisories.

## 5. Validación local

`pnpm validate` completó con todos los gates en PASS: naming, branch, commit, architecture dependencies, typecheck, lint, tests, E2E, script tests, build y format. La salida de seguridad señaló `ghsa-gcqx-w48m-w2h4: low`; el gate no encontró hallazgos high/critical sin waiver.

También se verificaron `pnpm install --frozen-lockfile`, `QG-NAM-001` y `QG-ARCH-001` después de retirar el parche local y la carpeta temporal de patches.

## 6. Pendiente

Mantener `deepmerge` como residual abierto hasta que exista una versión corregida upstream o se apruebe una alternativa gobernada, como reemplazar la dependencia afectada. No se creó waiver porque no se aprobó aceptación formal del riesgo. Reevaluar el advisory cuando Jest publique una dependencia corregida o deje de requerir la versión afectada.

## 7. Evidencia y límites

- Base local observada: `8166f80d4c4d8d5878cac66e60cce6c844939e4b`.
- Resultado de `pnpm audit --json`: una incidencia low, `deepmerge@4.3.1`.
- Resultado de `pnpm validate`: exit 0; todos los gates en PASS.
- Resultado remoto: no verificado en esta revisión.
- Publicación del informe y cambios: pendiente.
