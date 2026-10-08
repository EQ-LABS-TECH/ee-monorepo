# EE-DOC-012 — Templates

Este documento sigue el estándar **EE-DOC-002 — Document Design Template** y se desarrolla conforme al ciclo documental definido por **EE-DOC-005 — Development Workflow**.

---

## METADATOS

| Campo                 | Valor                                                                                                                                                                  |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | EE-DOC-012                                                                                                                                                             |
| **Documento**         | Templates                                                                                                                                                              |
| **Código corto**      | EE-DOC-012                                                                                                                                                             |
| **Tipo**              | Documento Normativo                                                                                                                                                    |
| **Clasificación**     | Especializado                                                                                                                                                          |
| **Nivel**             | Especializado                                                                                                                                                          |
| **Normativo**         | Sí                                                                                                                                                                     |
| **Versión**           | v1.0.0                                                                                                                                                                 |
| **Estado**            | Congelado                                                                                                                                                              |
| **Propietario**       | Equipo de Arquitectura                                                                                                                                                 |
| **Documento padre**   | EE-DOC-006 — Repository Structure                                                                                                                                      |
| **Dependencias**      | EE-DOC-001, EE-DOC-002, EE-DOC-003, EE-DOC-004, EE-DOC-005, EE-DOC-006, EE-DOC-007, EE-DOC-010, EE-DOC-011, EE-ADR-001, EE-ADR-002, EE-ADR-003, EE-ADR-004, EE-RFC-002 |
| **Aprobado por**      | Equipo de Arquitectura                                                                                                                                                 |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps, QA, IA                                                                                                                               |
| **Fecha de creación** | 2026-09-30                                                                                                                                                             |
| **Última revisión**   | 2026-10-02                                                                                                                                                             |
| **Próxima revisión**  | No aplica — Documento Congelado                                                                                                                                        |

> **Jerarquía documental (patrón alineado a EE-DOC-010 y EE-DOC-011):**
>
> | Relación                     | Documento  | Significado                                                    |
> | :--------------------------- | :--------- | :------------------------------------------------------------- |
> | **Padre estructural**        | EE-DOC-006 | Estructura del monorepo; ubicación de `templates/`             |
> | **Precedente de roadmap**    | EE-DOC-011 | Orden de la serie Fase 3 (EE-DOC-001); no es padre estructural |
> | **Dependencia de contenido** | EE-DOC-011 | Mecanismo de generación (`pnpm run generate`)                  |
> | **Dependencia de contenido** | EE-DOC-010 | Catálogo de Quality Gates                                      |
> | **Cambio gobernado**         | EE-RFC-002 | Autoriza `templates/` en 006 y 001                             |

> **Naturaleza de v0.3.0:** revisión acumulativa de v0.2.0. A diferencia de v0.2.0, **sí reduce el alcance inicial** (T-WF, T-EXT y T-CFG pasan a _Diferido_, §13) por decisión de Arquitectura del 2026-10-01. La trazabilidad de cada hallazgo está en §25.1.

---

## 01. Propósito

**EE-DOC-012 — Templates** define la arquitectura, estructura, clasificación, contrato, versionado, validación y gobernanza de los **templates generativos** de EE-LABS: la **Single Source of Template** consumida por el mecanismo de generación de EE-DOC-011.

Los templates son mecanismos de **scaffolding y estandarización**. No introducen lógica de negocio ni sustituyen normas arquitectónicas.

---

## 02. Alcance

### 02.1. Incluye

- Templates de documentación (T-DOC), paquetes (T-PKG), aplicaciones (T-APP) y conectores (T-CON).
- Ubicación y estructura de `templates/`.
- Contrato de metadata (`template.json`) e inputs; su validación.
- Política de idioma por categoría.
- Composición, versionado, seguridad y reproducibilidad.
- Validación de inputs, precondiciones y artefactos generados.
- Criterios de aceptación de implementación.

### 02.2. No incluye

| Dominio                                                               | Documento responsable                                                    |
| :-------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| Mecanismo, engine y registro de generación; comando `generate`        | **EE-DOC-011**                                                           |
| Estructura global del repositorio                                     | **EE-DOC-006**                                                           |
| Workflows de plataforma, permisos, secrets, Rulesets, required checks | **EE-DOC-007**                                                           |
| Catálogo, severidad y agregación de Quality Gates                     | **EE-DOC-010**                                                           |
| Infraestructura y despliegue                                          | **EE-DOC-009**                                                           |
| Lógica comercial / de producto                                        | Fuera del alcance de EE-LABS                                             |
| Templates diferidos (T-WF, T-EXT, T-CFG)                              | §13                                                                      |
| Recursos estáticos/pasivos de `assets/templates/`                     | **EE-DOC-006 §14** (delimitado en §02.4; no se duplican en `templates/`) |

### 02.3. Frontera Templates ↔ Automation

| EE-DOC-012 (qué)                                                 | EE-DOC-011 (cómo)                                 |
| :--------------------------------------------------------------- | :------------------------------------------------ |
| Qué es un template, su estructura, inputs, outputs e invariantes | Comando `generate`, engine, registro, integración |
| Contrato de metadata y su validación estructural                 | Invocación canónica y exit codes                  |

El contrato del template es **agnóstico del motor**. La implementación física es compatible con el mecanismo vigente de EE-DOC-011 (**Plop**, con **Handlebars `.hbs`**). Cambiar el motor **no** se hace desde un template (§14.3).

### 02.4. Frontera con EE-DOC-006 y EE-RFC-002

| Directorio               | Rol                                      | Regla                                      |
| :----------------------- | :--------------------------------------- | :----------------------------------------- |
| **`templates/`**         | Templates generativos (SSOT)             | Autorizado por **EE-RFC-002** (006 v1.5.0) |
| `assets/templates/`      | Recurso estático compartido (006 §14)    | No duplica `templates/`                    |
| `marketplace/templates/` | Extensibilidad/distribución              | Fuera de la SSOT de scaffolding            |
| `scripts/`               | Entry points y registro del engine (011) | No aloja templates                         |

### 02.5. Frontera con EE-DOC-007 y EE-DOC-010

- EE-DOC-007 gobierna `.github/`; ningún template de este alcance genera artefactos de plataforma GitHub.
- EE-DOC-010 es propietario de los Quality Gates; este documento solo **mapea** cuáles aplican (§19.4) y **no crea** gates.

---

## 03. Principios de Templates

