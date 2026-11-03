# Nomenclatura (§16) e idioma (§16.1)

## Nomenclatura — EE-DOC-002 §16

```markdown
| Elemento     | Formato          | Ejemplo                                 |
| :----------- | :--------------- | :-------------------------------------- |
| IDs          | `XX-XXX-XXX`     | `EE-DOC-001`                            |
| Documentos   | Title Case       | `Engineering Ecosystem Constitution`    |
| Código Corto | `XX-XXX-XXX`     | `EE-DOC-001`                            |
| Archivos     | kebab-case       | `engineering-ecosystem-constitution.md` |
| Roles        | Title Case       | `Arquitecto`                            |
| Herramientas | Capitalizado     | `VSCode`, `Windsurf`                    |
| Paquetes     | kebab-case       | `kernel-foundation`                     |
| Repositorios | kebab-case       | `eq-labs-platform`                      |
| Carpetas     | kebab-case       | `packages/kernel-foundation/`           |
| Variables    | camelCase        | `knowledgeEngine`                       |
| Tipos        | PascalCase       | `KnowledgeEngine`                       |
| Interfaces   | PascalCase       | `IKnowledgeEngine`                      |
| Enums        | PascalCase       | `KnowledgeStatus`                       |
| Constantes   | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`                       |
| Namespaces   | dot.case         | `company.domain`                        |
```

---

## Idioma — EE-DOC-002 §16.1

**Regla de Oro:** _Código e interfaces en Inglés; Gobernanza y Arquitectura en Español._

### Inglés (`en-US`) — obligatorio

- Código fuente
- Comentarios de código y JSDoc
- Nombres de variables, funciones y tipos
- Nombres de archivos y directorios
- `package.json` y manifiestos
- README técnicos de paquetes (`packages/*/README.md`)
- Ramas Git
- Plantillas de Issue / Pull Request
- Mensajes y salidas de CI / GitHub Actions / bots
- Nombres de workflows, jobs y steps de CI

### Español — obligatorio

- Documentos normativos (`EE-DOC-XXX`)
- Planes de implementación (`EE-IMP-XXX-PXX`)
- Registros de decisión (`EE-ADR-XXX`)
- Propuestas de cambio (`EE-RFC-XXX`)
- Documentación técnica consolidada (`EE-TEC-XXX`)
- Documentación arquitectónica y estratégica
- Mensajes y comunicación interna del equipo

---

## Regla de SSOT

La tabla de idioma de §16.1 es **Single Source of Truth**. Ningún otro
documento puede redefinirla ni duplicarla; solo referenciarla.
