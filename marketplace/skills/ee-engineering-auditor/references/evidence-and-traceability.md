# Contrato de hallazgos y trazabilidad (propuesta operativa, NO norma EE)

Para cada hallazgo usar un registro lógico reproducible; puede emitirse como tabla Markdown y opcionalmente JSON. El JSON aquí es un formato **propuesto** para automatización, no un esquema aprobado.

```json
{
  "id": "LOCAL-001",
  "mode": "architecture",
  "severity": "Mayor",
  "status": "OPEN",
  "source": {
    "repository": "EQ-LABS-TECH/ee-monorepo",
    "ref": "main",
    "commit": null,
    "snapshot": null
  },
  "norm": { "document": null, "section": null },
  "implementation": { "path": null, "lines": null, "symbol": null },
  "evidence": { "location": null, "observation": null, "verification": "NO VERIFICABLE" },
  "impact": { "components": [], "consumers": [], "risk": null },
  "fix": { "proposal": null, "validation": "NO EJECUTADO" },
  "audit": {
    "destination": "EE-AUDIT-Log_Progress_Register.md",
    "entry": null,
    "publication": "PENDIENTE DE PUBLICACIÓN"
  }
}
```

## Criterios

- Identificador estable durante el ciclo (prefijo `LOCAL-*` hasta asignación de ID conforme al registro). Buscar duplicados por norma + ruta/símbolo + causa y reaprovechar referencias existentes. Nunca inventar correlativos oficiales `AR-*`.
- Para evidencias GitHub conservar SHA y ruta con líneas si son accesibles; si la línea cambia, proporcionar símbolo y reproducción. Para snapshots, nombre del archivo y fecha de captura conocida, sin atribuirlo a `main`.
- Diferenciar observación directa, inferencia técnica y no verificable. Ausencia del inventario no es ausencia del monorepo; `docs/` fuera de cobertura del respaldo.
- Un claim de gate `PASS` exige log o salida realmente consultados con contexto del commit y caché; de lo contrario `NO EJECUTADO` o `NO VERIFICABLE`.
- Trazabilidad bidireccional: norma → implementación → hallazgo → evidencia → validación → registro AUDIT; desde entrada AUDIT debe poder identificarse el hallazgo y su prueba sin perder histórico.
- No copiar credenciales, información sensible o secretos dentro de reportes o evidencia.