| #   | Principio                       | Aplicación                                                                              |
| :-- | :------------------------------ | :-------------------------------------------------------------------------------------- |
| 1   | **Reuse First**                 | Verificar existencia de un template equivalente antes de crear otro.                    |
| 2   | **Single Source of Template**   | Cada patrón tiene una única fuente en `templates/`.                                     |
| 3   | **Documentation Driven**        | Estructura y propósito documentados.                                                    |
| 4   | **Architecture First**          | Respeta fronteras de 006, 007, 010, 011.                                                |
| 5   | **Automation First**            | Patrones repetibles se generan por el mecanismo canónico.                               |
| 6   | **Minimal Intervention**        | Genera solo lo necesario; no modifica archivos existentes fuera de su salida declarada. |
| 7   | **Quality by Default**          | Lo generado queda sujeto a los gates aplicables (§19.4).                                |
| 8   | **Vendor Agnostic**             | El contrato no depende de un proveedor.                                                 |
| 9   | **Human Accountable**           | La automatización no elimina la responsabilidad del operador.                           |
| 10  | **No Business Logic**           | Sin lógica comercial.                                                                   |
| 11  | **Single Source of Invocation** | Generación solo vía `pnpm run generate` (EE-DOC-011 §03.2).                             |
| 12  | **No False Pass**               | Una generación o validación no determinable no es éxito (EE-DOC-010).                   |

### 03.1. Motor agnóstico

El template expresa intención, estructura, inputs, outputs, invariantes, metadata, dependencias y validaciones. No es propietario del mecanismo de ejecución.

### 03.2. Formateo frente a Quality Gates

`format --write` puede formar parte de la experiencia de generación; **no** constituye un Quality Gate (QG-FMT-001 es `--check`, EE-DOC-010 §05.3).

---

## 04. Clasificación de Templates

### 04.1. Categorías y alcance

| ID        | Categoría              | Propósito               | Directorio             | Estado en v0.3.0    |
| :-------- | :--------------------- | :---------------------- | :--------------------- | :------------------ |
| **T-DOC** | Documentation Template | Documentos EE-\*        | `templates/document/`  | **Alcance inicial** |
| **T-PKG** | Package Template       | Paquetes del monorepo   | `templates/package/`   | **Alcance inicial** |
| **T-APP** | Application Template   | Aplicaciones            | `templates/app/`       | **Alcance inicial** |
| **T-CON** | Connector Template     | Conectores oficiales    | `templates/connector/` | **Alcance inicial** |
| **T-WF**  | Workflow Template      | Workflows               | —                      | **Diferido** (§13)  |
| **T-EXT** | Extension Template     | Extensiones             | —                      | **Diferido** (§13)  |
| **T-CFG** | Configuration Template | Configuración repetible | —                      | **Diferido** (§13)  |

La taxonomía puede especializarse en implementación solo sin crear una taxonomía incompatible.

### 04.2. Templates de documentación

Tipos con base normativa en EE-DOC-002 §18:

| Tipo             | Base normativa                                                                                                   |
| :--------------- | :--------------------------------------------------------------------------------------------------------------- |
| `EE-DOC-XXX`     | EE-DOC-002 §18.1                                                                                                 |
| `EE-ADR-XXX`     | EE-DOC-002 §18.2                                                                                                 |
| `EE-IMP-XXX-PXX` | EE-DOC-002 §18.3                                                                                                 |
| `EE-TEC-XXX`     | EE-DOC-002 §18.4                                                                                                 |
| `EE-RFC-XXX`     | **EE-DOC-002 §18.5** (v1.6.0). Destino canónico: `docs/rfc/`. Precedente de estructura: EE-RFC-001 / EE-RFC-002. |

### 04.3. Templates de código

Pueden generar packages, apps y connectors con su configuración asociada. No generan lógica comercial.

---

## 05. Arquitectura y Ubicación

### 05.1. Modelo conceptual

```text
Template
 ├── Metadata (template.json)
 ├── Inputs
 ├── Preconditions
 ├── Template Files (files/)
 ├── Generation Rules
 ├── Output Contract
 └── Validation Rules
```

```text
Input → Input Validation → Precondition Validation → Template Resolution
      → Generation Engine → Generated Artifacts → Artifact Validation
      → Applicable Quality Gates
```

### 05.2. Responsabilidades

| Elemento                                  | Responsabilidad               | Propietario |
| :---------------------------------------- | :---------------------------- | :---------- |
| `templates/` y su contenido               | Fuente de verdad de templates | EE-DOC-012  |
| `template.json`, `template.schema.json`   | Contrato de metadata          | EE-DOC-012  |
| `pnpm run generate` y registro del engine | Ejecución                     | EE-DOC-011  |
| Quality Gates                             | Calidad del resultado         | EE-DOC-010  |
| Estructura global / top-level             | Ubicación                     | EE-DOC-006  |
| `.github/`                                | Plataforma                    | EE-DOC-007  |

### 05.3. Single Source of Template

No deben existir copias independientes de un template en `scripts/`, `apps/`, `packages/`, `docs/`, `assets/`, conectores o workflows sin razón arquitectónica explícita.

### 05.4. Ubicación y gobernanza estructural

|  Regla   | Descripción                                                                                                                                                                                   |
| :------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **L-01** | La ubicación canónica es **`templates/`** de primer nivel.                                                                                                                                    |
| **L-02** | `templates/` **no está autorizado** en EE-DOC-006 v1.4.0; lo autoriza **EE-RFC-002** (006 v1.5.0 + 001 v2.8.0).                                                                               |
| **L-03** | Hasta que EE-RFC-002 esté aprobado y sincronizado **y** EE-DOC-012 esté Aprobado, `templates/` **no puede materializarse**. Crearlo antes es desviación silenciosa y hace fallar QG-ARCH-001. |
| **L-04** | `templates/` **no es workspace pnpm**; los `package.json.hbs` no son manifiestos.                                                                                                             |
| **L-05** | Ownership de revisión: `templates/` en `.github/CODEOWNERS` → architecture + maintainers (EE-DOC-007 §08; se materializa en EE-IMP-012-P02).                                                  |
| **L-06** | `templates/**/files/**` se excluye de Prettier mediante `.prettierignore` de la raíz (los `.hbs` no son formateables; no se usa `@eq-labs/config-prettier`, que no porta patrones de ignore). |
| **L-07** | `templates/` es contenido declarativo: no aloja scripts, helpers ni acciones de Plop (viven en el registro, EE-DOC-011).                                                                      |

---

## 06. Estructura de un Template

### 06.1. Layout

```text
templates/
├── README.md
├── template.schema.json
├── document/
│   └── <template-name>/
├── package/
│   └── <template-name>/
├── app/
│   └── <template-name>/
└── connector/
    └── <template-name>/
```

