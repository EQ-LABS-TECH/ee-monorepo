# EE-IMP-012-P03 — Document Templates

Evidencia técnica de **P03** (T-DOC) de **EE-DOC-012 — Templates**.

---

## METADATOS

| Campo                      | Valor                                                 |
| :------------------------- | :---------------------------------------------------- |
| **ID**                     | EE-IMP-012-P03                                        |
| **Documento**              | Document Templates                                    |
| **Código corto**           | EE-IMP-012-P03                                        |
| **Fase de implementación** | P03 — Document Templates (T-DOC)                      |
| **Tipo**                   | Documento Técnico de Implementación                   |
| **Clasificación**          | Implementación                                        |
| **Nivel**                  | Técnico                                               |
| **Normativo**              | No                                                    |
| **Versión**                | v1.4.0                                                |
| **Estado**                 | Completado                                            |
| **Propietario**            | Equipo de Arquitectura                                |
| **Documento padre**        | EE-DOC-012 — Templates (v0.5.0)                       |
| **Dependencias**           | EE-IMP-012-P02 Completado, EE-DOC-002 §18, EE-DOC-006 |
| **Aprobado por**           | Equipo de Arquitectura                                |
| **Audiencia**              | Arquitectura, Desarrollo                              |
| **Fecha de creación**      | 2026-10-01                                            |
| **Última revisión**        | 2026-10-01                                            |
| **Próxima revisión**       | — (fase Completada)                                   |

---

## 01. Objetivo

Materializar templates T-DOC bajo `templates/document/` para:

| id       | Tipo           | Norma            | Destino canónico en repo |
| :------- | :------------- | :--------------- | :----------------------- |
| `ee-doc` | EE-DOC-XXX     | EE-DOC-002 §18.1 | `docs/architecture/`     |
| `ee-adr` | EE-ADR-XXX     | EE-DOC-002 §18.2 | `docs/adr/`              |
| `ee-imp` | EE-IMP-XXX-PXX | EE-DOC-002 §18.3 | `docs/developer/`        |
| `ee-tec` | EE-TEC-XXX     | EE-DOC-002 §18.4 | `docs/architecture/`     |
| `ee-rfc` | EE-RFC-XXX     | EE-DOC-002 §18.5 | `docs/rfc/`              |

**Incluido:** T-DOC RFC tras **EE-DOC-002 v1.6.0 §18.5** y **EE-DOC-012 v0.5.0**.

Reglas **D-01…D-06** (EE-DOC-012 §09): el ID es **input**; no se modifica EE-DOC-001; destino solo bajo `docs/`; estado inicial **En Elaboración** / v0.1.0 / `Aprobado por` = `—`.

**Nota:** La ejecución de Plop es **P05**. P03 deja contrato + `files/*.hbs` + README válidos para `validateTemplates()`.

---

## 02. Mapa `docs/` (as-built monorepo)

```text
docs/
├── architecture/   # EE-DOC-XXX, EE-TEC-XXX
├── developer/      # EE-IMP-XXX-PXX
├── adr/            # EE-ADR-XXX
└── rfc/            # EE-RFC-XXX
```

| Template id | `allowedTargets` | `relativePath` default (input) |
| :---------- | :--------------- | :----------------------------- |
| `ee-doc`    | `docs/`          | `architecture`                 |
| `ee-adr`    | `docs/`          | `adr`                          |
| `ee-imp`    | `docs/`          | `developer`                    |
| `ee-tec`    | `docs/`          | `architecture`                 |
| `ee-rfc`    | `docs/`          | `rfc`                          |

El engine (P05) debe resolver: `docs/{{relativePath}}/{{fileName}}` y rechazar paths fuera de `docs/`.

---

## 03. Layout a materializar

```text
templates/document/
├── ee-doc/
│   ├── template.json
│   ├── README.md
│   └── files/
│       └── EE-*-XXX_Title.md.hbs
├── ee-adr/
│   ├── template.json
│   ├── README.md
│   └── files/
│       └── EE-*-XXX_Title.md.hbs
├── ee-imp/
│   ├── template.json
│   ├── README.md
│   └── files/
│       └── EE-*-XXX_Title.md.hbs
└── ee-tec/
    ├── template.json
    ├── README.md
    └── files/
        └── EE-*-XXX_Title.md.hbs
```

**Importante:** `template.json` y `README.md` viven en `templates/document/<id>/`, **no** dentro de `files/`.

Eliminar `templates/document/.gitkeep` si existe.

---

## 03.1. Nombre del archivo `.hbs` (normativa de implementación)

| Opción                       | Ejemplo                   | Dictamen                        |
| :--------------------------- | :------------------------ | :------------------------------ |
| **Nombre propio (adoptado)** | `EE-DOC-XXX_Title.md.hbs` | **Obligatorio en P03+**         |
| Nombre genérico              | `body.md.hbs`             | **Rechazado** para este alcance |

**Por qué se había usado `body.md.hbs`:** simplificación temporal en v1.1.0 (el engine en P05 resuelve el nombre de salida a partir de `docId` + `title`; el `.hbs` es solo la fuente).

**Por qué se vuelve a nombre propio:**

