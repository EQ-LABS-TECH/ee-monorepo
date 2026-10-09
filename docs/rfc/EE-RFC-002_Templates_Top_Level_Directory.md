# EE-RFC-002 — Incorporation of `templates/` into the Top-Level Repository Tree and Index Synchronization

Este documento es una **Request for Comments (RFC)** conforme a **EE-DOC-005 — Development Workflow** (clasificación **Tipo D — Cambio Significativo / Transversal**). No sustituye a los documentos normativos; propone el cambio gobernado necesario para autorizarlos. Sigue el precedente de procedimiento de **EE-RFC-001**.

---

## METADATOS

| Campo                               | Valor                                                                                                               |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **ID**                              | EE-RFC-002                                                                                                          |
| **Title**                           | Incorporation of `templates/` into the Top-Level Repository Tree and Index Synchronization                          |
| **Código corto**                    | EE-RFC-002                                                                                                          |
| **Tipo**                            | Request for Comments (Cambio gobernado)                                                                             |
| **Clasificación EE-DOC-005**        | **D — Cambio Significativo / Transversal**                                                                          |
| **Estado**                          | Aprobado                                                                                                            |
| **Versión**                         | v1.1.0                                                                                                              |
| **Propietario**                     | Equipo de Arquitectura                                                                                              |
| **Solicitante**                     | EE-DOC-012 — Templates (elaboración)                                                                                |
| **Documentos normativos afectados** | **EE-DOC-006** (v1.4.0 → v1.5.0) y **EE-DOC-001** (v2.8.0 → v2.9.0) — **único paquete de sincronización normativa** |
| **Documento de dominio**            | EE-DOC-012 — Templates v0.4.0                                                                                       |
| **ADR asociado**                    | No requerido para la ubicación (ver §06)                                                                            |
| **Fecha de creación**               | 2026-10-01                                                                                                          |
| **Última revisión**                 | 2026-10-01                                                                                                          |
| **Audiencia**                       | Arquitectura, Desarrollo, DevOps                                                                                    |
| **Responsable de decisión**         | Equipo de Arquitectura (revisión y aprobación)                                                                      |

---

## 01. Resumen ejecutivo

Se propone un **único cambio gobernado** que, de forma inseparable:

1. Amplía el árbol de primer nivel de **EE-DOC-006** con el directorio canónico **`templates/`**, registrando únicamente su **existencia y categoría** (sin subárbol obligatorio), y delimita su relación con `assets/templates/` y `marketplace/templates/`.
2. Sincroniza **EE-DOC-001** en el **mismo paquete** (registro del artefacto, referencia al RFC y puesta al día de estados). Esta sincronización se ejecuta **en último lugar** del plan (§08, paso 6), pero se publica **concurrentemente** con la de 006.

Hasta que ambas superficies estén aprobadas y sincronizadas, **no existe autorización para materializar `templates/`** en el monorepo.

---

## 02. Motivación

### 02.1. Descubrimiento

Durante la revisión arquitectónica de **EE-DOC-012 — Templates** (2026-10-01) se detectó que:

- EE-DOC-012 (§05.3) establece `templates/` como fuente única de templates;
- EE-DOC-001 (§06) ya declara `templates/` como artefacto de EE-DOC-012;
- EE-DOC-006 v1.4.0 (Congelado) **no** contiene `templates/` en su árbol de primer nivel.

### 02.2. Conflicto normativo actual

| Fuente                           | Estado                                                                                                |
| :------------------------------- | :---------------------------------------------------------------------------------------------------- |
| EE-DOC-006 v1.4.0 (Congelado)    | §05 autoriza solo `assets/templates/` y `marketplace/templates/`; ningún `templates/` de primer nivel |
| EE-DOC-001 v2.7.0                | Declara `templates/` como artefacto de EE-DOC-012 (discrepancia con 006)                              |
| EE-DOC-012 v0.3.0                | Exige `templates/`; no puede materializarlo sin autorización estructural                              |
| `scripts/validate` (QG-ARCH-001) | `allowedTopLevel` no incluye `templates`: crear el directorio hoy **hace fallar** `pnpm run validate` |

Crear `templates/` ahora constituiría una **desviación silenciosa** respecto del árbol congelado de EE-DOC-006, prohibida por la **Regla de no desviación unilateral** de EE-DOC-005 §04 y por EE-DOC-001 R2 (_ningún documento congelado puede modificarse sin un RFC aprobado_). Aunque EE-DOC-001 prevalece ante discrepancias (§03), la autoridad sobre el **árbol físico** es EE-DOC-006; la discrepancia debe resolverse por el mismo cauce que **EE-RFC-001** (RFC Tipo D, paquete 006 + 001). Ese RFC es precedente de **procedimiento**, no de autorización: no cubre `templates/`.

