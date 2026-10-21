# EE-IMP-006-P03 — Workspaces and Package Configuration

Este documento registra la evidencia técnica de la implementación física y validación correspondiente a la Fase 7 conforme al estándar **EE-DOC-005**.

---

## METADATOS

| Campo                 | Valor                                |
| :-------------------- | :----------------------------------- |
| **ID**                | EE-IMP-006-P03                       |
| **Documento**         | Workspaces and Package Configuration |
| **Código corto**      | IMP-006-P03                          |
| **Fase**              | Fase 3                               |
| **Tipo**              | Documento Técnico de Implementación  |
| **Clasificación**     | Implementación                       |
| **Nivel**             | Técnico                              |
| **Normativo**         | No                                   |
| **Versión**           | v1.1.0                               |
| **Estado**            | Aprobado                             |
| **Propietario**       | Equipo de Arquitectura               |
| **Documento padre**   | EE-DOC-006                           |
| **Dependencias**      | EE-DOC-006                           |
| **Aprobado por**      | Equipo de Arquitectura               |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps     |
| **Fecha de creación** | 2026-08-28                           |
| **Última revisión**   | 2026-10-18                           |
| **Próxima revisión**  | No aplica — Documento Aprobado       |

---

## 1. Propósito

Documentar la implementación y validación de la **Fase 3 — Workspaces** del Engineering Ecosystem (EE-LABS), registrando las configuraciones, modificaciones estructurales, decisiones técnicas, incidencias y resultados obtenidos durante su ejecución.

La Fase 3 tuvo como objetivo implementar la infraestructura inicial de workspaces del monorepo mediante **pnpm** y **Turborepo**, establecer los workspaces correspondientes a los paquetes de configuración, definir el tratamiento arquitectónico de `packages/config/` como contenedor administrativo y aplicar las políticas de dependencias y versionado establecidas en **EE-DOC-006 — Repository Structure**.

El presente documento constituye la evidencia técnica de la implementación y validación realizadas durante la Fase 3. **EE-IMP-006-P03 no modifica ni sustituye las definiciones normativas establecidas en EE-DOC-006**; cualquier cambio a la arquitectura, estructura o reglas normativas del repositorio deberá realizarse mediante la actualización correspondiente del documento normativo padre.

---

## 2. Alcance

La Fase 3 comprendió:

- Configuración de **pnpm** como gestor de paquetes del monorepo.
- Configuración de **Turborepo** como orquestador de tareas.
- Definición de workspaces en `pnpm-workspace.yaml`.
- Identificación y configuración de los siete workspaces especializados de configuración.
- Configuración de `packages/config/` como contenedor administrativo no consumible.
- Actualización del `package.json` raíz.
- Aplicación de la política de versiones definida en **EE-DOC-006 §11.2**.
- Resolución del uso de `workspace:*` de acuerdo con las dependencias internas existentes.
- Eliminación de la estructura `src/` y `tsconfig.json` del contenedor administrativo `packages/config/`.
- Adición de scripts `build` de validación de integridad para los paquetes de configuración.
- Ejecución de `pnpm install`.
- Ejecución de `pnpm -r build`.
- Registro de warnings producidos durante la instalación y validación.

La Fase 3 no comprende la validación integral de cumplimiento de **EE-DOC-006** para la totalidad del repositorio. Dicha validación corresponde al proceso de cierre y validación global establecido para el conjunto de fases de implementación.

---

## 3. Objetivos de la Fase

| #     | Objetivo                                                                                       | Estado |
| ----- | :--------------------------------------------------------------------------------------------- | :----: |
| **1** | Establecer `pnpm` como gestor de paquetes del monorepo.                                        |   ✅   |
| **2** | Establecer `Turborepo` como orquestador de tareas.                                             |   ✅   |
| **3** | Definir los workspaces del monorepo mediante `pnpm-workspace.yaml`.                            |   ✅   |
| **4** | Establecer los siete paquetes especializados de configuración como workspaces válidos de pnpm. |   ✅   |
| **5** | Establecer `packages/config/` como contenedor administrativo no consumible.                    |   ✅   |
| **6** | Aplicar la política de versiones definida en EE-DOC-006 §11.2.                                 |   ✅   |
| **7** | Establecer scripts `build` de validación de integridad para los paquetes de configuración.     |   ✅   |
| **8** | Validar la instalación del workspace mediante `pnpm install`.                                  |   ✅   |
| **9** | Validar la ejecución recursiva de los scripts `build` mediante `pnpm -r build`.                |   ✅   |

