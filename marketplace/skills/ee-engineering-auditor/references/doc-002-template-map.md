# EE-DOC-002 — Mapa de plantillas por tipo de artefacto

Fuente normativa: **EE-DOC-002 §18** (SSOT — no duplicar contenido).

---

## Cómo usar este archivo

Este archivo es un **índice de navegación**. No contiene el contenido de las
plantillas. El auditor debe leer siempre la versión vigente de EE-DOC-002.

La versión vigente se determina consultando:

1. `EE-DOC-001 §06` — Estructura Documental (código y dependencias).
2. `EE-DOC-001 §09` — Matriz de Trazabilidad (estado y versión congelada).

---

## Plantillas por tipo

```markdown
| Tipo de artefacto       | Sección en EE-DOC-002 |
| ----------------------- | --------------------- |
| EE-DOC-XXX (normativos) | §18.1                 |
| EE-ADR-XXX              | §18.2                 |
| EE-IMP-XXX-PXX          | §18.3                 |
| EE-TEC-XXX              | §18.4                 |
| EE-RFC-XXX              | §18.5                 |
| EE-VAL-* / EE-WAIVE-*   | §18.6                 |
```

---

## Reglas de aplicación

- EE-DOC-001 a EE-DOC-005 son **fundacionales**: no aplican XX (Plan de Implementación) ni CC (Cierre Documental).
- EE-DOC-006 en adelante son **implementables**: la cola XX/YY/ZZ/AA/BB/CC es obligatoria.
- Un ADR no usa el cierre CC del EE-DOC; su plantilla es §18.2.
- Un RFC no usa el cierre CC; su resolución está en §11 de §18.5.

---

## Regla de actualización

Si EE-DOC-002 cambia de versión, este índice sigue apuntando a §18. No se
clona contenido normativo aquí. Cualquier discrepancia entre este índice y
EE-DOC-002 vigente se resuelve a favor de EE-DOC-002.
