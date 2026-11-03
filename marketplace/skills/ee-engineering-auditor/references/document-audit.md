# Auditoría documental formal (procedimiento heredado)

Aplicar únicamente en modo `document` o cuando una auditoría combinada incluya explícitamente un documento normativo. Consultar EE-DOC-002 y EE-AUDIT-Criteria vigentes; los resúmenes aquí son operativos y se subordinan al texto de `main`.

## Pasos 1 a 9

### Paso 1 — Clasificación del documento

De los metadatos, extrae: `Tipo`, `Clasificación`, `Nivel`, `Normativo`, `ID`.

Determina además:

- **¿Fundacional o implementable?** Fundacional = EE-DOC-001 a EE-DOC-005. Implementable = EE-DOC-006 en adelante.
- **Plantilla esperada**, según EE-DOC-002 §18:
  - `EE-DOC-XXX` → §18.1
  - `EE-ADR-XXX` → §18.2
  - `EE-IMP-XXX-PXX` → §18.3
  - `EE-TEC-XXX` → §18.4
  - `EE-RFC-XXX` → §18.5
  - `EE-VAL-* / EE-WAIVE-*` → §18.6

Si el Tipo no mapea a ninguna plantilla → **Bloqueante**.
Si el Tipo declarado no coincide con la plantilla aplicada → **Crítico**.

### Paso 2 — Validación de metadatos (EE-DOC-002 §05 + §18)

Contrasta campo por campo:

- Faltantes, sobrantes, valores inválidos.
- Inmutables alterados: `ID`, `Código corto`, `Fecha de creación`.
- Coherencia del código corto derivado del ID sin el prefijo `EE-` (p. ej. `EE-DOC-002` → `DOC-002`), conforme al EE-DOC-002 vigente.
- Coherencia de `Estado` con el ciclo de vida (§13).

### Paso 3 — Validación estructural (EE-DOC-002 §03/§04 + §18)

- Secciones obligatorias presentes y en orden.
- Numeración continua (§06). Títulos H2/H3/H4 correctos (§07).
- Para **EE-DOC implementables**: exige la cola XX/YY/ZZ/AA/BB/CC.
- Para **EE-DOC fundacionales (001–005)**: XX y CC pueden omitirse; el resto se adapta.
- Para ADR/RFC/IMP/TEC: la estructura mínima de su §18 correspondiente.

### Paso 4 — Cumplimiento del checklist (EE-DOC-002 §19)

Recorre `references/doc-002-checklist.md` completo. Marca ✅ / ❌ / N/A por ítem.

### Paso 5 — Contraste contra EE-DOC-001 (SSOT)

- ¿El documento aparece en §06 (Estructura Documental)?
- ¿El estado coincide con §09 (Matriz de Trazabilidad)?
- Si es ADR: ¿está en §09.1?
- ¿Las dependencias declaradas existen en §06?
- ¿Las versiones citadas coinciden con §14 (Historial)?

Toda discrepancia → **Crítico**.

### Paso 6 — Contraste contra estructura real del monorepo (GitHub o respaldo)

- Artefactos citados existen físicamente (rutas, workspaces, configs).
- `pnpm-workspace.yaml` cubre los paths que el documento autoriza.
- `allowedTopLevel` en `scripts/validate` contra top-levels nuevos introducidos.
- CODEOWNERS, `.prettierignore`, `.gitignore` según aplique.

Clasificar discrepancias solo con fuente suficiente y corroboración normativa. Con fallback, ausencia de un path en el inventario NO demuestra ausencia en `main`. Para `docs/`, el inventario nunca sirve como evidencia. Considerar estado planificado, generado o pendiente antes de categorizar.

### Paso 7 — Contraste cruzado con ADR/RFC/TEC

- Si el doc depende de un ADR aprobado, ¿respeta la decisión?
- Si otro doc cita este con versión X y aquí la versión es Y → **Crítico**.
- Si el doc introduce o modifica top-levels, ¿existe RFC aprobado? (EE-DOC-001 R2).

### Paso 8 — Revisión arquitectónica

Evalúa en este orden:

1. **SSOT** — ¿duplica contenido normativo de otro doc?
2. **Jerarquía** — ¿contradice un doc de nivel superior (§03.1)?
3. **Acoplamiento** — ¿introduce dependencias prohibidas por la matriz de capas?
4. **Completitud normativa** — ¿deja cabos sueltos sin marcar como IMP/ADR?
5. **Trazabilidad** — ¿cada regla tiene padre, evidencia o mecanismo?
6. **Consistencia de estados** — ¿el estado del doc es coherente con lo que afirma?
7. **Idioma (§16.1)** — verifica el catálogo en `references/naming-and-language.md`.

### Paso 9 — Reporte y sincronización AUDIT

Emite el reporte usando el formato obligatorio de abajo y ejecuta el flujo de persistencia de `references/audit-registers.md`. No declarar una auditoría cerrada sin registrar o presentar cambios AUDIT pendientes.

---

## Formato de salida (obligatorio)

```markdown
# Auditoría — {ID del documento}

## 1. Resumen ejecutivo

- Clasificación: {tipo} / {nivel} / Normativo: {sí/no}
- Plantilla esperada: EE-DOC-002 §{X}
- Veredicto: CONFORME | CONFORME CON OBSERVACIONES | NO CONFORME
- Bloqueantes: {n} | Críticos: {n} | Mayores: {n} | Menores: {n}

## 2. Hallazgos

### Bloqueantes

| ID  | Sección | Hallazgo | Evidencia | Fix propuesto |
| --- | ------- | -------- | --------- | ------------- |

### Críticos

| ID  | Sección | Hallazgo | Evidencia | Fix propuesto |
| --- | ------- | -------- | --------- | ------------- |

### Mayores

| ID  | Sección | Hallazgo | Evidencia | Fix propuesto |
| --- | ------- | -------- | --------- | ------------- |

### Menores

| ID  | Sección | Hallazgo | Evidencia | Fix propuesto |
| --- | ------- | -------- | --------- | ------------- |

## 3. Contraste SSOT (EE-DOC-001)

| Aspecto | En el doc | En 001 | ¿Coincide? |

## 4. Contraste Monorepo

| Artefacto declarado | Presente en repo | Ruta real | Notas |

## 5. Checklist EE-DOC-002 §19

- [x] / [ ] ítem por ítem, con nota si aplica.

## 6. Revisión arquitectónica

{Prosa corta: SSOT, jerarquía, acoplamiento, trazabilidad, estados, idioma.}

## 7. Supuestos y no verificables

- Lista explícita.

## 8. Acciones recomendadas (priorizadas)

1.
2.
3.
```

## Reglas para veredicto

- Aplicar C1–C8 de `EE-AUDIT-Criteria_Audited_Definition.md`, con justificación de N/A. No usar la regla simplificada «falta un condicional = CONFORME CON OBSERVACIONES» para afirmar conformidad con un criterio material no verificable: dejar el veredicto formal pendiente cuando el requisito esencial no puede comprobarse.
- Sin bloqueantes ni críticos no basta para «CONFORME» si hay mayores abiertos; contrastar las condiciones expresas del criterio vigente.
- El reporte documental usa las ocho secciones del formato anterior y añade procedencia, SHA/snapshot y estado de publicación AUDIT.
- No llamar «auditado» a un documento mientras C1–C8 y registro AUDIT no estén completados.
- Si una versión auditada en el log difiere de la versión actual, no reescribirla sin reauditar.