1. **D-02 / EE-DOC-006 §07.1** — el patrón de nombre del artefacto generado debe ser visible en el tree del template.
2. Trazabilidad en code review sin abrir `template.json`.
3. Alineación con el borrador inicial de P03 y con `outputs` del contrato.
4. `validateTemplates()` no exige el nombre del `.hbs`; la convención es de **calidad de implementación**, no del schema.

| Template | Archivo en `files/`           |
| :------- | :---------------------------- |
| `ee-doc` | `EE-DOC-XXX_Title.md.hbs`     |
| `ee-adr` | `EE-ADR-XXX_Title.md.hbs`     |
| `ee-imp` | `EE-IMP-XXX-PXX_Title.md.hbs` |
| `ee-tec` | `EE-TEC-XXX_Title.md.hbs`     |
| `ee-rfc` | `EE-RFC-XXX_Title.md.hbs`     |

El engine (P05) sustituye `XXX` / título al generar; el nombre del `.hbs` es el **patrón documental**, no un literal congelado en disco de salida.

## 04. `template.json` canónicos

### 04.1. `ee-doc` — `templates/document/ee-doc/template.json`

```json
{
  "schemaVersion": "1",
  "id": "ee-doc",
  "name": "Engineering Ecosystem Document (EE-DOC)",
  "category": "T-DOC",
  "version": "0.1.0",
  "description": "Scaffold for EE-DOC-XXX normative documents (EE-DOC-002 §18.1).",
  "target": "docs/architecture/",
  "owner": "architecture",
  "locale": "es",
  "allowedTargets": ["docs/"],
  "inputs": [
    {
      "name": "docId",
      "type": "string",
      "required": true,
      "pattern": "^EE-DOC-[0-9]{3}$",
      "description": "Document code (D-01: never assigned by template)."
    },
    {
      "name": "title",
      "type": "string",
      "required": true,
      "description": "Document title (English short name)."
    },
    {
      "name": "relativePath",
      "type": "string",
      "required": true,
      "default": "architecture",
      "description": "Subpath under docs/ (default: architecture)."
    },
    {
      "name": "purpose",
      "type": "string",
      "required": false,
      "description": "One-line purpose for §01."
    },
    {
      "name": "createdAt",
      "type": "string",
      "required": false,
      "description": "ISO date YYYY-MM-DD; engine may inject."
    }
  ],
  "outputs": ["EE-DOC-XXX_Title.md"],
  "preconditions": ["docId must not already exist in EE-DOC-001", "destination under docs/ only"]
}
```

### 04.2. `ee-adr` — `templates/document/ee-adr/template.json`

```json
{
  "schemaVersion": "1",
  "id": "ee-adr",
  "name": "Architecture Decision Record (EE-ADR)",
  "category": "T-DOC",
  "version": "0.1.0",
  "description": "Scaffold for EE-ADR-XXX (EE-DOC-002 §18.2).",
  "target": "docs/adr/",
  "owner": "architecture",
  "locale": "es",
  "allowedTargets": ["docs/"],
  "inputs": [
    {
      "name": "docId",
      "type": "string",
      "required": true,
      "pattern": "^EE-ADR-[0-9]{3}$",
      "description": "ADR code (D-01)."
    },
    {
      "name": "title",
      "type": "string",
      "required": true
    },
    {
      "name": "relativePath",
      "type": "string",
      "required": true,
      "default": "adr"
    },
    {
      "name": "parentDoc",
      "type": "string",
      "required": false,
      "pattern": "^EE-DOC-[0-9]{3}$",
      "description": "Related normative document."
    },
    {
      "name": "purpose",
      "type": "string",
      "required": false
    },
    {
      "name": "createdAt",
      "type": "string",
      "required": false
    }
  ],
  "outputs": ["EE-ADR-XXX_Title.md"],
  "preconditions": ["destination under docs/ only"]
}
```

### 04.3. `ee-imp` — `templates/document/ee-imp/template.json`

```json
{
  "schemaVersion": "1",
  "id": "ee-imp",
  "name": "Implementation Unit (EE-IMP)",
  "category": "T-DOC",
  "version": "0.1.0",
  "description": "Scaffold for EE-IMP-XXX-PXX (EE-DOC-002 §18.3).",
  "target": "docs/developer/",
  "owner": "architecture",
  "locale": "es",
  "allowedTargets": ["docs/"],
  "inputs": [
    {
      "name": "docId",
      "type": "string",
      "required": true,
      "pattern": "^EE-IMP-[0-9]{3}-P[0-9]{2}$",
      "description": "IMP unit code (D-01)."
    },
    {
      "name": "title",
      "type": "string",
      "required": true
    },
    {
      "name": "relativePath",
      "type": "string",
      "required": true,
      "default": "developer"
    },
    {
      "name": "parentDoc",
      "type": "string",
      "required": false,
      "pattern": "^EE-DOC-[0-9]{3}$",
      "description": "Parent normative EE-DOC."
    },
    {
      "name": "purpose",
      "type": "string",
      "required": false
    },
    {
      "name": "createdAt",
      "type": "string",
      "required": false
    }
  ],
  "outputs": ["EE-IMP-XXX-PXX_Title.md"],
  "preconditions": ["destination under docs/ only"]
}
```

