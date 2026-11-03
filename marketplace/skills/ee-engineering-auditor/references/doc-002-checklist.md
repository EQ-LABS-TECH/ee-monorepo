# Checklist EE-DOC-002 §19 — extracto operativo

Uso: recorrer ítem por ítem durante el Paso 4 del proceso.
Los ítems marcados con **(skill)** son extensiones operativas del auditor y
no forman parte literal de §19.

---

## Obligatorios de alta frecuencia

- [ ] Código corto sin prefijo `EE` (p. ej. `DOC-002`, `IMP-006-P01`) y coherente con el ID
- [ ] Numeración de secciones en dos dígitos (`## 01.`, `### 01.1.`) — sin `x.0`
- [ ] Próxima revisión = `No aplica — Documento Congelado` si Estado = Congelado
- [ ] Nombre de archivo EE-\* según §16 / EE-DOC-006 §07.1 (`{ID}_{Nombre}.md`, inglés en el nombre de archivo)
- [ ] Historial de Cambios con las 7 columnas de §11 (Versión, Fecha, Autor, Aprobado por, Motivo, Cambios, Estado)

---

## Estructura y formato

- [ ] Cumple el estándar definido en EE-DOC-002
- [ ] Estructura base cumplida según el tipo de documento
- [ ] Metadatos completos y correctos (todos los obligatorios de §05)
- [ ] Propósito definido (una línea clara)
- [ ] Alcance definido (qué cubre y qué no cubre)

---

## Contenido

- [ ] Sin errores ortográficos ni gramaticales
- [ ] Nomenclatura consistente (títulos, códigos, nombres) — ver §16
- [ ] No contradice un documento de mayor jerarquía (§03.1)
- [ ] No duplica información definida en otro documento de mayor jerarquía
- [ ] Coherente con el roadmap, dependencias y estrategia de EE-DOC-001

---

## Elementos gráficos

- [ ] Diagramas Mermaid con sintaxis válida
- [ ] Tablas con encabezados y alineación correctos
- [ ] **(skill)** Toda tabla tiene fila separadora (`| --- |`) tras el header

---

## Referencias y enlaces

- [ ] Referencias válidas y existentes
- [ ] Enlaces funcionales (a otros documentos, secciones, etc.)
- [ ] **(skill)** Referencias cruzadas usan el formato `Código — Nombre`

---

## Control de versiones y estado

- [ ] Versión correcta (SemVer, §15)
- [ ] Estado documental correcto según el ciclo de vida (§13)
- [ ] Historial de cambios actualizado (versión, fecha, cambios)

---

## Validación de implementación (cuando aplique)

- [ ] No existen desviaciones conocidas entre el contenido normativo vigente
      y la implementación correspondiente sin resolución, documentación o
      aceptación formal
- [ ] Si el documento está sujeto a implementación, no se encuentra en estado
      Congelado mientras puedan existir descubrimientos pendientes que
      requieran modificar su contenido normativo
- [ ] Si el documento está en estado Congelado, la versión correspondiente no
      ha sido modificada directamente
- [ ] Toda modificación posterior a una versión congelada genera una nueva
      versión documental
