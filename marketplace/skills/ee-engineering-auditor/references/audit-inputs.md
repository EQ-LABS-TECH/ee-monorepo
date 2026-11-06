# Inputs y cobertura por modo

## Siempre antes de cualquier auditoría

1. Objetivo, alcance, modo y fuente; intenta lectura de `EQ-LABS-TECH/ee-monorepo` desde GitHub conector autorizado, fija `main`/SHA o registra imposibilidad.
2. Lee los cuatro registros AUDIT de `docs/validation/audit/` (Criteria, Log, Rules Register y Backlog). Sin GitHub, exígelos como `.md` individuales, pues **no están en** `Paquetes_Archivos_Monorepo.md`.
3. Identifica las normas relevantes, la evidencia técnica y los límites. Sin un artefacto esencial, detener **el veredicto afectado**, no toda investigación parcial.

## Fuentes condicionales

- **GitHub disponible:** usa árbol y archivos del repositorio al commit fijado para código y documentación. `Paquetes_Archivos_Monorepo.md` **no es obligatorio ni debe prevalecer**.
- **GitHub no disponible:** `Paquetes_Archivos_Monorepo.md` es el respaldo del inventario del monorepo **fuera de `docs/`**. Si no se aporta, declarar esa cobertura no verificable; no inventar su ruta.
- **Documentación sin GitHub:** aportar por separado el objetivo, EE-DOC-001, EE-DOC-002 y otros documentos normativos que apliquen, así como los cuatro registros AUDIT completos. El inventario nunca sustituye esta documentación.
- **Código:** fuentes reales, configuración y contratos relacionados; inventario solo ayuda a localizar estructura, nunca a verificar semántica de código que no se haya leído.
- **Arquitectura:** EE-DOC-001/003/004/006 vigentes cuando sean pertinentes, ADR/RFC relativos y fuentes de implementación.
- **CI/seguridad:** workflows, configuraciones y evidencia ejecutada si se quiere certificar gates; sin ejecución reportar NO EJECUTADO.
- **PR:** base/head y diff; consumidores, pruebas, documentos afectados, versionado/Changesets cuando apliquen.

## Faltantes y resultado

- Ausencia de un input obligatorio material → no emitir veredicto formal positivo; registrar `NO VERIFICABLE` para el criterio y diagnóstico parcial.
- Ausencia de fuentes solo condicionales → indicar criterios afectados, alcance y riesgo; no rebajar automáticamente a un estado formal que sugiera conformidad.
- Rutas que no existen/refs rotos → verificar primero cobertura, estado planificado y exactitud de búsqueda antes de clasificarlos.
- Historial de versiones, metadatos y código corto → aplicar EE-DOC-002 **vigente**, no los ejemplos desactualizados del skill.