Cada template:

```text
templates/<category>/<template-name>/
├── template.json
├── files/            # archivos estáticos y *.hbs
└── README.md
```

Ejemplo conceptual: `templates/package/typescript-node/`. El layout no se congela hasta completar EE-IMP-012-P02.

### 06.2. Registro y engine

| Aspecto                    | Norma                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Propietario del registro   | **EE-DOC-011** (engine, comando y registro)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Descubrimiento             | El registro **descubre** templates por convención (`templates/*/*/template.json`); no se edita por template                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Ubicación                  | EE-DOC-006 §05 (nota de raíz) no autoriza archivos de configuración de herramientas en la raíz. El `scripts/generate` as-built busca `plopfile.js` en la raíz. **EE-IMP-012-P05** reubica el registro a **`scripts/plopfile.mjs`** como especialización Type B de EE-DOC-011 (sin cambio de contrato: nombre de comando, efectos y exit codes). Se registra como descubrimiento Tipo B en **EE-IMP-012-P05** (EE-IMP-011-P01…P05 ya están cerrados), con addendum a EE-TEC-006 y sincronización de `scripts/README.md` en la misma ola (EE-DOC-011 §14). `scripts/` ya está cubierto por CODEOWNERS. Si Arquitectura prefiere la raíz, requiere ampliar EE-DOC-006 vía RFC. |
| Un `plopfile` por template | Prohibido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### 06.3. README del template

Cada template documenta: propósito, categoría, inputs, outputs, dependencias, restricciones, ejemplo, validaciones, ownership y documentos normativos relacionados.

---

## 07. Contrato de Metadata e Inputs

### 07.1. Campos de `template.json`

| Campo            | Req. | Descripción                                                                                |
| :--------------- | :--: | :----------------------------------------------------------------------------------------- |
| `schemaVersion`  |  Sí  | Versión del contrato (`template.schema.json`)                                              |
| `id`             |  Sí  | Identificador único (kebab-case)                                                           |
| `name`           |  Sí  | Nombre legible                                                                             |
| `category`       |  Sí  | `T-DOC` \| `T-PKG` \| `T-APP` \| `T-CON` (debe coincidir con el directorio)                |
| `version`        |  Sí  | SemVer del template                                                                        |
| `description`    |  Sí  | Descripción                                                                                |
| `target`         |  Sí  | Artefacto que genera                                                                       |
| `owner`          |  Sí  | Responsable                                                                                |
| `locale`         |  Sí  | `es` \| `en` (§08)                                                                         |
| `allowedTargets` |  Sí  | Raíces de salida permitidas (p. ej. `packages/`, `apps/`, `connectors/official/`, `docs/`) |
| `inputs`         |  Sí  | Lista de `{name, type, required, pattern?, enum?, default?, description}`                  |
| `outputs`        |  Sí  | Archivos que genera (relativos al destino)                                                 |
| `dependencies`   |  No  | Otros templates o herramientas                                                             |
| `preconditions`  |  No  | Precondiciones declaradas                                                                  |

```json
{
  "schemaVersion": "1",
  "id": "package-typescript-node",
  "name": "TypeScript Node package",
  "category": "T-PKG",
  "version": "0.1.0",
  "description": "Skeleton Node.js TypeScript workspace package.",
  "target": "packages/<name>",
  "owner": "architecture",
  "locale": "en",
  "allowedTargets": ["packages/"],
  "inputs": [
    {
      "name": "name",
      "type": "string",
      "required": true,
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Package name."
    }
  ],
  "outputs": ["package.json", "tsconfig.json", "eslint.config.mjs", "src/index.ts", "README.md"]
}
```

Las variables reales deben estar declaradas; no existen variables ocultas que cambien materialmente el resultado.

### 07.2. Esquema

El contrato se expresa en **`templates/template.schema.json`** (JSON Schema versionado). La validación no introduce dependencias nuevas sin justificación; toda dependencia nueva usa versión exacta (EE-DOC-006 §11).

### 07.3. Input Validation

Antes de generar se validan: obligatorios, tipos, formatos, valores permitidos, nombres, paths (sin `..`, sin rutas absolutas, dentro de `allowedTargets`), conflictos y compatibilidad. Un input inválido provoca fallo seguro.

### 07.4. Precondiciones

Evaluadas **antes** de producir mutaciones: destino inexistente (o vacío) según el template; nombre no duplicado; destino cubierto por un patrón de `pnpm-workspace.yaml` cuando el template genera un workspace; permisos suficientes; ausencia de archivos que no deban sobrescribirse.

> Un template **no lee ni modifica** `pnpm-workspace.yaml` ni `scripts/validate`. La verificación la ejecuta el **registro del engine** en tiempo de generación (EE-DOC-011) contra los patrones de `pnpm-workspace.yaml`. Si el destino no está cubierto, la generación falla de forma segura (exit ≠ 0) con mensaje explícito, y el administrador actualiza el workspace conforme a EE-DOC-006.
>
> **Limitación adoptada (D-012-11):** los patrones as-built son literales (p. ej. `packages/foundation`): cubren solo ese directorio exacto, que además ya existe como paquete, y no sus subdirectorios. Destinos efectivos hoy: `apps/*`, `apps/extensions/*`, `connectors/official/*` y `packages/config/*`. Generar bajo `packages/<capa>/…` falla de forma segura (exit ≠ 0). La ampliación de patrones es materia de EE-DOC-006 y se tramita en un RFC futuro (§13.1); este documento no la codifica ni la bloquea.

### 07.5. Enforcement del contrato (`validateTemplates()`)

El contrato se verifica en una función **`validateTemplates()` dentro de `scripts/validate`** (junto a `validateDocumentation()` y `validateInfra()`). No se crea script independiente (EE-DOC-011 §03.2) ni Quality Gate nuevo (EE-DOC-010 está Congelado); la evidencia se reporta bajo **QG-REPO-001**.

| Verificación                                                                  | Resultado si falla |
| :---------------------------------------------------------------------------- | :----------------- |
| Cada `templates/<cat>/<name>/` tiene `template.json`, `files/`, `README.md`   | exit ≠ 0           |
| `template.json` válido frente al esquema; SemVer válido                       | exit ≠ 0           |
| `category` coincide con el directorio                                         | exit ≠ 0           |
| `outputs` ⇔ contenido de `files/` (sin faltantes ni no declarados)            | exit ≠ 0           |
| `package.json.hbs`: sin rangos (`^`, `~`) en `dependencies`/`devDependencies` | exit ≠ 0           |
| Sin directorios de categorías diferidas                                       | exit ≠ 0           |