---

## 4. Ciclo de la Fase

La Fase 3 se ejecutó bajo el ciclo establecido por el Engineering Ecosystem: **Implementación → Validación → Documentación**.

La etapa de **Implementación** comprendió la configuración de pnpm, la definición de workspaces, la incorporación de Turborepo, la configuración del contenedor administrativo `packages/config/`, la configuración de los siete paquetes especializados y la aplicación de la política de dependencias y versiones establecida en EE-DOC-006.

La etapa de **Validación** comprendió la ejecución de `pnpm install` y `pnpm -r build`, así como la revisión de los resultados obtenidos y de los warnings generados durante la instalación.

La etapa de **Documentación** corresponde al presente documento **EE-IMP-006-P03**, que registra la implementación realizada, las decisiones adoptadas, las incidencias encontradas, las evidencias de validación y el estado final de la Fase 3.

La validación integral del cumplimiento de EE-DOC-006 no forma parte del alcance de esta fase individual y será realizada como parte del proceso de validación global del conjunto de fases de implementación.

---

## 5. Implementación Realizada

### 5.1. pnpm

Se configuró **pnpm** como gestor oficial de paquetes del monorepo mediante la propiedad `packageManager` definida en el `package.json` raíz, estableciendo `pnpm@10.16.1` como versión del gestor utilizada por el repositorio.

La configuración del workspace se estableció mediante `pnpm-workspace.yaml`, utilizando patrones que identifican los paquetes Node.js pertenecientes al monorepo. El directorio `packages/config/` no se registra directamente como workspace; únicamente sus siete paquetes especializados son incluidos mediante el patrón `packages/config/*`.

La configuración fue validada mediante la ejecución de `pnpm install`, que reportó `Scope: all 8 workspace projects`. Este resultado corresponde al proyecto raíz privado y los siete paquetes especializados de configuración. El contenedor administrativo `packages/config/` no fue identificado como workspace independiente.

### 5.2. Workspace Configuration

El archivo `pnpm-workspace.yaml` fue configurado con los siguientes patrones:

```yaml
packages:
  - 'apps/*'
  - 'apps/extensions/*'
  - 'connectors/official/*'
  - 'packages/*'
  - 'packages/config/*'
  - 'packages/foundation'
  - 'packages/shared'
  - 'packages/execution'
  - 'packages/intelligence'
  - 'packages/knowledge'
  - 'packages/governance'
  - 'packages/integration'
  - 'packages/registry'
  - 'packages/sdk'
```

El patrón `packages/config/*` registra como workspaces únicamente los directorios hijos que contienen los paquetes especializados de configuración. El directorio `packages/config/` no constituye un workspace independiente y permanece como un contenedor administrativo de dichos paquetes.

Esta decisión evita convertir una estructura organizativa del repositorio en un paquete consumible por el ecosistema. Los workspaces especializados actualmente identificados son `config-eslint`, `config-jest`, `config-playwright`, `config-prettier`, `config-typescript`, `config-vite` y `config-vitest`.

Los directorios `connectors/community/` y `connectors/experimental/` permanecen fuera del workspace mientras no contengan paquetes Node.js reales, conforme a la definición establecida en EE-DOC-006.

### 5.3. Turborepo

Turborepo fue incorporado al monorepo como dependencia de desarrollo del proyecto raíz mediante una versión exacta:

```json
"devDependencies": {
  "turbo": "2.11.7"
}
```

Los scripts del `package.json` raíz invocalan la suite en `scripts/commands/*` (p. ej. `node scripts/commands/build`). Turborepo es el orquestador de tareas de workspace (`build`, `dev`, `test`, `lint`, `typecheck`, `clean`, `test:e2e`, etc.) según `turbo.json`. El detalle de cada comando root está en **EE-IMP-006-P07**.

El archivo `turbo.json` define el grafo de tareas, caché y salidas. El as-built incluye, entre otras, las tareas `build`, `dev`, `test`, `typecheck`, `lint`, `clean` y `test:e2e`, y `globalPassThroughEnv` para `TMP` / `TEMP` / `TMPDIR` (requerido por Playwright en entornos restringidos).

Durante esta fase se verificó la instalación de Turborepo mediante `pnpm install`, confirmándose `turbo` en la versión declarada en el `package.json` raíz.

La ejecución de `pnpm -r build` corresponde a una ejecución **recursiva de scripts `build` de cada workspace** y **no** es equivalente a `turbo run build`. La validación de la orquestación Turborepo se realiza con `pnpm exec turbo run <task>` (o el script root que la invoque).

