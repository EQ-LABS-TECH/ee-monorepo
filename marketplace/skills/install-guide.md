# EE-LABS — Entrega local de skills v1.0.0

**Estado:** paquete exportado; no instalado en ChatGPT, ni incorporado al checkout local, ni publicado en GitHub.

## Contenido

- `ee-labs-skills-repo-ready-v1.0.0.zip`: árbol `marketplace/skills/` para incorporar a una rama local del monorepo.
- Nueve ZIP individuales `ee-*-skill-v1.0.0.zip`: cada uno contiene `SKILL.md` y referencias de una skill (para carga separada si el cliente admite instalarla).
- `ee-labs-skills-release-manifest-v1.0.0.json`: rutas, hashes SHA256 de entrega y estado de validación.

## Aplicación segura en el checkout local (PowerShell)

1. Obtener/sincronizar la rama de trabajo desde `main` sin alterar `main` remoto.
2. Extraer `ee-labs-skills-repo-ready-v1.0.0.zip` **en una carpeta temporal**, nunca encima del checkout a ciegas.
3. Comparar cada archivo temporal con `marketplace/skills/` del checkout mediante `git diff --no-index` o herramienta de comparación. El ZIP propone actualizar `marketplace/skills/README.md`; revisar modificaciones preexistentes.
4. Copiar o integrar los archivos revisados a las rutas relativas dentro de la rama local. No ejecutar `git reset --hard`, `git clean -fd` ni copiar con `-Force` sin evaluar conflictos.
5. Ejecutar `node marketplace/skills/tests/validate-catalog.mjs` y los quality gates aplicables del monorepo. Registrar resultados reales.
6. Revisar el diff, crear PR según EE-DOC-005/007, y realizar Squash and Merge mediante flujo humano autorizado.

## Política de fuentes

GitHub `main` primero. Si falla, `Paquetes_Archivos_Monorepo.md` solo inventaría contenido **fuera de `docs/`**; los `.md` de `docs/` deben recibirse aparte. Ninguna skill escribe al remoto. Al no existir acceso local autorizado, el agente entrega ZIP con rutas exactas, no afirma haber modificado un checkout.

## Alcance de validación

Validador estructural Node y CRC de ZIP aprobados. No se ejecutaron los escenarios manuales de `marketplace/skills/test-cases.md`, ni lint, typecheck, test, build ni E2E del monorepo.
