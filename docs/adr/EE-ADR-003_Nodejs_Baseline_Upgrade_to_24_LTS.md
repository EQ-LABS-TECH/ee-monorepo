# EE-ADR-003 — Node.js Baseline Upgrade to 24 LTS

Este documento registra la decisión arquitectónica correspondiente para el Engineering Ecosystem conforme a los estándares **EE-DOC-002** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                          |
| :------------------------- | :------------------------------------------------------------- |
| **ID**                     | EE-ADR-003                                                     |
| **Documento**              | Node.js Baseline Upgrade to 24 LTS                             |
| **Código corto**           | ADR-003                                                        |
| **Fase**                   | Fase Global del Ecosistema                                     |
| **Fase de implementación** | Runtime baseline (EE-DOC-006 / EE-IMP-007-P05)                 |
| **Tipo**                   | Architectural Decision Record                                  |
| **Clasificación**          | Arquitectura / Decisión Arquitectónica                         |
| **Nivel**                  | Arquitectónico                                                 |
| **Normativo**              | Sí                                                             |
| **Versión**                | v1.1.0                                                         |
| **Estado**                 | Aprobado                                                       |
| **Propietario**            | Equipo de Arquitectura                                         |
| **Documento padre**        | EE-DOC-006 — Repository Structure                              |
| **Dependencias**           | EE-DOC-004; EE-DOC-005; EE-DOC-006; EE-DOC-007; EE-IMP-007-P05 |
| **Decisión relacionada**   | EE-ADR-001 — Workspace Task Orchestration Strategy             |
| **Aprobado por**           | Equipo de Arquitectura                                         |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                               |
| **Fecha de creación**      | 2026-09-23                                                     |
| **Última revisión**        | 2026-10-02                                                     |
| **Próxima revisión**       | Ante cambio de LTS Active de Node.js                           |
| **Prioridad**              | Alta                                                           |

---

## 01. Propósito

Fijar el **baseline de runtime Node.js** del monorepo `ee-monorepo` en **Node.js 24 LTS**, sustituyendo el rango previo `≥ 22.19.0 < 23`, con horizonte de soporte alineado a la puesta en producción planificada (~junio 2027).

---

## 02. Contexto

El Engineering Ecosystem (`ee-monorepo`) definía como baseline de runtime:

```text
Node.js ≥ 22.19.0 < 23
```

materializado en `.nvmrc` (`22`) y en convenciones de proyecto.

En septiembre 2026 el estado oficial de Node.js es:

| Versión           | Estado              | Notas                                          |
| :---------------- | :------------------ | :--------------------------------------------- |
| **v26**           | Current             | No adecuada como baseline de producción        |
| **v24** (Krypton) | **LTS Active**      | Baseline LTS recomendada para nuevos proyectos |
| **v22** (Jod)     | **LTS Maintenance** | Soporte de mantenimiento hasta ~abril 2027     |
| **v20**           | EOL                 | No usar                                        |

El monorepo está en **fase inicial** (gobernanza GitHub P01–P05 en curso; implementación de paquetes temprana). La puesta en producción está planificada para **junio 2027**, momento en el cual Node 22 habrá salido o estará fuera de la ventana de Maintenance LTS.

Además, GitHub Actions deprecó el runtime Node 20 de las actions en los runners (septiembre 2025+). Eso se resolvió actualizando majors de actions (`checkout@v5`, `setup-node@v5`); **no** obliga por sí solo a cambiar el baseline del proyecto, pero sí evidenció la necesidad de alinear el runtime del ecosistema con una LTS con horizonte suficiente hasta producción y más allá.

---

## 03. Problema Arquitectónico

¿Debe el Engineering Ecosystem **mantener Node 22** hasta cerca de producción y migrar después, o **adoptar Node 24 LTS ahora**, mientras el coste de cambio es mínimo?

---

## 04. Decisión

**Se adopta Node.js 24 LTS (línea Krypton) como baseline de runtime del Engineering Ecosystem** para el monorepo `ee-monorepo` y artefactos asociados.

### 04.1. Constraint normativa de runtime

```text
Node.js ≥ 24.0.0 < 25
```

Pin operativo recomendado:

| Artefacto                        | Valor                                           |
| :------------------------------- | :---------------------------------------------- |
| `.nvmrc`                         | `24`                                            |
| `engines.node` (raíz y paquetes) | `>=24 <25`                                      |
| CI `setup-node`                  | `node-version-file: ".nvmrc"` (+ `cache: pnpm`) |

No se adopta Node 26 como baseline.

---

## 05. Alcance

### 05.1. Incluye

- Runtime de desarrollo local (`.nvmrc`).
- `engines` en `package.json` de la raíz y workspaces que declaren engines.
- GitHub Actions que instalen Node para jobs del monorepo.
- Documentación de proyecto / convenciones que citen el rango `≥ 22.19 < 23`.

### 05.2. No incluye