### 5.4. Root package.json

El `package.json` raíz establece la identidad y configuración base del monorepo.

La configuración as-built incluye:

- `@eq-labs/ee-monorepo` como nombre del repositorio.
- `private: true`.
- `packageManager: "pnpm@10.16.1"`.
- `engines.node`: `>=24 <25`.
- `engines.pnpm`: `>=10.16.1 <11`.
- Scripts root que delegan en `node scripts/commands/<comando>` (`bootstrap`, `build`, `dev`, `test`, `lint`, `format`, `typecheck`, `validate`, `doctor`, `generate`, `e2e`, `release`, `clean`, más `changeset` / `version-packages`).
- `devDependencies`: `turbo` en versión exacta `2.11.7`, `@eq-labs/config-prettier` vía `workspace:*`, y el resto de tooling de root (Changesets, Prettier, Plop, etc.).
- `pnpm.overrides` de seguridad/reproducibilidad según política del repositorio.

La raíz es el punto de entrada de tareas globales; no es un paquete de librería publicable.

### 5.5. packages/config/

El directorio `packages/config/` permanece en el repositorio como **contenedor administrativo** de los paquetes de configuración especializados.

El archivo `packages/config/package.json` permanece deliberadamente y define la identidad administrativa del contenedor:

```json
{
  "name": "@eq-labs/config",
  "private": true,
  "files": [
    "typescript/",
    "eslint/",
    "prettier/",
    "vite/",
    "jest/",
    "vitest/",
    "playwright/",
    "README.md",
    "package.json"
  ]
}
```

El contenedor no constituye un workspace de pnpm porque `pnpm-workspace.yaml` registra `packages/config/*` y no `packages/config/`.

El archivo `packages/config/package.json` no representa un paquete consumible ni una dependencia interna del ecosistema. Su función es mantener la estructura administrativa de la familia de configuraciones, mientras que los siete paquetes especializados contenidos en el directorio constituyen los workspaces reales y consumibles.

Los workspaces especializados son:

| Paquete                      | Workspace                     |
| :--------------------------- | :---------------------------- |
| `@eq-labs/config-eslint`     | `packages/config/eslint/`     |
| `@eq-labs/config-jest`       | `packages/config/jest/`       |
| `@eq-labs/config-playwright` | `packages/config/playwright/` |
| `@eq-labs/config-prettier`   | `packages/config/prettier/`   |
| `@eq-labs/config-typescript` | `packages/config/typescript/` |
| `@eq-labs/config-vite`       | `packages/config/vite/`       |
| `@eq-labs/config-vitest`     | `packages/config/vitest/`     |

### 5.6. workspace:\*

La política de **EE-DOC-006 §11.4** obliga a declarar con `workspace:*` toda dependencia entre paquetes internos del monorepo.

- **Entre los siete paquetes `@eq-labs/config-*`:** no hay dependencias internas de unos a otros; no aplican referencias `workspace:*` entre ellos.
- **As-built en la raíz:** el `package.json` root declara `@eq-labs/config-prettier` como `workspace:*` (consumo interno del monorepo). Otras dependencias internas del ecosistema deben seguir el mismo patrón cuando existan.

La fase documentó la ausencia de `workspace:*` **entre paquetes de configuración**. Eso no contradice el uso as-built de `workspace:*` desde root u otros workspaces hacia paquetes internos.

### 5.7. Política de Versiones

Durante la Fase 3 se aplicó la política de versiones definida en **EE-DOC-006 §11.2**.

Las dependencias declaradas en `dependencies` y `devDependencies` utilizan versiones exactas, sin los operadores `^`, `~` ni rangos abiertos.

Las dependencias declaradas en `peerDependencies` pueden conservar rangos de compatibilidad cuando estos representan correctamente el rango de versiones soportado por el paquete.

La aplicación de esta política fue realizada sobre los paquetes de configuración implementados durante la fase y constituye una aplicación de la norma definida en EE-DOC-006, no una modificación de dicha norma.

### 5.8. Scripts build de validación de los paquetes de configuración

Los paquetes de configuración no requieren una etapa de compilación tradicional debido a que sus contenidos son archivos directamente consumibles por las herramientas correspondientes.

Los paquetes basados en `.mjs` contienen configuraciones ESM nativas y los paquetes basados en `.json` contienen configuraciones JSON directamente consumibles. No existe código TypeScript en estos paquetes que requiera una transformación previa para su utilización.

