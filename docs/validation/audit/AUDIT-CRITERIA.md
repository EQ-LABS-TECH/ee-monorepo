# Criterio operativo — Documento «Auditado»

Definición operativa para auditorías de documentación del Engineering Ecosystem
(gobernanza EE-DOC / EE-ADR / EE-RFC / EE-IMP / EE-TEC y evidencias asociadas).

**Ámbito:** revisión normativa y de coherencia documental sobre `main`.
**No sustituye:** Quality Gates de código (QG-*), EE-VAL de ecosistema, ni RFC/ADR
cuando el hallazgo lo exija.

---

## 1. Veredicto

| Veredicto | Significado |
| :-------- | :---------- |
| **CONFORME** | Cumple todos los criterios obligatorios; hallazgos abiertos solo Menores aceptados o diferidos con plan |
| **NO CONFORME** | Existe al menos un Bloqueante o Crítico abierto, o Mayor sin plan de cierre |
| **CONFORME CON RESERVAS** | Sin Bloqueantes/Críticos; Mayores diferidos con mecanismo formal (Aclaración / ADR / RFC) y registro |

Un documento solo se marca **Auditado** en el AUDIT-LOG cuando el veredicto es
**CONFORME** o **CONFORME CON RESERVAS** y la fila del log está completa.

---

## 2. Criterios obligatorios (checklist)

Todos deben evaluarse. Marcar N/A solo si el tipo de documento no aplica el ítem
(con justificación en notas).

### C1 — Identidad y metadatos (EE-DOC-002)

- [ ] Código, título y nombre de archivo coherentes
- [ ] Metadatos presentes y válidos (versión, estado, fecha, owner/autoridad)
- [ ] Estado alineado con el ciclo de vida declarado (Congelado / Vigente / etc.)
- [ ] Historial de cambios presente; última fila coherente con la versión auditada

### C2 — Plantilla y estructura

- [ ] Estructura conforme a EE-DOC-002 para el tipo de documento (secciones mínimas)
- [ ] Numeración de secciones coherente con la convención aplicable
- [ ] Sin secciones obligatorias ausentes sin justificación

### C3 — Coherencia con EE-DOC-001 (SSOT de índice)

- [ ] El documento aparece en EE-DOC-001 (o está explícitamente fuera de alcance)
- [ ] Estado/versión referenciados en el índice no contradicen el documento
- [ ] Dependencias declaradas existen y no rompen la jerarquía §03.1

### C4 — Referencias cruzadas

- [ ] Códigos EE-* citados existen o están marcados como planificados/NO VERIFICABLE con causa
- [ ] Anclas §X.Y citadas son resolubles en el documento destino (o se registra gap)
- [ ] No hay referencias rotas a ADRs/RFCs/IMPs/TECs cerrados como vigentes si no lo están

### C5 — Rutas y árbol del monorepo

- [ ] Rutas de repo citadas (`docs/…`, `packages/…`, `scripts/…`, etc.) existen en `main` **o** se documentan como NO VERIFICABLE / futuras con causa
- [ ] No se inventan top-levels fuera de EE-DOC-006 sin RFC/ADR aplicable

### C6 — Jerarquía y gobernanza

- [ ] No contradice documentos Congelados de nivel superior sin proceso de cambio
- [ ] Hallazgos que exigen cambio transversal o arquitectónico se clasifican (A/B/C/D) según régimen EE

### C7 — Calidad de formato (apoyo, no suficiente)

- [ ] Markdown legible; tablas y listas coherentes
- [ ] `markdownlint` sin errores bloqueantes en el archivo (si se ejecuta en el alcance)

### C8 — Cierre de hallazgos y registro

- [ ] Hallazgos clasificados: Bloqueante / Crítico / Mayor / Menor
- [ ] Abiertos: plan de cierre o diferido explícito
- [ ] Fila actualizada en `docs/validation/audit/AUDIT-LOG.md`
- [ ] Fecha, versión del documento y veredicto registrados

---

## 3. Clasificación de hallazgos

| Severidad | Definición operativa |
| :-------- | :------------------- |
| **Bloqueante** | Impide usar el documento como norma (identidad inválida, tipo incorrecto, ruptura grave de SSOT) |
| **Crítico** | Contradicción material con documento superior Congelado, o traza de implementación falsa |
| **Mayor** | Gap de plantilla, matriz de trazabilidad incompleta, inconsistencia relevante corregible |
| **Menor** | Cosmético, estilo, homogenización opcional, tipografía |

---

## 4. Política de trabajo

| Actividad | Dónde |
| :-------- | :---- |
| Lectura / exploración / checklist | `main` actualizado |
| Correcciones | Rama `docs/…` o `audit/…` desde `main` → PR → Squash and Merge |
| Registro de progreso | `docs/validation/audit/AUDIT-LOG.md` |

**Prohibido:** commits directos de correcciones normativas en `main` eludiendo PR.

---

## 5. Referencias

- EE-DOC-001 — Master Documentation Index
- EE-DOC-002 — Document Design Template
- EE-DOC-006 — Repository Structure
- EE-DOC-015 — Engineering Ecosystem Validation
- EE-DOC-010 — Quality Gates (hallazgos de gates ≠ hallazgos de esta auditoría documental)