Antes de EE-IMP-012-P02, `templates/` no existe y la función no reporta errores. Desde P02, `templates/` es directorio requerido. Si Arquitectura considera que la validación de contratos merece un gate propio, el cambio se gestiona sobre EE-DOC-010.

---

## 08. Política de Idioma por Categoría

Deriva de **EE-DOC-002 §16.1** (SSOT); esta sección la aplica, no la redefine.

| Categoría                                 | Idioma del contenido generado                                                                            |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| T-DOC                                     | **Español** (EE-DOC, EE-IMP, EE-ADR, EE-TEC, EE-RFC); **Title** del RFC en **inglés** (EE-DOC-002 §18.5) |
| T-PKG / T-APP / T-CON                     | **Inglés (`en-US`)**: código, comentarios, `package.json`, README técnicos, nombres                      |
| `template.json` y README de cada template | Inglés, por analogía con manifiestos y README técnicos de §16.1                                          |

Cualquier ampliación del catálogo de §16.1 se hace en EE-DOC-002.

---

## 09. Templates de Documentación (T-DOC)

|  Regla   | Descripción                                                                                                                                                          |
| :------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-01** | El template **nunca asigna ID**. El ID es input validado: formato válido y **inexistente** en EE-DOC-001 y en el árbol de documentos (SSOT de códigos = EE-DOC-001). |
| **D-02** | Nombre de archivo según EE-DOC-006 §07.1 (p. ej. `EE-DOC-001_Master_Documentation_Index.md`).                                                                        |
| **D-03** | Estructura y metadata según EE-DOC-002 §18.x del tipo; secciones obligatorias, numeración, referencias e historial incluidos.                                        |
| **D-04** | Estado inicial **En Elaboración** (o Borrador/En Revisión según tipo), v0.1.0, `Aprobado por` = `—`. Nunca genera estados aprobados o congelados.                    |
| **D-05** | No modifica documentos existentes ni el índice EE-DOC-001.                                                                                                           |
| **D-06** | El directorio destino es input restringido a subárboles de `docs/` según EE-DOC-006; se fija en EE-IMP-012-P03.                                                      |

| **D-07** | Template **ee-rfc** (EE-RFC-XXX): estructura y metadatos según **EE-DOC-002 §18.5**; destino `docs/rfc/`; no materializa el cambio físico del RFC (solo el documento de propuesta). |

Un template documental no sustituye revisión arquitectónica, aprobación, RFC, ADR, workflow de cambios ni requisitos de congelación.

---

## 10. Templates de Paquetes (T-PKG)

### 10.1. Baseline

```text
<package>/
├── package.json
├── tsconfig.json          # extends @eq-labs/config-typescript/node
├── eslint.config.mjs      # @eq-labs/config-eslint/typescript
├── src/index.ts
└── README.md
```

`turbo.json` local solo si el build no produce `dist` (override `outputs: []`).

### 10.2. Reglas

|  Regla   | Descripción                                                                                                                                                                                                                                |
| :------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P-01** | Nombre `@eq-labs/…` en kebab-case, con el patrón de categoría de EE-DOC-006 §07.1.                                                                                                                                                         |
| **P-02** | `dependencies`/`devDependencies` con **versiones exactas**; `workspace:*` para internas; rangos solo en `peerDependencies` (EE-DOC-006 §11). Los templates no replican rangos presentes en el código as-built.                             |
| **P-03** | Configuración por **reutilización** de `packages/config/` (TypeScript, ESLint). No duplica Prettier/Vitest/ESLint locales.                                                                                                                 |
| **P-04** | Scripts: `build`, `typecheck`, `lint`. **No** declara `test` ni usa `--passWithNoTests` (EE-ADR-002 §11); `test` solo si el template incluye tests reales con Vitest.                                                                      |
| **P-05** | Si declara `engines.node`: `>=24 <25` (EE-ADR-003).                                                                                                                                                                                        |
| **P-06** | `private: true` por defecto; la publicación se rige por la política de release (EE-DOC-011 §08).                                                                                                                                           |
| **P-07** | Imports y dependencias respetan la matriz de capas (EE-DOC-006 §13).                                                                                                                                                                       |
| **P-08** | Exports explícitos cuando sean contrato público.                                                                                                                                                                                           |
| **P-09** | Sin dependencias innecesarias: reutilización interna, necesidad, compatibilidad, licencia, mantenimiento y seguridad.                                                                                                                      |
| **P-10** | T-PKG es la base de composición de T-APP y T-CON (§15). Su destino operativo propio (`packages/<capa>/`) está condicionado a §13.1; su baseline no corresponde a los paquetes de `packages/config/` (sin `src/`, con build de integridad). |

---

## 11. Templates de Aplicaciones (T-APP)

|  Regla   | Descripción                                                                                                                                         |
| :------: | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A-01** | Destino `apps/` (o `apps/extensions/` según EE-DOC-006 §09); misma precondición de workspace (§07.4).                                               |
| **A-02** | Perfiles como templates separados (p. ej. `node`, `react-vite`); sin proliferación de condicionales. Perfiles concretos se fijan en EE-IMP-012-P04. |
| **A-03** | Mismas reglas P-02…P-05. E2E con Playwright solo por decisión explícita, vía `@eq-labs/config-playwright` (EE-ADR-002).                             |
| **A-04** | Las apps no contienen lógica core reutilizable.                                                                                                     |

---

## 12. Templates de Conectores (T-CON)

|  Regla   | Descripción                                                                                                            |
| :------: | :--------------------------------------------------------------------------------------------------------------------- |
| **C-01** | Destino `connectors/official/<name>`; nombre `@eq-labs/connector-<name>`.                                              |
| **C-02** | Encapsula integración externa como **límite de confianza**; aislamiento del core.                                      |
| **C-03** | No aloja manifiestos IaC de plataforma (EE-DOC-009 / EE-RFC-001).                                                      |
| **C-04** | Sin secretos ni credenciales.                                                                                          |
| **C-05** | `community/` y `experimental/` no son workspaces hasta tener código ejecutable: la precondición falla de forma segura. |
| **C-06** | Mismas reglas P-02…P-05.                                                                                               |

---

## 13. Templates Diferidos

Resultado de evaluación (EE-DOC-005 §04.4): **Diferido** — válidos, pero fuera del alcance inicial. No modifican la especificación vigente; se registran como Issues de backlog.