Por esta razón, cada paquete especializado implementa un script `build` cuyo propósito es realizar una **validación de integridad estructural**, verificando que los archivos de configuración requeridos se encuentren presentes.

El script `build` no genera archivos de salida, no realiza bundling y no produce artefactos de compilación. Su existencia permite que los paquetes participen uniformemente en las tareas recursivas del monorepo y que la presencia de sus archivos requeridos pueda validarse mediante una tarea estándar.

| Paquete                      | Archivos validados                     |
| :--------------------------- | :------------------------------------- |
| `@eq-labs/config-eslint`     | `base.mjs`, `typescript.mjs`           |
| `@eq-labs/config-jest`       | `base.mjs`, `typescript.mjs`           |
| `@eq-labs/config-prettier`   | `index.mjs`                            |
| `@eq-labs/config-typescript` | `base.json`, `node.json`, `react.json` |
| `@eq-labs/config-vite`       | `base.mjs`, `library.mjs`, `react.mjs` |
| `@eq-labs/config-vitest`     | `base.mjs`, `react.mjs`                |
| `@eq-labs/config-playwright` | `base.mjs`, `base.d.ts`                |

---

## 6. Decisiones Arquitectónicas Tomadas

| Decisión                                             | Justificación                                                                                                                                                                                                                |
| :--------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Turborepo 2.11.7**                                 | Turborepo fue incorporado como dependencia de desarrollo del proyecto raíz utilizando una versión exacta para garantizar reproducibilidad y coherencia con la política de versiones del repositorio.                         |
| **packages/config/ como contenedor administrativo**  | `packages/config/` agrupa administrativamente los paquetes especializados de configuración, pero no constituye un paquete consumible ni un workspace independiente.                                                          |
| **packages/config/package.json conservado**          | El archivo identifica y administra el contenedor, manteniéndolo privado y fuera del workspace consumible. Su eliminación habría eliminado la identidad administrativa del contenedor sin aportar una ventaja arquitectónica. |
| **src/ eliminado del contenedor**                    | El contenedor administrativo no contiene código fuente propio que deba organizarse bajo `src/`. Mantener esta estructura generaba una expectativa incorrecta de compilación del contenedor.                                  |
| **tsconfig.json del contenedor eliminado**           | `packages/config/` no contiene código TypeScript propio que requiera compilación o typecheck. La existencia de un `tsconfig.json` en este nivel provocaba una configuración sin entradas válidas después de eliminar `src/`. |
| **Paquetes de configuración sin compilación real**   | Los paquetes contienen archivos `.mjs` y `.json` directamente consumibles por las herramientas correspondientes y no requieren generación de artefactos de compilación.                                                      |
| **Scripts build como validación de integridad**      | Los scripts `build` verifican la presencia de los archivos de configuración requeridos, permitiendo que los paquetes participen uniformemente en las tareas del monorepo sin generar artefactos innecesarios.                |
| **dependencies/devDependencies exactas**             | La utilización de versiones exactas aplica la política definida en EE-DOC-006 §11.2 y garantiza reproducibilidad de las dependencias directas.                                                                               |
| **peerDependencies con rangos**                      | Los rangos en `peerDependencies` expresan compatibilidad soportada por el paquete y no representan una dependencia instalada directamente por el paquete.                                                                    |
| **workspace:\* obligatorio entre paquetes internos** | Conforme a EE-DOC-006 §11.4. Los `@eq-labs/config-*` no dependen entre sí; el as-built root sí usa `workspace:*` hacia `@eq-labs/config-prettier`.                                                                           |

---

## 7. Validación Ejecutada

### 7.1. pnpm install

La instalación del monorepo fue ejecutada mediante:

```powershell
pnpm install
```

El proceso finalizó correctamente con Done in 22.3s using pnpm v10.16.1.

La salida de pnpm reportó:

```powershell
Scope: all 8 workspace projects
```

Los ocho proyectos del **scope de fase** corresponden al proyecto raíz privado y los siete paquetes especializados de configuración registrados mediante `packages/config/*`. El directorio administrativo `packages/config/` no fue contabilizado como workspace independiente. El monorepo as-built incorpora workspaces adicionales (apps, connectors, paquetes de dominio, etc.); el número total vigente se obtiene con `pnpm m ls --depth -1` o el scope que reporte `pnpm install`.

La instalación resolvió e instaló un total de 416 paquetes en el árbol de dependencias generado por pnpm.