### 04.4. `ee-tec` — `templates/document/ee-tec/template.json`

```json
{
  "schemaVersion": "1",
  "id": "ee-tec",
  "name": "Consolidated Technical Documentation (EE-TEC)",
  "category": "T-DOC",
  "version": "0.1.0",
  "description": "Scaffold for EE-TEC-XXX (EE-DOC-002 §18.4).",
  "target": "docs/architecture/",
  "owner": "architecture",
  "locale": "es",
  "allowedTargets": ["docs/"],
  "inputs": [
    {
      "name": "docId",
      "type": "string",
      "required": true,
      "pattern": "^EE-TEC-[0-9]{3}$",
      "description": "TEC code (D-01)."
    },
    {
      "name": "title",
      "type": "string",
      "required": true
    },
    {
      "name": "parentDoc",
      "type": "string",
      "required": true,
      "pattern": "^EE-DOC-[0-9]{3}$",
      "description": "Parent normative document code."
    },
    {
      "name": "relativePath",
      "type": "string",
      "required": true,
      "default": "architecture"
    },
    {
      "name": "purpose",
      "type": "string",
      "required": false
    },
    {
      "name": "createdAt",
      "type": "string",
      "required": false
    }
  ],
  "outputs": ["EE-TEC-XXX_Title.md"],
  "preconditions": ["destination under docs/ only"]
}
```

---

### 04.5. `ee-rfc` — `templates/document/ee-rfc/template.json`

```json
{
  "schemaVersion": "1",
  "id": "ee-rfc",
  "name": "Request for Comments (EE-RFC)",
  "category": "T-DOC",
  "version": "0.1.0",
  "description": "Scaffold for EE-RFC-XXX governed change proposals (EE-DOC-002 §18.5).",
  "target": "docs/rfc/",
  "owner": "architecture",
  "locale": "es",
  "allowedTargets": ["docs/"],
  "inputs": [
    {
      "name": "docId",
      "type": "string",
      "required": true,
      "pattern": "^EE-RFC-[0-9]{3}$",
      "description": "RFC code (D-01: never assigned by template)."
    },
    {
      "name": "title",
      "type": "string",
      "required": true,
      "description": "RFC title in English (document name convention)."
    },
    {
      "name": "relativePath",
      "type": "string",
      "required": true,
      "default": "rfc",
      "description": "Subpath under docs/ (default: rfc)."
    },
    {
      "name": "solicitante",
      "type": "string",
      "required": false,
      "description": "Originating document or discovery source."
    },
    {
      "name": "affectedDocs",
      "type": "string",
      "required": false,
      "description": "Normative documents in the sync package."
    },
    {
      "name": "createdAt",
      "type": "string",
      "required": false
    }
  ],
  "outputs": ["EE-RFC-XXX_Title.md"],
  "preconditions": [
    "docId must not already exist in the documentation tree",
    "destination under docs/rfc/ only"
  ]
}
```

## 05. Cuerpos `.hbs` (alineados a EE-DOC-002 §18)

Estado inicial siempre: **En Elaboración**, **v0.1.0**, **Aprobado por** = `—` (**D-04**).  
No generar estados Aprobado/Congelado.

### 05.1. Conformidad con EE-DOC-002 (dictamen)

| Tipo       | § DOC-002 | ¿Aplica Cierre CC / Plan XX?                                                                                                | Gaps corregidos en v1.2.0                |
| :--------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| **EE-DOC** | §18.1     | **Sí** si el DOC es implementable (006+). Placeholder XX+CC obligatorios en el scaffold; nota de aplicabilidad para 001–005 | Faltaba **XX Plan**, **CC Cierre**       |
| **EE-ADR** | §18.2     | No usa CC de DOC; cierra con Consecuencias + Referencias + Historial                                                        | Alinear Justificación / Consecuencias XX |
| **EE-IMP** | §18.3     | No CC de DOC; Validaciones + Trazabilidad + Referencias + Historial                                                         | Alinear secciones 04–YY al §18.3         |
| **EE-TEC** | §18.4     | No CC de DOC; consolidación as-built + historial                                                                            | Alinear 02–YY al §18.4                   |
| **EE-RFC** | §18.5     | No CC de DOC; Resolución + plan post-aprobación                                                                             | Activado v1.3.0 (DOC-002 v1.6.0)         |

### 05.2. DOC — `files/EE-DOC-XXX_Title.md.hbs` (EE-DOC-002 §18.1)