| Categoría | Motivo                                                            | Condición de reactivación                                              |
| :-------- | :---------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **T-WF**  | Riesgo de eludir EE-DOC-007; `.github/` restringido (007 §10.4)   | Definición previa en EE-DOC-007 + ADR/RFC; cumplir las reglas de abajo |
| **T-EXT** | Noción de "extensión" sin definición clara (SDK vs IDE vs plugin) | Definición en EE-DOC-004/006/013                                       |
| **T-CFG** | `packages/config/` ya es SSOT; valor incremental débil            | Evaluación en EE-IMP-012-P06                                           |

**Reglas que regirán T-WF al reactivarse:** no redefine GitHub Governance; no modifica branch protection, Rulesets, secrets, permisos ni required checks; no sobrescribe `.github/` fuera del mecanismo autorizado; no se usa para eludir EE-DOC-007.

### 13.1. Capacidad diferida: generación bajo `packages/<capa>/`

Resultado de evaluación: **Diferido** (EE-DOC-005 §04.4). No modifica la especificación vigente ni bloquea la aprobación de este documento; se registra Issue de backlog.

| Aspecto                   | Descripción                                                                                                                                                                                                                                                                                                  |
| :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Motivo                    | Los patrones de workspace de EE-DOC-006 §06.1 son literales y los 9 paquetes base ya existen como esqueletos planos (EE-TEC-001 D-09); el blueprint anidado de EE-DOC-006 §05 aún no está materializado                                                                                                      |
| Condición de reactivación | Que la implementación del core requiera sub-paquetes anidados; entonces se abre un **RFC Tipo D sobre EE-DOC-006** (número que corresponda al abrirlo)                                                                                                                                                       |
| Contenido mínimo del RFC  | Cambio **aditivo**: conservar los patrones literales y añadir los de subdirectorio (reemplazarlos excluiría del workspace a los paquetes base y haría fallar `validateWorkspace()`); actualizar `requiredPatterns` de `scripts/validate`; resolver estructura plana vs anidada; sincronizar `pnpm-lock.yaml` |
| Efecto en 012             | Al aprobarse, se valida la generación T-PKG bajo `packages/<capa>/` (prueba positiva) en una nueva versión de este documento                                                                                                                                                                                 |

---

## 14. Integración con Automation

### 14.1. Relación

El mecanismo canónico es `pnpm run generate`. EE-DOC-012 aporta los templates; EE-DOC-011 los ejecuta.

### 14.2. Matriz de responsabilidades

| Concepto                                 |   EE-DOC-011    |                  EE-DOC-012                   |
| :--------------------------------------- | :-------------: | :-------------------------------------------: |
| Comando `generate`                       |       Sí        |                      No                       |
| Engine y registro                        |       Sí        |                      No                       |
| Templates y metadata                     |   Referencia    |                      Sí                       |
| Estructura de templates                  |       No        |                      Sí                       |
| Input contract                           |   Compartido    |                      Sí                       |
| Quality Gates                            | Integra/invoca  |                 Debe respetar                 |
| Registro `scripts/plopfile.mjs`          |       Sí        | No (solo aporta templates por descubrimiento) |
| `scripts/generate` (wrapper, exit codes) |       Sí        |                      No                       |
| Fachada DX (`apps/cli`)                  | Sí (delegación) |              No (provee activos)              |

### 14.3. Cambio del Generation Engine

Un cambio del engine no pertenece a un template ni se oculta en él. Según EE-DOC-011 §07: _Type B en IMP, o ADR si cambia el modelo de scaffolding del ecosistema_.

### 14.4. Comportamiento de `generate`

| Momento                 | Comportamiento                                                          |
| :---------------------- | :---------------------------------------------------------------------- |
| Antes de EE-IMP-012-P05 | Sin registro: sale con 0 y mensaje "pendiente" (EE-IMP-011-P04)         |
| Desde P05               | Registro o templates ausentes/ inválidos ⇒ **exit ≠ 0** (No False Pass) |

El flujo debe admitir ejecución **no interactiva** (inputs por argumentos) para pruebas reproducibles; el `scripts/generate` as-built no reenvía argumentos a Plop, por lo que P05 debe habilitarlo (Tipo B).

---

## 15. Composición y Reutilización

Los templates pueden componerse si la relación es clara, los contratos compatibles, se reduce duplicación y no hay ciclos. Se prefiere _base → especializado_ sobre duplicar. No se crean abstracciones por similitud superficial.

---

## 16. Versionado de Templates

| Cambio                                                             | Tratamiento   |
| :----------------------------------------------------------------- | :------------ |
| Compatible (docs, validaciones compatibles, opcionales)            | patch / minor |
| Incompatible (inputs/outputs eliminados o renombrados, estructura) | major         |

`templates/` no es workspace: un cambio de template **no** requiere Changeset. Un paquete ya generado sigue el flujo estándar del monorepo; cambiar el template no altera paquetes existentes.

---

## 17. Seguridad

Prohibido incluir passwords, API keys, tokens, secrets, credenciales, certificados privados o información sensible. Los placeholders son referencias, no valores. Los conectores son límites de confianza. Los inputs son **no confiables**: se validan antes de usarlos para paths, comandos o configuración. Los templates quedan cubiertos por QG-SEC-002.

---

## 18. Determinismo y Reproducibilidad

La generación es reproducible bajo condiciones equivalentes. Se evita estado oculto, archivos locales no declarados, credenciales implícitas y servicios externos. El uso de tiempo, aleatoriedad o entorno debe justificarse y declararse. Determinismo contractual (EE-DOC-011 §05.2): no exige salida idéntica byte a byte en procesos interactivos.

---

## 19. Validación de Artefactos Generados

### 19.1. Flujo

```text
Input → Input Validation → Precondition Validation → Template Resolution
      → Generation → Artifact Validation → Applicable Quality Gates → Success
```

### 19.2. Artifact Validation

Según el template: archivos esperados presentes, prohibidos ausentes, estructura, nombres, referencias, imports, metadata, configuración y compatibilidad con el workspace.

### 19.3. Fallo seguro

Ante error: exit ≠ 0; no declara éxito; no oculta el error; no relaja un gate; no fuerza `exit 0`; no deja salida parcial (se revierte solo cuando es seguro).

### 19.4. Quality Gates aplicables a lo generado

Catálogo en **EE-DOC-010** (no se redefine).