### 02.3. Interpretación del cambio

Este RFC **no** traslada a Repository Structure la semántica de templates. **Completa la frontera física** del dominio que EE-DOC-006 ya delega en otros documentos (EE-DOC-011 la automatización; EE-DOC-012 el contrato de templates).

### 02.4. Límite de autoridad

| Documento      | Qué autoriza / norma                                                                                           |
| :------------- | :------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-006** | **Existencia** de `templates/` y su **categoría** en el mapa de primer nivel                                   |
| **EE-DOC-012** | Significado, estructura interna, contrato de metadata e inputs, categorías, validación de artefactos generados |
| **EE-DOC-011** | Mecanismo de generación (`pnpm run generate`), engine y su registro                                            |
| **EE-DOC-001** | Registro SSOT del artefacto y del estado documental                                                            |

### 02.5. Delimitación frente a directorios existentes

| Directorio               | Rol                                                                        | Relación con `templates/`                                           |
| :----------------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| **`templates/`** (nuevo) | Templates **generativos**: metadata versionada, inputs, outputs, ownership | SSOT de scaffolding                                                 |
| `assets/templates/`      | Recurso estático compartido (EE-DOC-006 §14)                               | **No** debe duplicar templates generativos; se aclara en 006 v1.5.0 |
| `marketplace/templates/` | Extensibilidad / distribución                                              | Fuera del alcance de la SSOT de scaffolding de EE-LABS              |
| `scripts/`               | Entry points de automatización (EE-DOC-011)                                | No aloja templates; puede alojar el registro del engine             |

El inventario as-built (`Paquetes_Archivos_Monorepo.md`) no registra contenido en `assets/templates/`; el inventario definitivo corresponde a **EE-IMP-012-P01**.

---

## 03. Propuesta

### 03.1. Superficie A — EE-DOC-006 (nivel estructural) → v1.5.0

**Alcance de 006:** registrar únicamente el **nivel estructural autorizado**.

| Sección de 006        | Cambio                                                                                                                                                             |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §04 (diagrama y nota) | Añadir `templates/` al grupo **Soporte** (`scripts/`, `docs/`, `assets/`, `templates/`)                                                                            |
| §05 (árbol)           | Añadir `templates/  # Templates generativos (EE-DOC-012 / EE-RFC-002)`                                                                                             |
| §05 (notas)           | Nota de frontera: 006 autoriza existencia y categoría; EE-DOC-012 define semántica; materialización → **EE-IMP-012**, no la implementación histórica de EE-DOC-006 |
| §14                   | Aclarar `assets/templates/`: recursos estáticos; **no** duplica `templates/`                                                                                       |
| §19 / §20             | Historial v1.5.0; cierre sin invalidar la Validación Final previa para el alcance anterior                                                                         |

| Elemento     | Qué fija 006                           | Qué **no** fija (pertenece a 012 / 011 / IMP)                |
| :----------- | :------------------------------------- | :----------------------------------------------------------- |
| `templates/` | Existencia y categoría de primer nivel | Estructura interna, `template.json`, categorías de templates |
| Subárbol     | **Ninguno obligatorio**                | Layout `templates/<categoría>/<nombre>/` (EE-DOC-012 §06)    |

### 03.2. Superficie B — EE-DOC-001 (índice SSOT) → v2.9.0 — mismo paquete

| Ítem                    | Cambio                                                     |
| :---------------------- | :--------------------------------------------------------- |
| Artefacto de EE-DOC-012 | Se mantiene `templates/`; se añade referencia a EE-RFC-002 |
| Matriz §09 / §13        | Sincronización de estados (ver §08, paso 6)                |
| Historial               | Entrada v2.8.0                                             |

**Contenido de la sincronización de estados (ejecutada en último lugar):**

- EE-DOC-011: ya **Congelado** v1.1.0 + EE-TEC-006 (cerrado en 001 v2.8.0); sin cambio adicional requerido por este RFC.
- EE-DOC-012: **Aprobado** v0.4.0; documentación técnica prevista **EE-TEC-007** (post IMP).
- EE-RFC-002: **Aprobado** / **Implementado (documentación)** tras aplicar 006+001.
- Métricas §13 y nota de estado actual (próximo foco: implementación IMP-012).

### 03.3. Lo que este RFC **no** cambia