```handlebars
#
{{docId}}
—
{{title}}

Este documento sigue el estándar **EE-DOC-002 — Document Design Template** y se desarrolla conforme
al ciclo documental definido por **EE-DOC-005 — Development Workflow**. --- ## METADATOS | Campo |
Valor | | :---- | :---- | | **ID** |
{{docId}}
| | **Documento** |
{{title}}
| | **Código corto** |
{{docId}}
| | **Tipo** | Documento Normativo | | **Clasificación** | Especializado | | **Nivel** |
Especializado | | **Normativo** | Sí | | **Versión** | v0.1.0 | | **Estado** | En Elaboración | |
**Propietario** | Equipo de Arquitectura | | **Documento padre** | — | | **Dependencias** |
EE-DOC-001, EE-DOC-002, EE-DOC-005 | | **Aprobado por** | — | | **Audiencia** | Arquitectura,
Desarrollo | | **Fecha de creación** |
{{createdAt}}
| | **Última revisión** |
{{createdAt}}
| | **Próxima revisión** | Pendiente | --- ## 01. Propósito

{{#if purpose}}{{purpose}}{{else}}[Una línea clara que define por qué existe este documento.]{{/if}}

--- ## 02. Alcance ### 02.1. Incluye - ### 02.2. No incluye - --- ## 03. Contenido Normativo ###
03.1. --- ## [Secciones variables numeradas: 04 a XX-1] [Secciones específicas según el dominio del
documento.] --- ## XX. Plan de Implementación y Fases (Normativo) > **Aplicabilidad:** Obligatoria
cuando el documento genera implementación física (EE-DOC-006 en adelante). No aplica a EE-DOC-001 a
EE-DOC-005 (omitir o dejar como N/A). La implementación física se rige por unidades
**EE-IMP-XXX-PXX** y el ciclo de **EE-DOC-005**. ### XX.1. Catálogo Oficial de Fases | Fase |
Identificador | Propósito Técnico | Entregable Principal / Artefacto | | :--- | :------------ |
:---------------- | :------------------------------- | | **Fase N** | [Nombre corto] | [Propósito] |
EE-IMP-XXX-PXX | ### XX.2. Especificaciones Técnicas por Unidad de Implementación Cada unidad
materializa elementos normativos; el detalle físico vive en **EE-IMP-XXX-PXX**. --- ## YY. Evolución
Cambios gobernados según **EE-DOC-005 §04** (Aclaración, Especialización Técnica, ADR o RFC). --- ##
ZZ. Cumplimiento Conformidad verificable respecto a este documento y Quality Gates aplicables
(**EE-DOC-010**). Desviación no autorizada = incumplimiento. --- ## AA. Referencias | Código |
Documento | Descripción | | :----- | :-------- | :---------- | | **EE-DOC-001** | Master
Documentation Index | Índice maestro | | **EE-DOC-002** | Document Design Template | Plantilla
documental | | **EE-DOC-005** | Development Workflow | Ciclo documental | --- ## BB. Historial de
Cambios | Versión | Fecha | Autor | Aprobado por | Motivo | Cambios | Estado | | :------ | :---- |
:---- | :----------- | :----- | :------ | :----- | | **v0.1.0** |
{{createdAt}}
| Equipo de Arquitectura | — | Creación inicial | Scaffold T-DOC (ee-doc) | En Elaboración | --- ##
CC. Cierre Documental > **Aplicabilidad:** Obligatoria al completar la validación final de la
implementación (documento implementable). Se rellena al cierre del ciclo; permanece **pendiente**
durante Elaboración / Implementación (**D-04**: el scaffold no declara Congelado). ### CC.1.
Validación Final | Campo | Valor | | :---- | :---- | | **Fecha** | Pendiente | | **Evidencias** |
Pendiente (EE-IMP-XXX-PXX, EE-TEC-XXX, Quality Gates) | | **Responsable** | Equipo de Arquitectura |
### CC.2. Resultado de Quality Gates | Validación | Resultado | | :--------- | :-------: | | [Gate]
| Pendiente | ### CC.3. Dictamen de Cierre Pendiente de Validación Final. ### CC.4. Estado Final |
Campo | Valor | | :---- | :---- | | **Estado documental** | En Elaboración | | **Versión** | v0.1.0
| | **Congelación** | Pendiente | --- ## FIN DEL DOCUMENTO
```

### 05.3. ADR — `files/EE-ADR-XXX_Title.md.hbs` (EE-DOC-002 §18.2)