| Gate                      | Aplicabilidad a artefactos generados                                          |
| :------------------------ | :---------------------------------------------------------------------------- |
| QG-TYPE-001               | T-PKG, T-APP, T-CON                                                           |
| QG-LINT-001               | T-PKG, T-APP, T-CON                                                           |
| QG-FMT-001                | Salida de código generada; `--check`                                          |
| QG-BUILD-001              | T-PKG, T-APP, T-CON                                                           |
| QG-TEST-001               | Solo si el template incluye tests; sin tests ⇒ SKIPPED por 0 tareas (no PASS) |
| QG-SEC-001 / QG-SEC-002   | Dependencias exactas auditables; ausencia de secretos                         |
| QG-REPO-001 / QG-ARCH-001 | Estructura y paths de destino autorizados; evidencia de `validateTemplates()` |
| QG-DOC-001 / 002          | Metadatos de la raíz; no validan documentos generados                         |

> **Limitación:** no existe Quality Gate que valide la estructura EE-DOC-002 de documentos T-DOC. Su conformidad se verifica mediante `validateTemplates()` (contrato del template) y la revisión arquitectónica (EE-DOC-002 §19). No se crea gate nuevo.

### 19.5. Formateo, dry-run, compilación en memoria

El formateo `write` no sustituye la validación `--check`. `dry-run` y compilación en memoria son opcionales por template.

---

## 20. Prohibiciones

1. Múltiples mecanismos independientes de generación.
2. Duplicar templates sin justificación; duplicarlos en `assets/templates/`.
3. `plopfile` independiente por template.
4. Cambiar el engine desde un template.
5. Lógica comercial o de producto.
6. Secretos.
7. Inputs o variables ocultas.
8. Modificar silenciosamente documentos normativos o el índice EE-DOC-001.
9. Asignar IDs documentales (D-01).
10. Saltarse aprobación, RFC o ADR.
11. Generar artefactos que contradigan EE-DOC-006 o EE-DOC-007.
12. Redefinir Quality Gates de EE-DOC-010.
13. Forzar `exit 0` ante errores u ocultar fallos.
14. Modificar `pnpm-workspace.yaml` o `scripts/validate` desde un template.
15. Declarar `test` con `--passWithNoTests` en templates.
16. Versiones con rango en `dependencies`/`devDependencies`.
17. Materializar `templates/` antes de L-03.
18. Dependencias o abstracciones innecesarias; estado oculto.
19. Generar bajo `.github/` (templates diferidos, §13).
20. Alojar scripts, helpers o acciones de Plop en `templates/` (L-07).

---

## 21. Plan de Implementación y Fases (Normativo)

> Ciclo por unidad: Implementación → Validación → Borrador de Documentación Técnica (EE-DOC-005). Documentación técnica consolidada: **EE-TEC-007**.

**Prerrequisito de materialización (L-03):** EE-RFC-002 Aprobado y aplicado (006 v1.5.0 + 001 v2.9.0) **y** EE-DOC-012 Aprobado.

```mermaid
flowchart LR
    D["EE-DOC-012"] --> P01["P01 Inventory & Contract"]
    P01 --> P02["P02 Template Structure"]
    P02 --> P03["P03 Document Templates"]
    P03 --> P04["P04 Code Templates"]
    P04 --> P05["P05 Generation Integration"]
    P05 --> P06["P06 Validation & Closure"]
```

### 21.1. Catálogo de fases

| Fase    | Identificador          | Propósito técnico                                                                                                                                       | Entregable                  |
| :------ | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------- |
| **P01** | Inventory and Contract | Inventario (`assets/templates/`, `marketplace/templates/`, `scripts/generate`, `plop`), duplicidades, ownership, borrador del esquema                   | EE-IMP-012-P01              |
| **P02** | Template Structure     | Crear `templates/` (README, `template.schema.json`, directorios de categoría); `allowedTopLevel`; CODEOWNERS; exclusión Prettier; `validateTemplates()` | EE-IMP-012-P02              |
| **P03** | Document Templates     | T-DOC (DOC, ADR, IMP, TEC, **RFC** §18.5)                                                                                                               | EE-IMP-012-P03              |
| **P04** | Code Templates         | T-PKG, T-APP, T-CON                                                                                                                                     | EE-IMP-012-P04              |
| **P05** | Generation Integration | Registro `scripts/plopfile.mjs`; ajuste de `scripts/generate` (§14.4); pruebas extremo a extremo                                                        | EE-IMP-012-P05              |
| **P06** | Validation and Closure | Pruebas negativas, evidencia, T-CFG (§13), **EE-TEC-007**                                                                                               | EE-IMP-012-P06 + EE-TEC-007 |

### 21.2. Criterios de aceptación verificables

| Fase    | Criterio                                                                                                                                                                                                                                                                                                                                                         |
| :------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P01** | Inventario con ownership y duplicidades resueltas; esquema documentado; `pnpm run validate` PASS sin cambios de estructura                                                                                                                                                                                                                                       |
| **P02** | `pnpm run validate` PASS con `templates/` presente (QG-ARCH-001 sin hallazgos); `validateTemplates()` falla ante un `template.json` inválido (prueba negativa); CODEOWNERS cubre `templates/`                                                                                                                                                                    |
| **P03** | Cada template T-DOC pasa `validateTemplates()`; rechaza ID duplicado y nombre de archivo inválido                                                                                                                                                                                                                                                                |
| **P04** | Cada template de código pasa `validateTemplates()` (incl. sin rangos de versión) y el escaneo de secretos; T-PKG se valida estáticamente como base de T-APP/T-CON                                                                                                                                                                                                |
| **P05** | `pnpm run generate` (no interactivo) crea una app y un conector de muestra (T-APP, T-CON); `pnpm install && pnpm run validate` PASS sobre ellos; T-PKG hacia `packages/<capa>/` ⇒ exit ≠ 0 (prueba negativa del guard); entradas inválidas, destino duplicado, destino fuera de workspace, registro ausente e ID duplicado ⇒ exit ≠ 0; la muestra no se commitea |
| **P06** | Evidencia consolidada; descubrimientos cerrados; EE-TEC-007; sin Adoptados abiertos                                                                                                                                                                                                                                                                              |

### 21.3. Riesgos conocidos

| Riesgo                                                                                                                           | Mitigación                                               |
| :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| Prettier infiere parser Glimmer para `.hbs`                                                                                      | L-06                                                     |
| Deriva de versiones fijadas en templates frente al lockfile                                                                      | Verificación en P05/P06; responsable: owner del template |
| Patrones de workspace as-built literales: T-PKG sin destino operativo propio (los destinos cubiertos corresponden a T-APP/T-CON) | §07.4 y §13.1: fallo seguro; RFC futuro sobre EE-DOC-006 |
| — (RFC formalizado en EE-DOC-002 §18.5)                                                                                          | —                                                        |
| `scripts/plopfile.mjs` vs raíz                                                                                                   | §06.2                                                    |