| Resultado                 |             Detalle              |
| :------------------------ | :------------------------------: |
| **Estado**                |            ✅ Exitoso            |
| **Proyectos en el scope** |                8                 |
| **Composición del scope** | Root + 7 paquetes especializados |
| **Paquetes instalados**   |               416                |
| **Tiempo**                |              22.3s               |
| **Versión de pnpm**       |             10.16.1              |
| **Turbo instalado**       |              2.11.7              |

### 7.2. Validación recursiva de scripts build

La validación recursiva de los scripts `build` fue ejecutada mediante:

```powershell
pnpm -r build
```

La ejecución completó satisfactoriamente los scripts `build` definidos en los siete paquetes especializados de configuración.

Estos scripts realizan validaciones de integridad estructural y no compilaciones tradicionales. La ejecución confirmó que los archivos de configuración requeridos por cada paquete se encontraban presentes y que sus respectivos scripts finalizaron correctamente.

| Paquete                      |       Estado        | Tiempo |
| :--------------------------- | :-----------------: | :----: |
| `@eq-labs/config-eslint`     | ✅ Build successful |   —    |
| `@eq-labs/config-jest`       | ✅ Build successful |   —    |
| `@eq-labs/config-playwright` | ✅ Build successful |   —    |
| `@eq-labs/config-prettier`   | ✅ Build successful |   —    |
| `@eq-labs/config-typescript` | ✅ Build successful |   —    |
| `@eq-labs/config-vite`       | ✅ Build successful |   —    |
| `@eq-labs/config-vitest`     | ✅ Build successful |   —    |

El resultado de esta ejecución valida los scripts `build` de los workspaces participantes. No constituye por sí mismo una validación de la ejecución del comando `turbo run build`, la cual deberá ejecutarse y registrarse de forma independiente cuando corresponda.

---

## 8. Warnings Observados