| Ítem                                          | Tratamiento                                                                                     |
| :-------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `assets/templates/`, `marketplace/templates/` | Permanecen; solo se aclara su rol                                                               |
| Archivos de configuración en la raíz          | Sin cambio (006 §05 nota de raíz)                                                               |
| `pnpm-workspace.yaml`                         | `templates/` **no** es workspace                                                                |
| EE-DOC-007 / CODEOWNERS                       | Sin cambio normativo; la entrada de ownership es impacto de la materialización (EE-IMP-012-P02) |
| EE-DOC-010 (Congelado)                        | Sin cambio; no se crea Quality Gate nuevo                                                       |
| Mecanismo de generación y registro del engine | Dominio de EE-DOC-011                                                                           |
| Materialización en git                        | **Prohibida** hasta aprobación + sincronización documental 006 **y** 001 + EE-DOC-012 Aprobado  |

### 03.4. Efectos técnicos de la materialización (no forman parte del RFC; EE-IMP-012-P02)

| Efecto      | Acción                                                                                         |
| :---------- | :--------------------------------------------------------------------------------------------- |
| QG-ARCH-001 | Añadir `templates` a `allowedTopLevel` en `scripts/validate` (Type B)                          |
| Ownership   | Añadir patrón `templates/` a `.github/CODEOWNERS` (architecture + maintainers)                 |
| Prettier    | Añadir `templates/**/files/**` a `.prettierignore` de la raíz (los `.hbs` no son formateables) |
| Workspaces  | No añadir `templates/` a `pnpm-workspace.yaml`                                                 |

---

## 04. Alternativas consideradas

| ID    | Alternativa                                             | Dictamen                   | Motivo                                                                                                                                                                                                       |
| :---- | :------------------------------------------------------ | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | `templates/` de primer nivel + RFC coordinado 006 + 001 | **Propuesta seleccionada** | Alineada con 001 (ya declara `templates/`), 012 y la separación scaffolding ≠ recurso estático; cambio mínimo en 006; mismo procedimiento que EE-RFC-001                                                     |
| **B** | Reutilizar `assets/templates/`                          | **Rechazada**              | `assets/` es recurso estático; mezcla scaffolding versionado con recursos; 006 §14 ya le asigna "plantillas de documentos, ADR, RFC" (riesgo de doble SSOT); exige igualmente modificar 001 y reescribir 012 |
| **C** | `marketplace/templates/`                                | **Rechazada**              | Dominio de extensibilidad/distribución, no SSOT interna de EE-LABS                                                                                                                                           |
| **D** | Bajo `scripts/` o `packages/`                           | **Rechazada**              | `scripts/` son entry points (011); `packages/` son workspaces con matriz de capas (006 §13)                                                                                                                  |
| **E** | Modificar 006 por versión menor sin RFC                 | **Rechazada**              | Contradice EE-DOC-005 §04 y EE-DOC-001 R2                                                                                                                                                                    |
| **F** | Actualizar 006 y "luego" 001 de forma informal          | **Rechazada**              | Viola SSOT de 001; deja discrepancia vigente; no es un único cambio gobernado                                                                                                                                |

---

## 05. Impacto

| Ámbito              | Impacto                                               |
| :------------------ | :---------------------------------------------------- |
| **EE-DOC-006**      | Cambio mínimo de árbol y aclaración de §14            |
| **EE-DOC-001**      | Sincronización de artefacto y estados (mismo paquete) |
| **EE-DOC-012**      | Desbloquea P02; prerrequisito de materialización      |
| **EE-DOC-011**      | Sin cambio normativo                                  |
| **Monorepo físico** | Ninguno hasta post-aprobación; luego EE-IMP-012-P02   |
| **CI (`Validate`)** | Sin cambio obligatorio por este RFC                   |

---

## 06. ADR

| Pregunta                        | Respuesta                                                                         |
| :------------------------------ | :-------------------------------------------------------------------------------- |
| ¿ADR para adoptar `templates/`? | **No.** Decisión de estructura/frontera, no de vendor ni de modelo de scaffolding |
| ¿Cuándo sí?                     | Si se cambia el modelo de scaffolding (EE-DOC-011 §07)                            |

---

## 07. Criterios de aceptación

Aplicado en el plano documental cuando se cumplen **todos**:

| #   | Check medible                                                                             |
| :-- | :---------------------------------------------------------------------------------------- |
| 1   | **EE-DOC-006 §04/§05** incluye `templates/` en el árbol y en el grupo Soporte             |
| 2   | **EE-DOC-006 §14** aclara que `assets/templates/` no duplica `templates/`                 |
| 3   | **EE-DOC-006** no impone subárbol obligatorio bajo `templates/`                           |
| 4   | **EE-DOC-001** declara `templates/` y referencia EE-RFC-002                               |
| 5   | Versión e historial de **001** y **006** actualizados; sin discrepancia SSOT              |
| 6   | Sincronización de estados de 001 (§03.2) completada                                       |
| 7   | Este RFC en estado **Aprobado**; tras aplicar los diffs, **Implementado (documentación)** |

La materialización física **no** es criterio de este RFC (corresponde a EE-IMP-012-P02, tras EE-DOC-012 Aprobado).

---

## 08. Plan de aplicación (post-aprobación)

| Orden | Acción                                                                                                              | Responsable            |
| :---: | :------------------------------------------------------------------------------------------------------------------ | :--------------------- |
|   1   | Aprobar EE-RFC-002                                                                                                  | Equipo de Arquitectura |
|   2   | Parche normativo **EE-DOC-006 v1.5.0**                                                                              | Arquitectura           |
|   3   | Revisión arquitectónica y aprobación de **EE-DOC-012**                                                              | Arquitectura           |
|   4   | Verificar coherencia 006 ↔ 012 ↔ RFC                                                                              | Arquitectura           |
|   5   | Preparar (sin publicar) el parche de **EE-DOC-001 v2.9.0** (artefacto + referencia RFC + 012 Aprobado)              | Arquitectura           |
|   6   | **Sincronización de estados de 001 (§03.2) — última acción**; publicar 006 v1.5.0 y 001 v2.9.0 **concurrentemente** | Arquitectura           |
|   7   | EE-IMP-012-P01…P02 (scaffold físico de `templates/`)                                                                | Implementación         |

Los pasos 2 y 6 **no** se declaran vigentes de forma independiente.

---

## 09. Riesgos y mitigaciones

| Riesgo                                  | Mitigación                                          |
| :-------------------------------------- | :-------------------------------------------------- |
| Crear `templates/` antes de sincronizar | QG-ARCH-001 falla por diseño; §03.3                 |
| Doble SSOT con `assets/templates/`      | Aclaración en 006 §14; inventario en EE-IMP-012-P01 |
| 006 absorbe semántica de 012            | §02.4 y §03.1: 006 = existencia y categoría         |
| Prettier/linters sobre `.hbs`           | §03.4; EE-IMP-012-P02                               |
| Sincronización de 001 incompleta        | Criterios 5–6 de §07                                |

---

## 10. Referencias

| Código                | Rol                                    |
| :-------------------- | :------------------------------------- |
| **EE-DOC-005**        | Tipo D; §04 no desviación unilateral   |
| **EE-DOC-006**        | §04/§05/§14; árbol congelado           |
| **EE-DOC-001**        | SSOT del índice; R2, R10               |
| **EE-DOC-012** v0.3.0 | Dominio; §05                           |
| **EE-DOC-011**        | Mecanismo de generación                |
| **EE-RFC-001**        | Precedente de procedimiento (`infra/`) |

---

## 11. Resolución

| Campo                                   | Valor                                                                                     |
| :-------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Estado**                              | **Aprobado** (2026-10-01) → **Implementado (documentación)** tras 006 v1.5.0 + 001 v2.9.0 |
| **Responsable de decisión**             | Equipo de Arquitectura                                                                    |
| **Condición de materialización física** | EE-RFC-002 Aprobado + 006 v1.5.0 + 001 v2.9.0 + EE-DOC-012 Aprobado → **EE-IMP-012-P02**  |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                                   | Motivo                                                                                                               | Estado       |
| :--------- | :--------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :----------- |
| **v1.0.0** | 2026-10-01 | IA Asistente (propuesta) / Arquitectura | Propuesta inicial RFC coordinado `templates/`                                                                        | Propuesto    |
| **v1.0.1** | 2026-10-01 | IA Asistente (propuesta) / Arquitectura | Precisión del mecanismo de exclusión Prettier; referencia a EE-DOC-012 v0.3.1                                        | Propuesto    |
| **v1.0.2** | 2026-10-01 | IA Asistente (propuesta) / Arquitectura | Referencia a EE-DOC-012 v0.3.2 (sin cambio de alcance)                                                               | Propuesto    |
| **v1.1.0** | 2026-10-01 | Equipo de Arquitectura                  | Aprobación; versiones 001→v2.9.0 (v2.8.0 ya cerró 011); TEC-006 ya aplicado; resolución Implementado (documentación) | **Aprobado** |

---

## FIN DEL DOCUMENTO