### 21.4. Requisitos de cada unidad (EE-IMP-012-PXX)

Propósito, artefactos físicos, dependencias, restricciones, criterios de aceptación, Quality Gates aplicables, evidencia, descubrimientos (EE-DOC-005 §04), decisiones y relación con EE-TEC-007. Las decisiones arquitectónicas no se ocultan en el código.

---

## 22. Evolución

| Cambio                                                                                        | Mecanismo                                 |
| :-------------------------------------------------------------------------------------------- | :---------------------------------------- |
| Redacción / precisión                                                                         | Type A                                    |
| Nuevos campos de `template.json`, nuevos templates dentro del alcance, ubicación del registro | Type B (IMP)                              |
| Cambio del engine o del modelo de scaffolding                                                 | ADR (EE-DOC-011 §07)                      |
| Reactivar T-WF / T-EXT / T-CFG                                                                | Condiciones de §13; ADR/RFC según alcance |
| Cambio en `templates/` top-level o en 006/001                                                 | RFC (Tipo D)                              |
| Evolucionar plantilla de RFC (§18.5)                                                          | Cambio gobernado sobre EE-DOC-002         |

La evolución del engine no se introduce vía templates; la de governance no se introduce vía templates de workflow.

---

## 23. Cumplimiento

Antes de aprobar o congelar:

**Ubicación y estructura**

- [x] EE-RFC-002 aprobado y aplicado (006 v1.5.0, 001 v2.9.0).
- [x] `templates/` conforme a §06; `allowedTopLevel` actualizado; CODEOWNERS y exclusión Prettier aplicados.

**Contratos**

- [x] `template.json` válido en todos los templates (`validateTemplates()`).
- [x] Inputs, outputs, precondiciones y `allowedTargets` declarados.

**Arquitectura y governance**

- [x] Compatible con EE-DOC-006, 007, 010, 011; sin lógica de negocio; sin duplicación.
- [x] Categorías diferidas ausentes del árbol materializado (T-WF/T-EXT/T-CFG = Diferido §13).

**Calidad**

- [x] Gates de §19.4 satisfechos sobre artefactos generados (prueba E2E P05).
- [x] Errores producen exit ≠ 0; sin `exit 0` forzado.
- [x] Generación hacia un destino sin patrón de workspace falla con exit ≠ 0 (prueba negativa).
- [x] Sin versiones con rango; sin `--passWithNoTests`.

**Seguridad e idioma**

- [x] Sin secretos; inputs validados; paths controlados.
- [x] Idioma por categoría conforme a §08.

**Documentación**

- [x] EE-IMP-012-P01…P06 y EE-TEC-007 completados; descubrimientos registrados.

---

## 24. Referencias

| Código         | Documento                                          | Relación                                              |
| :------------- | :------------------------------------------------- | :---------------------------------------------------- |
| **EE-DOC-001** | Master Documentation Index                         | Roadmap, SSOT de códigos                              |
| **EE-DOC-002** | Document Design Template                           | Estándar documental; §16.1 idioma; §18 plantillas     |
| **EE-DOC-003** | Engineering Ecosystem Constitution                 | Principios                                            |
| **EE-DOC-004** | Engineering Architecture                           | Fronteras arquitectónicas                             |
| **EE-DOC-005** | Development Workflow                               | Cambio gobernado                                      |
| **EE-DOC-006** | Repository Structure                               | Padre estructural                                     |
| **EE-DOC-007** | GitHub Governance                                  | Plataforma `.github/`                                 |
| **EE-DOC-010** | Quality Gates                                      | Catálogo y agregación                                 |
| **EE-DOC-011** | Automation                                         | Mecanismo de generación (v1.0.0 Aprobado; EE-TEC-006) |
| **EE-ADR-001** | Workspace Task Orchestration                       | pnpm / Turborepo                                      |
| **EE-ADR-002** | Testing Standard                                   | Vitest / Playwright; NO_TESTS                         |
| **EE-ADR-003** | Node.js Baseline 24 LTS                            | Runtime                                               |
| **EE-ADR-004** | Quality Gates Progressive Adoption                 | Mandatory ≠ Implemented ≠ Enforced                    |
| **EE-RFC-002** | Templates Top-Level Directory                      | Autoriza `templates/`                                 |
| **EE-TEC-006** | Consolidated Technical Documentation of EE-DOC-011 | Precedente as-built                                   |
| **EE-TEC-007** | Consolidated Technical Documentation of EE-DOC-012 | Documentación técnica consolidada (v1.0.0 Completado) |

---

## 25. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                                                                   | Cambios                                                                                                                                                                                                                                                                                              | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| **v0.1.0** | 2026-09-30 | Equipo de Arquitectura | —                      | Apertura EE-DOC-012                                                      | Borrador inicial                                                                                                                                                                                                                                                                                     | Borrador       |
| **v0.2.0** | 2026-10-01 | Equipo de Arquitectura | —                      | Observaciones OBS-012-01…03                                              | Frontera 011/012; T-WF vs 007; validación de inputs y artefactos; fallo seguro; formateo vs QG                                                                                                                                                                                                       | En Elaboración |
| **v0.3.0** | 2026-10-01 | Equipo de Arquitectura | —                      | Revisión arquitectónica B1–B3, M1–M6, m1–m5 y decisiones de Arquitectura | Estructura conforme a EE-DOC-002 §18.1; `templates/` vía EE-RFC-002; registro Plop y propiedad; contrato `template.json` con `validateTemplates()`; alcance T-DOC/T-PKG/T-APP/T-CON y diferidos; padre EE-DOC-006; mapeo a QG; regla de ID; idioma por categoría; EE-TEC-007; criterios verificables | En Elaboración |
| **v0.3.1** | 2026-10-01 | Equipo de Arquitectura | —                      | Consenso de revisión de decisiones                                       | L-06 (`.prettierignore`) y L-07; registro Tipo B en EE-IMP-012-P05; verificación de workspace por el engine y limitación de patrones; RFC de T-DOC como Diferido; matriz 011/012 ampliada; prohibición 20                                                                                            | En Elaboración |
| **v0.3.2** | 2026-10-01 | Equipo de Arquitectura | —                      | Decisión sobre limitación de T-PKG                                       | Limitación de destinos adoptada (§07.4); capacidad `packages/<capa>/` diferida a RFC futuro aditivo (§13.1); P-10; criterios P04/P05 ajustados; reenvío de argumentos en `generate`                                                                                                                  | En Elaboración |
| **v0.4.0** | 2026-10-01 | Equipo de Arquitectura | Equipo de Arquitectura | Aprobación arquitectónica                                                | RFC-002 aplicado; L-03 con 001 v2.9.0; listo para EE-IMP-012-P01                                                                                                                                                                                                                                     | **Aprobado**   |
| **v0.5.0** | 2026-10-01 | Equipo de Arquitectura | Equipo de Arquitectura | Activación T-DOC RFC                                                     | EE-DOC-002 §18.5; §04.2/D-07/D-012-06; P03 incluye ee-rfc                                                                                                                                                                                                                                            | **Aprobado**   |
| **v1.0.0** | 2026-10-02 | Equipo de Arquitectura | Equipo de Arquitectura | Validación Final + congelación                                           | EE-IMP-012-P01…P06 + EE-TEC-007 Completados; generate operativo; T-CFG Diferido                                                                                                                                                                                                                      | **Congelado**  |