```handlebars
#
{{docId}}
—
{{title}}

Este documento registra la decisión arquitectónica correspondiente para el Engineering Ecosystem
conforme a los estándares **EE-DOC-002** y **EE-DOC-005**. --- ## METADATOS | Campo | Valor | |
:---- | :---- | | **ID** |
{{docId}}
| | **Documento** |
{{title}}
| | **Código corto** |
{{docId}}
| | **Fase** | — | | **Fase de implementación** | — | | **Tipo** | Architectural Decision Record | |
**Clasificación** | Arquitectura / Decisión Arquitectónica | | **Nivel** | Arquitectónico | |
**Normativo** | Sí | | **Versión** | v0.1.0 | | **Estado** | En Elaboración | | **Propietario** |
Equipo de Arquitectura | | **Documento padre** |
{{#if parentDoc}}{{parentDoc}}{{else}}—{{/if}}
| | **Dependencias** | EE-DOC-002, EE-DOC-005 | | **Decisión relacionada** | — | | **Aprobado por**
| — | | **Audiencia** | Arquitectura, Desarrollo, DevOps | | **Fecha de creación** |
{{createdAt}}
| | **Última revisión** |
{{createdAt}}
| | **Próxima revisión** | Pendiente | | **Prioridad** | — | --- ## 01. Propósito

{{#if purpose}}{{purpose}}{{else}}[Propósito específico de la decisión arquitectónica.]{{/if}}

--- ## 02. Contexto [Contexto técnico, tecnológico u operativo que motiva la decisión.] --- ## 03.
Problema Arquitectónico [Problema, ambigüedades o riesgos a resolver.] --- ## 04. Decisión
[Declaración explícita e ineludible de la decisión adoptada.] --- ## 05. Alcance ### 05.1. Incluye -
### 05.2. No incluye - --- ## 06. Justificación Arquitectónica [Sustento técnico, principios
evaluados y ventajas sobre otras opciones.] --- ## [Secciones variables específicas del ADR: 07 a
XX-1] [Taxonomías, matrices, modelos de ejecución, etc.] --- ## XX. Consecuencias ### XX.1.
Positivas - ### XX.2. Negativas / Riesgos - --- ## YY. Referencias | Código | Documento |
Descripción | | :----- | :-------- | :---------- | | **EE-DOC-001** | Master Documentation Index |
Índice maestro | | **EE-DOC-002** | Document Design Template | Plantilla ADR | | **EE-DOC-005** |
Development Workflow | Cambio gobernado | --- ## ZZ. Historial de Cambios | Versión | Fecha | Autor
| Aprobado por | Motivo | Cambios | Estado | | :------ | :---- | :---- | :----------- | :----- |
:------ | :----- | | **v0.1.0** |
{{createdAt}}
| Equipo de Arquitectura | — | Creación inicial | Scaffold T-DOC (ee-adr) | En Elaboración | --- ##
FIN DEL DOCUMENTO
```

### 05.4. IMP — `files/EE-IMP-XXX-PXX_Title.md.hbs` (EE-DOC-002 §18.3)

```handlebars
#
{{docId}}
—
{{title}}

Este documento registra la evidencia técnica de implementación de la fase correspondiente, conforme
a **EE-DOC-002 §18.3** y **EE-DOC-005**. --- ## METADATOS | Campo | Valor | | :---- | :---- | |
**ID** |
{{docId}}
| | **Documento** |
{{title}}
| | **Código corto** |
{{docId}}
| | **Fase** | — | | **Fase de implementación** | — | | **Tipo** | Documento Técnico de
Implementación | | **Clasificación** | Implementación | | **Nivel** | Técnico | | **Normativo** | No
| | **Versión** | v0.1.0 | | **Estado** | En Elaboración | | **Propietario** | Equipo de
Arquitectura | | **Documento padre** |
{{#if parentDoc}}{{parentDoc}}{{else}}—{{/if}}
| | **Dependencias** | EE-DOC-002, EE-DOC-005 | | **Aprobado por** | — | | **Audiencia** |
Arquitectura, Desarrollo, DevOps | | **Fecha de creación** |
{{createdAt}}
| | **Última revisión** |
{{createdAt}}
| | **Próxima revisión** | Pendiente | --- ## 01. Objetivo

{{#if purpose}}{{purpose}}{{else}}[Propósito de esta unidad de implementación.]{{/if}}

--- ## 02. Alcance Implementado - --- ## 03. Estructura Física Implementada [Árbol de directorios y
archivos físicos creados o modificados] --- ## 04. Modelo de Orquestación y Arquitectura de
Ejecución [Componentes involucrados y flujo de ejecución, si aplica.] ### 04.1. Repartición de
Responsabilidades | Componente | Responsabilidad | | :--------- | :-------------- | | | | --- ## 05.
Especificación Técnica de Artefactos | Artefacto | Descripción | | :-------- | :---------- | | | |
--- ## [Secciones variables de detalle técnico: 06 a XX-1] --- ## XX. Validaciones Ejecutadas ###
XX.1. Resultado de la Implementación y Estado de la Fase | Prueba | Resultado | Detalle | | :----- |
:-------- | :------ | | | ⬜ | | ### XX.2. Correcciones / Warnings Observados (Opcional) --- ## YY.
Trazabilidad ### YY.1. Conformidad | Requisito normativo | Evidencia | | :------------------ |
:-------- | | | | --- ## ZZ. Referencias | Código | Documento | Descripción | | :----- | :-------- |
:---------- | | **Documento padre** |
{{#if parentDoc}}{{parentDoc}}{{else}}—{{/if}}
| Norma implementada | | **EE-DOC-002** | Document Design Template | Plantilla IMP | |
**EE-DOC-005** | Development Workflow | Ciclo de implementación | --- ## AA. Historial de Cambios |
Versión | Fecha | Autor | Aprobado por | Motivo | Cambios | Estado | | :------ | :---- | :---- |
:----------- | :----- | :------ | :----- | | **v0.1.0** |
{{createdAt}}
| Equipo de Arquitectura | — | Creación inicial | Scaffold T-DOC (ee-imp) | En Elaboración | --- ##
FIN DEL DOCUMENTO
```

### 05.5. TEC — `files/EE-TEC-XXX_Title.md.hbs` (EE-DOC-002 §18.4)