| Warning                                                          | Tipo                             | Tratamiento                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :--------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint@9.39.5 deprecated`                                       | Dependencia directa deprecated   | La advertencia no impidió completar la instalación ni la validación de la fase. Se registra como deuda técnica de actualización y deberá revisarse dentro del proceso autorizado de actualización de dependencias.                                                                                                                                                                                                                                                   |
| `glob@10.5.0 deprecated`                                         | Subdependencia deprecated        | La advertencia corresponde a una dependencia transitiva del árbol instalado. No se modifica directamente desde el paquete mientras la dependencia directa que la incorpora no requiera una actualización compatible.                                                                                                                                                                                                                                                 |
| `Ignored build scripts: @parcel/watcher, esbuild, unrs-resolver` | Advertencia de seguridad de pnpm | pnpm 10.16.1 informó que determinados scripts de instalación fueron bloqueados por el mecanismo de aprobación de build scripts. La instalación y las validaciones ejecutadas durante esta fase finalizaron correctamente, pero el warning no permite concluir por sí mismo que dichos scripts sean innecesarios. Su eventual aprobación deberá determinarse posteriormente según las herramientas que los consuman y los requisitos reales de ejecución del entorno. |

### 8.1. Tratamiento de los warnings

Los warnings registrados durante `pnpm install` no impidieron completar la instalación ni las validaciones ejecutadas durante la Fase 3. Por esta razón, no se clasifican como fallos de implementación de la fase.

Sin embargo, los warnings quedan registrados como información técnica pendiente de seguimiento. Las advertencias relacionadas con dependencias deprecated deberán revisarse dentro del proceso de actualización de dependencias, mientras que los build scripts bloqueados por pnpm deberán evaluarse según su necesidad real en el entorno de desarrollo y ejecución.

La existencia de estos warnings no modifica el resultado exitoso de las validaciones ejecutadas durante esta fase ni implica que hayan sido resueltos definitivamente.

---

## 9. Estado de la Fase

| Aspecto            |                   Estado                    |
| :----------------- | :-----------------------------------------: |
| **Implementación** |                ✅ Completada                |
| **Validación**     |                ✅ Completada                |
| **Documentación**  | ✅ Aprobado (metadatos; addenda 2026-10-18) |

La implementación técnica de la Fase 3 se encuentra completada. La validación ejecutada mediante `pnpm install` y `pnpm -r build` finalizó satisfactoriamente para los componentes incluidos en el alcance de la fase.

La documentación EE-IMP-006-P03 está **Aprobada** en metadatos; el texto de fase es evidencia histórica. Addenda 2026-10-18 (scripts/commands, as-built). La revisión arquitectónica y su aprobación correspondiente.

La validación integral del cumplimiento de EE-DOC-006 no forma parte del cierre de esta fase individual. Dicha validación será realizada posteriormente como parte del proceso global de validación del conjunto de fases de implementación.

---

## 10. Artefactos Modificados

| Archivo / Directorio                      | Cambio                                                                                                                                             |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                            | Añadido `turbo: "2.11.7"` como `devDependency`, junto con la configuración de pnpm y los scripts globales delegados a Turborepo.                   |
| `pnpm-workspace.yaml`                     | Definición de los patrones de workspaces del monorepo, incluyendo `packages/config/*`.                                                             |
| `turbo.json`                              | Configuración de la orquestación de tareas mediante Turborepo.                                                                                     |
| `packages/config/package.json`            | Conservado como contenedor administrativo privado y eliminado su carácter de paquete consumible mediante la limpieza de su configuración anterior. |
| `packages/config/tsconfig.json`           | Eliminado debido a que el contenedor administrativo no contiene código TypeScript propio.                                                          |
| `packages/config/src/`                    | Eliminado debido a que el contenedor administrativo no posee código fuente propio.                                                                 |
| `packages/config/eslint/package.json`     | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |
| `packages/config/jest/package.json`       | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |
| `packages/config/playwright/package.json` | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |
| `packages/config/prettier/package.json`   | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |
| `packages/config/typescript/package.json` | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |
| `packages/config/vite/package.json`       | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |
| `packages/config/vitest/package.json`     | Aplicación de la política de versiones y adición del script `build` de validación.                                                                 |

---

## 11. Documentación de la Fase

La documentación técnica de implementación de la Fase 3 queda registrada en el presente documento **EE-IMP-006-P03 — Workspaces y Package Configuration**.

Este documento registra las decisiones implementadas, las modificaciones realizadas en el repositorio, los resultados de las validaciones ejecutadas y las incidencias observadas durante la fase.

EE-IMP-006-P03 no sustituye ni modifica el contenido normativo de EE-DOC-006. Las reglas arquitectónicas continúan siendo definidas por los documentos normativos correspondientes del Engineering Ecosystem.

---

## 12. Referencias

| Referencia     | Descripción                                                                                                                                                                       |
| :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-005** | Development Workflow — define el proceso de desarrollo utilizado como marco para la implementación de la fase.                                                                    |
| **EE-DOC-006** | Repository Structure — documento normativo padre que define la estructura del repositorio, workspaces, dependencias, convenciones y políticas de versionado aplicables a la fase. |
| **EE-DOC-010** | Quality Gates — define los mecanismos de validación y quality gates aplicables al ecosistema.                                                                                     |
| **EE-DOC-011** | Automation — define los mecanismos de automatización utilizados por el ecosistema.                                                                                                |

---

## 13. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                                    | Cambios                                                | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :---------------------------------------- | :----------------------------------------------------- | :----------- |
| **v1.0.0** | 2026-08-28 | Equipo de Arquitectura | Equipo de Arquitectura | Creación del DT de la Fase 3 — Workspaces | Documentar la implementación realizada                 | **Aprobado** |
| **v1.1.0** | 2026-10-18 | Equipo de Arquitectura | Equipo de Arquitectura | Auditoría EE-DOC-006                      | As-built scripts/commands y estados documentales merge | Aprobado     |

---

## FIN DEL DOCUMENTO

### Nota de consistencia de estado (auditoría 2026-10-15)

Los **metadatos** declaran estado **Aprobado** (implementación de fase aceptada). Si el cuerpo aún dice «Borrador»/«En revisión» respecto de la **documentación** de la IMP, se interpreta como redacción histórica a unificar en la próxima edición: el estado canónico de metadatos prevalece hasta corrección explícita del cuerpo.

---

### Addendum auditoría EE-DOC-006 (2026-10-18)

- **Scripts root canónicos:** `scripts/commands/<cmd>` (+ `scripts/lib/`, `scripts/tests/`). Rutas históricas `scripts/<cmd>` plano quedan **superseded**.
- **Estado:** los metadatos **Aprobado** prevalecen sobre menciones residuales de “Borrador” / “En revisión” en el cuerpo (evidencia histórica de la fase).
- **As-built monorepo:** `assets/`, `examples/`, `marketplace/`, `data/`, `infra/` materializados (layout + README); detalle en EE-DOC-006 §05 y EE-TEC-001.
- Este addendum **no** reescribe la evidencia de validación de fase (P01/P02: sin PASS retroactivo — EE-DOC-006 §20.1).
