# Validación del catálogo

Desde la raíz del repositorio, ejecutar:

```powershell
node marketplace/skills/tests/validate-catalog.mjs
```

Valida nombres, frontmatter básico, rutas a referencias y presencia del contrato transversal. **No** certifica YAML general, permisos GitHub, conexión a repositorio, ejecución funcional de las skills ni quality gates del monorepo. Consultar `../test-cases.md` para los escenarios manuales pendientes.