```handlebars
#
{{docId}}
—
{{title}}

Este documento registra la documentación técnica consolidada (estado as-built) correspondiente a la
implementación de **{{parentDoc}}**, conforme a **EE-DOC-002 §18.4** y **EE-DOC-005**. --- ##
METADATOS | Campo | Valor | | :---- | :---- | | **ID** |
{{docId}}
| | **Documento** |
{{title}}
| | **Código corto** |
{{docId}}
| | **Tipo** | Documento Técnico | | **Clasificación** | Implementación | | **Nivel** | Técnico | |
**Normativo** | No | | **Versión** | v0.1.0 | | **Estado** | En Elaboración | | **Propietario** |
Equipo de Arquitectura | | **Documento padre** |
{{parentDoc}}
| | **Dependencias** |
{{parentDoc}}, EE-IMP (fases asociadas) | | **Aprobado por** | — | | **Audiencia** | Arquitectura,
Desarrollo, DevOps, IA | | **Fecha de creación** |
{{createdAt}}
| | **Última revisión** |
{{createdAt}}
| | **Próxima revisión** | Pendiente | --- ## 01. Propósito

{{#if purpose}}{{purpose}}{{else}}Consolidar el estado as-built de la implementación de
  {{parentDoc}}.{{/if}}

--- ## 02. Alcance ### 02.1. Cubierto - ### 02.2. No cubierto - --- ## 03. Resumen Ejecutivo del
Estado As-Built [Resumen del estado tras completar las fases IMP.] --- ## 04. Estructura Física
Consolidada [Árbol consolidado relevante] --- ## [Secciones variables por fase / dominio: 05 a XX-1]
### 05.1. Objetivo de la fase (resumen) ### 05.2. Artefactos implementados ### 05.3. Decisiones
técnicas relevantes ### 05.4. Validaciones ejecutadas --- ## XX. Decisiones Técnicas Consolidadas |
ID | Decisión | Referencia | | :- | :------- | :--------- | | | | | --- ## YY. Alineación con el
Documento Normativo Padre y Descubrimientos | Ítem | Estado | | :--- | :----- | | Conformidad con
{{parentDoc}}
| Pendiente | | Descubrimientos abiertos | — | --- ## ZZ. Referencias | Código | Documento |
Descripción | | :----- | :-------- | :---------- | | **{{parentDoc}}** | Documento normativo padre |
Norma implementada | | **EE-DOC-002** | Document Design Template | Plantilla TEC | | **EE-DOC-005**
| Development Workflow | Ciclo IMP → TEC → Congelación | --- ## AA. Historial de Cambios | Versión |
Fecha | Autor | Aprobado por | Motivo | Cambios | Estado | | :------ | :---- | :---- | :-----------
| :----- | :------ | :----- | | **v0.1.0** |
{{createdAt}}
| Equipo de Arquitectura | — | Creación inicial | Scaffold T-DOC (ee-tec) | En Elaboración | --- ##
FIN DEL DOCUMENTO
```

### 05.6. RFC — `files/EE-RFC-XXX_Title.md.hbs` (EE-DOC-002 §18.5)