- Cambiar la política de **actions** de terceros más allá de lo ya hecho en P05 (salvo incompatibilidades futuras).
- Reescribir EE-DOC congelados salvo que citen explícitamente el rango 22; en ese caso, sincronización documental gobernada (paridad con este ADR).

---

## 06. Justificación Arquitectónica

### Opciones consideradas

#### Opción A — Mantener Node 22 hasta 2027

**Pros:** sin cambio inmediato; sigue siendo LTS Maintenance válida a la fecha de la decisión.  
**Contras:** migración obligatoria cerca de abril 2027; coste alto si el monorepo ya está estabilizado; baseline en Maintenance mientras existe LTS Active (24).

#### Opción B — Adoptar Node 24 LTS ahora (**elegida**)

**Pros:** LTS Active; soporte hasta ~abril 2028; coste mínimo en bootstrap; una sola oleada `.nvmrc` / engines / CI.  
**Contras:** cambio formal de política; posible ajuste menor de toolchains (poco probable en bootstrap).

#### Opción C — Adoptar Node 26 Current

**Pros:** últimas features.  
**Contras:** no es LTS; mayor churn. **Descartada.**

La Opción B maximiza alineación LTS Active y minimiza riesgo de migración forzada en go-live.

---

## 07. Plan de materialización

Orden (misma PR o PR encadenados):

1. Actualizar `.nvmrc` → `24`.
2. Actualizar `engines.node` en `package.json` raíz (y workspaces que lo declaren) → `>=24 <25`.
3. Asegurar en `.github/workflows/ci.yml`:

   ```yaml
   - uses: actions/setup-node@v5
     with:
       node-version-file: '.nvmrc'
       cache: 'pnpm'
   ```

4. Ejecutar localmente: `pnpm install` → `pnpm run lint` → `typecheck` → `test` → `validate`.
5. Integrar vía PR a `main` (ruleset P03) y verificar run CI en verde.
6. Registrar cumplimiento en historial de EE-IMP-007-P05 o nota técnica breve (referencia a este ADR).

**Estado de materialización:** Completada 2026-09-23 — `.nvmrc` 24, engines, CI; commit `52c420a`; CI success ~43s.

---

## 08. Consecuencias

### 08.1. Positivas

- Baseline LTS Active alineada con el calendario de producto (producción ~junio 2027).
- Evita una migración forzada en ventana de go-live.
- Homogeneiza local / CI / documentación de runtime.

### 08.2. Negativas / Riesgos

| Riesgo                                          | Mitigación                                               |
| :---------------------------------------------- | :------------------------------------------------------- |
| Rotura de scripts o deps con engines `node: 22` | Actualizar engines; `pnpm install` + `pnpm run validate` |
| CI sin `.nvmrc` efectivo                        | Obligar `node-version-file: ".nvmrc"` en `setup-node@v5` |
| Confusión 22 vs 24 en docs                      | Este ADR + actualización de convenciones de proyecto     |
| Desarrolladores en Node 22 local                | `nvm use 24` / reinstalar toolchain                      |

---

## 09. Estado de la decisión

**Aprobado** — 2026-09-23 · Equipo de Arquitectura.  
**Implementación:** Completada 2026-09-23.

(Estado documental unificado a **Aprobado**; equivalía al rótulo previo “Aceptado”.)

---

## 10. Referencias

| Código             | Documento                | Descripción                         |
| :----------------- | :----------------------- | :---------------------------------- |
| **EE-DOC-002**     | Document Design Template | Plantilla §18.2 ADR                 |
| **EE-DOC-004**     | Engineering Architecture | Runtime del ecosistema              |
| **EE-DOC-005**     | Development Workflow     | Asume runtime del proyecto          |
| **EE-DOC-006**     | Repository Structure     | `.nvmrc` en raíz                    |
| **EE-DOC-007**     | GitHub Governance        | CI / Actions                        |
| **EE-IMP-007-P05** | CI platform              | `setup-node` + `.nvmrc`             |
| **EE-ADR-001**     | Task Orchestration       | Turbo sobre el runtime del monorepo |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                | Cambios                                                                                  | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :-------------------- | :--------------------------------------------------------------------------------------- | :----------- |
| **v1.0.0** | 2026-09-23 | Equipo de Arquitectura | Equipo de Arquitectura | Decisión baseline     | Node 24 LTS como runtime                                                                 | Aprobado     |
| **v1.0.1** | 2026-09-23 | Equipo de Arquitectura | Equipo de Arquitectura | Materialización       | `.nvmrc`/engines/CI en main (`52c420a`); CI ✓                                            | Aprobado     |
| **v1.1.0** | 2026-10-02 | Equipo de Arquitectura | Equipo de Arquitectura | Higiene DOC-002 §18.2 | Metadatos completos; Propósito/Alcance/Justificación/Referencias; sin cambio de decisión | **Aprobado** |

---

## FIN DEL DOCUMENTO