### 25.1. Trazabilidad de la revisión 2026-10-01

| Hallazgo                      | Resolución                                           | Sección           |
| :---------------------------- | :--------------------------------------------------- | :---------------- |
| B1 Estructura/plantilla       | Reestructurado                                       | Todo el documento |
| B2 Plop/registro/enforcement  | Propiedad 011; descubrimiento; `validateTemplates()` | §06.2, §07.5, §14 |
| B3 `templates/` no autorizado | EE-RFC-002; L-01…L-06                                | §02.4, §05.4      |
| M1 Documento padre            | EE-DOC-006 + nota de roadmap                         | Metadatos         |
| M2 Cita de EE-DOC-011         | Textual                                              | §14.3             |
| M3 Mapeo a QG                 | Tabla                                                | §19.4             |
| M4 Alcance/T-WF               | Diferidos                                            | §04.1, §13        |
| M5 Asignación de ID           | D-01                                                 | §09               |
| M6 Idioma                     | Tabla                                                | §08               |
| m1 Ejemplo de layout          | `templates/<cat>/<name>/`                            | §06.1             |
| m2 Versiones exactas          | P-02, `validateTemplates()`                          | §10, §07.5        |
| m3 Baseline T-PKG             | Lista                                                | §10.1             |
| m4 Criterios verificables     | Tabla                                                | §21.2             |
| m5 Código TEC                 | EE-TEC-007                                           | §21, §24          |

### 25.2. Decisiones de elaboración confirmadas por Arquitectura (2026-10-01)

| ID       | Decisión                                                                                                                    | Tipo / mecanismo                   |
| :------- | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------- |
| D-012-01 | `templates/` de primer nivel                                                                                                | Tipo D — EE-RFC-002                |
| D-012-02 | Alcance inicial T-DOC/T-PKG/T-APP/T-CON; Diferidos T-WF/T-EXT/T-CFG                                                         | Tipo A — Diferido (backlog)        |
| D-012-03 | Validación de `template.json` en `validateTemplates()` dentro de `scripts/validate`, bajo QG-REPO-001                       | Tipo B — sin cambio de EE-DOC-010  |
| D-012-04 | Registro Plop en `scripts/plopfile.mjs`                                                                                     | Tipo B — EE-IMP-012-P05            |
| D-012-05 | `assets/templates/` delimitado (estático/pasivo) frente a `templates/`                                                      | Tipo A — §02.4 + EE-RFC-002        |
| D-012-06 | Template de RFC (T-DOC) **activado** tras EE-DOC-002 §18.5 (v1.6.0)                                                         | Tipo A — **Adoptado** (2026-10-01) |
| D-012-07 | `validateTemplates()` desde P02                                                                                             | Replanificación de fases           |
| D-012-08 | Verificación de workspace por el engine; templates no tocan `pnpm-workspace.yaml`                                           | Tipo B                             |
| D-012-09 | Exclusión de `templates/**/files/**` en `.prettierignore`                                                                   | Tipo A                             |
| D-012-10 | Sincronización de EE-DOC-001 como último paso del paquete EE-RFC-002 (no diferida a una revisión periódica)                 | Tipo D — EE-RFC-002 §08            |
| D-012-11 | Limitación de destinos de workspace adoptada; ampliación aditiva de patrones diferida a RFC futuro sobre EE-DOC-006 (§13.1) | Tipo A — Diferido                  |

---

## 26. Cierre Documental

### 26.1. Validación Final

| Campo           | Valor                                                                                                                                |
| :-------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Fecha**       | 2026-10-02                                                                                                                           |
| **Evidencias**  | EE-IMP-012-P01…P06 Completados; EE-TEC-007 v1.0.0; commits P03–P05 (`2e651cd`…`1c8d7c6`); E2E generate +/-; `pnpm run validate` PASS |
| **Responsable** | Equipo de Arquitectura                                                                                                               |

### 26.2. Dictamen de aprobación arquitectónica (2026-10-01)

> **EE-DOC-012 v0.5.0 Aprobado.** Norma de Templates lista para implementación (EE-IMP-012-P01…).  
> Prerrequisito estructural **EE-RFC-002** Aprobado y aplicado (006 v1.5.0 + 001 v2.9.0).  
> Diferidos explícitos (§13): T-WF, T-EXT, T-CFG. **T-DOC RFC** en alcance (EE-DOC-002 §18.5).

### 26.3. Dictamen de Validación Final y congelación (2026-10-02)

> **EE-DOC-012 v1.0.0 Congelado.** Implementación P01–P06 y **EE-TEC-007** completados.  
> Sistema as-built: `templates/` + `scripts/plopfile.mjs` + `pnpm run generate` (args posicionales Plop 4).  
> Diferidos permanecen fuera de alcance (§13, §13.1). Sin Adoptados abiertos bloqueantes.

### 26.4. Estado Final

| Campo                     | Valor                                   |
| :------------------------ | :-------------------------------------- |
| **Estado documental**     | **Congelado**                           |
| **Versión**               | v1.0.0                                  |
| **Documentación técnica** | EE-TEC-007 v1.0.0 Completado            |
| **Próximo hito**          | **EE-DOC-013** — AI Ecosystem (roadmap) |

### 26.5. Condiciones para el Cierre (Congelación)

| Condición                      | Estado         |
| :----------------------------- | :------------- |
| Revisión arquitectónica        | ✅             |
| Aprobación                     | ✅ v0.5.0      |
| EE-RFC-002 aprobado y aplicado | ✅             |
| EE-IMP-012-P01…P06             | ✅ Completados |
| EE-TEC-007                     | ✅ Completado  |
| Validación Final               | ✅ 2026-10-02  |

---

## FIN DEL DOCUMENTO