```handlebars
#
{{docId}}
—
{{title}}

Este documento es una **Request for Comments (RFC)** conforme a **EE-DOC-005 — Development
Workflow** (clasificación **Tipo D — Cambio Significativo / Transversal**). No sustituye a los
documentos normativos; propone el cambio gobernado necesario para autorizarlos. --- ## METADATOS |
Campo | Valor | | :---- | :---- | | **ID** |
{{docId}}
| | **Title** |
{{title}}
| | **Código corto** |
{{docId}}
| | **Tipo** | Request for Comments (Cambio gobernado) | | **Clasificación EE-DOC-005** | **D —
Cambio Significativo / Transversal** | | **Estado** | Propuesto | | **Versión** | v0.1.0 | |
**Propietario** | Equipo de Arquitectura | | **Solicitante** |
{{#if solicitante}}{{solicitante}}{{else}}—{{/if}}
| | **Documentos normativos afectados** |
{{#if affectedDocs}}{{affectedDocs}}{{else}}—{{/if}}
| | **Documento de dominio** | — | | **ADR asociado** | — | | **Fecha de creación** |
{{createdAt}}
| | **Última revisión** |
{{createdAt}}
| | **Audiencia** | Arquitectura, Desarrollo, DevOps | | **Responsable de decisión** | Equipo de
Arquitectura (revisión y aprobación) | --- ## 01. Resumen ejecutivo [Qué se propone, en qué
documentos, y qué queda prohibido hasta la aprobación y sincronización.] --- ## 02. Motivación ###
02.1. Descubrimiento [Contexto y origen del hallazgo.] ### 02.2. Conflicto normativo actual | Fuente
| Estado | | :----- | :----- | | | | ### 02.3. Interpretación del cambio [Qué significa y qué **no**
significa este RFC.] ### 02.4. Límite de autoridad | Documento | Qué autoriza / norma este RFC | |
:-------- | :---------------------------- | | | | ### 02.5. Delimitación frente a alternativas de
ubicación o alcance | Elemento | Rol | Relación con la propuesta | | :------- | :-- |
:------------------------ | | | | | --- ## 03. Propuesta ### 03.1. Superficie A — {documento /
artefacto principal} | Sección afectada | Cambio | | :--------------- | :----- | | | | ### 03.2.
Superficie B — {p.ej. EE-DOC-001 u otro del mismo paquete} | Ítem | Cambio | | :--- | :----- | | | |
### 03.3. Lo que este RFC **no** cambia | Ítem | Tratamiento | | :--- | :---------- | | | | ###
03.4. Efectos técnicos de la materialización (si aplica; detalle en IMP) | Efecto | Acción | |
:----- | :----- | | | | --- ## 04. Alternativas consideradas | ID | Alternativa | Dictamen | Motivo
| | :- | :---------- | :------- | :----- | | **A** | | **Propuesta seleccionada** | | | **B** | |
**Rechazada** | | --- ## 05. Impacto | Ámbito | Impacto | | :----- | :------ | | **Documentos
normativos** | | | **Monorepo físico** | Ninguno hasta post-aprobación / IMP | | **CI / Quality
Gates** | | | **Otros** | | --- ## 06. ADR | Pregunta | Respuesta | | :------- | :-------- | | ¿Se
requiere ADR además de este RFC? | **Sí / No** | | Justificación | | --- ## 07. Criterios de
aceptación | # | Check medible | | :- | :------------ | | 1 | | | 2 | | | 3 | Versión e historial de
los documentos del paquete actualizados; sin discrepancia SSOT | | 4 | Este RFC en estado
**Aprobado**; tras aplicar diffs, **Implementado (documentación)** si aplica | --- ## 08. Plan de
aplicación (post-aprobación) | Orden | Acción | Responsable | | :---: | :----- | :---------- | | 1 |
Aprobar
{{docId}}
| Equipo de Arquitectura | | 2 | Parche normativo de documentos afectados | Arquitectura | | 3 |
Sincronización de EE-DOC-001 (si aplica) | Arquitectura | | 4 | Implementación física / IMP (si
aplica) | Implementación | --- ## 09. Riesgos y mitigaciones | Riesgo | Mitigación | | :----- |
:--------- | | | | --- ## 10. Referencias | Código | Rol | | :----- | :-- | | **EE-DOC-002** | §18.5
plantilla RFC | | **EE-DOC-005** | Tipo D; no desviación unilateral | | **EE-DOC-001** | SSOT del
índice | | **EE-RFC-001** | Precedente de procedimiento | --- ## 11. Resolución | Campo | Valor | |
:---- | :---- | | **Estado** | Propuesto | | **Responsable de decisión** | Equipo de Arquitectura |
| **Condición de materialización** | — | --- ## 12. Historial de Cambios | Versión | Fecha | Autor |
Motivo | Estado | | :------ | :---- | :---- | :----- | :----- | | **v0.1.0** |
{{createdAt}}
| Equipo de Arquitectura | Creación inicial | Propuesto | --- ## FIN DEL DOCUMENTO
```

## 06. README por carpeta de template

### 06.1. `ee-doc/README.md`

```markdown
# Template: ee-doc (T-DOC)

Scaffold for **EE-DOC-XXX** normative documents.

| Item                | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Category            | T-DOC                                                          |
| Norma               | EE-DOC-002 §18.1                                               |
| Default destination | `docs/architecture/`                                           |
| ID rule             | **D-01** — `docId` is an input; never assigned by the template |

## Files

- `template.json` — metadata contract
- `files/EE-DOC-XXX_Title.md.hbs` — document body (Handlebars)

## Generation

`pnpm run generate` (EE-DOC-011 / EE-IMP-012-P05). Until P05, this template is validated only by `validateTemplates()`.
```

### 06.2. `ee-adr/README.md`

```markdown
# Template: ee-adr (T-DOC)

Scaffold for **EE-ADR-XXX** Architecture Decision Records.

| Item                | Value                          |
| ------------------- | ------------------------------ |
| Category            | T-DOC                          |
| Norma               | EE-DOC-002 §18.2               |
| Default destination | `docs/adr/`                    |
| ID rule             | **D-01** — `docId` is an input |

## Files

- `template.json` — metadata contract
- `files/EE-ADR-XXX_Title.md.hbs` — ADR body (§18.2)

## Generation

`pnpm run generate` after EE-IMP-012-P05.
```

### 06.3. `ee-imp/README.md`

```markdown
# Template: ee-imp (T-DOC)

Scaffold for **EE-IMP-XXX-PXX** implementation units.

| Item                | Value                               |
| ------------------- | ----------------------------------- |
| Category            | T-DOC                               |
| Norma               | EE-DOC-002 §18.3                    |
| Default destination | `docs/developer/`                   |
| ID rule             | **D-01** — pattern `EE-IMP-NNN-PNN` |

## Files

- `template.json` — metadata contract
- `files/EE-IMP-XXX-PXX_Title.md.hbs` — IMP body (§18.3)

## Generation

`pnpm run generate` after EE-IMP-012-P05.
```

### 06.4. `ee-tec/README.md`

```markdown
# Template: ee-tec (T-DOC)

Scaffold for **EE-TEC-XXX** consolidated technical documentation.

| Item                | Value                    |
| ------------------- | ------------------------ |
| Category            | T-DOC                    |
| Norma               | EE-DOC-002 §18.4         |
| Default destination | `docs/architecture/`     |
| Required input      | `parentDoc` (EE-DOC-XXX) |
| ID rule             | **D-01**                 |

## Files

- `template.json` — metadata contract
- `files/EE-TEC-XXX_Title.md.hbs` — TEC body (§18.4)

## Generation

`pnpm run generate` after EE-IMP-012-P05.
```

---

### 06.5. `ee-rfc/README.md`

```markdown
# Template: ee-rfc (T-DOC)

Scaffold for **EE-RFC-XXX** Request for Comments (governed change Tipo D).

| Item                | Value                          |
| ------------------- | ------------------------------ |
| Category            | T-DOC                          |
| Norma               | EE-DOC-002 §18.5               |
| Default destination | `docs/rfc/`                    |
| Title language      | English (document name)        |
| Body language       | Spanish (governance sections)  |
| ID rule             | **D-01** — `docId` is an input |
| Precedents          | EE-RFC-001, EE-RFC-002         |

## Files

- `template.json` — metadata contract
- `files/EE-RFC-XXX_Title.md.hbs` — RFC body (§18.5)

## Generation

`pnpm run generate` after EE-IMP-012-P05. Does **not** apply the governed change — only scaffolds the RFC document.
```

## 07. Procedimiento operador

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

foreach ($t in @("ee-doc","ee-adr","ee-imp","ee-tec","ee-rfc")) {
  New-Item -ItemType Directory -Force -Path "templates\document\$t\files" | Out-Null
}
Remove-Item -Force templates\document\.gitkeep -ErrorAction SilentlyContinue

# Escribir template.json, README.md y files/EE-*-XXX_Title.md.hbs según §04–§06
# Rutas absolutas desde la raíz del monorepo, p.ej.:
#   templates\document\ee-doc\template.json
#   templates\document\ee-doc\README.md
#   templates\document\ee-doc\files\EE-DOC-XXX_Title.md.hbs

pnpm run format
pnpm run validate
```

**Esperado:** PASS con cuatro `template.json` bajo `document/` (category T-DOC).

```powershell
git add templates/document
git commit -m "feat(templates): add T-DOC scaffolds incl. ee-rfc (EE-IMP-012-P03)

- bodies aligned to EE-DOC-002 §18.1–18.4
- destinations: architecture, adr, developer
- README per template; RFC deferred

Refs: EE-DOC-012, EE-DOC-002, EE-IMP-012-P03"
git push origin main
```

---

## 08. Criterios de aceptación

| #   | Criterio                                                             | Estado |
| :-- | :------------------------------------------------------------------- | :----- |
| 1   | **5** templates (doc/adr/imp/tec/**rfc**) con `template.json` válido | ✅     |
| 2   | `category: T-DOC` y directorio `document/`                           | ✅     |
| 3   | ids únicos: ee-doc, ee-adr, ee-imp, ee-tec, **ee-rfc**               | ✅     |
| 4   | `allowedTargets` solo `docs/`                                        | ✅     |
| 5   | Cuerpos `.hbs` alineados a §18.1–18.4 (DOC con XX+CC)                | ✅     |
| 5b  | Nombres propios `.hbs` (no `body.md.hbs`)                            | ✅     |
| 6   | README en cada carpeta de template                                   | ✅     |
| 7   | Destinos alineados a `docs/architecture \| adr \| developer`         | ✅     |
| 8   | RFC T-DOC materializado (`ee-rfc`, §18.5)                            | ✅     |
| 9   | `pnpm run validate` PASS                                             | ✅     |

---

## 09. Descubrimientos

| ID        | Descripción                                    | Resultado                                           |
| :-------- | :--------------------------------------------- | :-------------------------------------------------- |
| D-P03-001 | `docs/rfc/` + template `ee-rfc`                | **Adoptado** — EE-DOC-002 §18.5 / EE-DOC-012 v0.5.0 |
| D-P03-002 | EE-TEC y EE-DOC comparten `docs/architecture/` | **Aceptado** — as-built monorepo                    |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Motivo                                                                                         | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------------------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-10-01 | Equipo de Arquitectura | Apertura P03                                                                                   | Borrador       |
| **v1.1.0** | 2026-10-01 | Equipo de Arquitectura | Completar § hbs ADR/IMP/TEC, README, mapa docs/                                                | Borrador       |
| **v1.2.0** | 2026-10-01 | Equipo de Arquitectura | Alineación EE-DOC-002 §18 (CC/XX DOC); nombres propios `.hbs`; ADR/IMP/TEC §18                 | Borrador       |
| **v1.3.0** | 2026-10-01 | Equipo de Arquitectura | Incorporar ee-rfc (EE-DOC-002 §18.5 / DOC-012 v0.5.0)                                          | Borrador       |
| **v1.4.0** | 2026-10-01 | Equipo de Arquitectura | Cierre: 5 T-DOC en main (`2e651cd`), rename `EE-IMP-XXX-PXX_Title.md.hbs` (`4ee51cf`), CI PASS | **Completado** |

---

## FIN DEL DOCUMENTO
