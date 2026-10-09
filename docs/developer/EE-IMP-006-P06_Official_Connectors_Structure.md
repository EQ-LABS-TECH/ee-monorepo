# EE-IMP-006-P06 — Official Connectors Structure

## METADATOS

| Campo                 | Valor                               |
| :-------------------- | :---------------------------------- |
| **ID**                | EE-IMP-006-P06                      |
| **Documento**         | Official Connectors Structure       |
| **Código corto**      | EE-IMP-006-P06                      |
| **Fase**              | Fase 6                              |
| **Tipo**              | Documento Técnico de Implementación |
| **Clasificación**     | Implementación                      |
| **Nivel**             | Técnico                             |
| **Normativo**         | No                                  |
| **Versión**           | v1.0.0                              |
| **Estado**            | Aprobado                            |
| **Propietario**       | Equipo de Arquitectura              |
| **Documento padre**   | EE-DOC-006                          |
| **Dependencias**      | EE-DOC-006, EE-IMP-006-P05          |
| **Aprobado por**      | Equipo de Arquitectura              |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps    |
| **Fecha de creación** | 2026-08-16                          |
| **Última revisión**   | 2026-08-16                          |
| **Próxima revisión**  | —                                   |

---

## 1. Objetivo

Documentar la implementación y validación de la **Fase 6 — Connectors** del Engineering Ecosystem (EE-LABS).

El objetivo de esta fase fue establecer físicamente el directorio `connectors/` y los conectores definidos como oficiales en **EE-DOC-006**, proporcionando una estructura independiente para cada integración externa contemplada por el ecosistema.

La fase establece la base estructural de los conectores oficiales sin implementar todavía la lógica funcional de integración con las plataformas, servicios o protocolos correspondientes.

---

## 2. Alcance implementado

La Fase 6 comprendió la creación de la estructura:

```text
connectors/
├── official/
├── community/
└── experimental/
```

Dentro de `connectors/official/` se implementaron los seis conectores oficiales definidos:

- `@eq-labs/connector-github`
- `@eq-labs/connector-docker`
- `@eq-labs/connector-kubernetes`
- `@eq-labs/connector-notebooklm`
- `@eq-labs/connector-mcp`
- `@eq-labs/connector-a2a`

Cada conector oficial fue creado como workspace independiente y contiene la estructura mínima:

```text
package.json
README.md
tsconfig.json
src/
└── index.ts
```

También se crearon las categorías:

```text
connectors/community/
connectors/experimental/
```

con sus respectivos `README.md`.

No se implementó lógica funcional de integración, autenticación, transporte, descubrimiento de recursos, ejecución de operaciones externas ni workflows específicos.

---

## 3. Estructura física implementada

La estructura resultante de `connectors/` quedó establecida de la siguiente manera:

```text
connectors/
├── official/
│   ├── github/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   │
│   ├── docker/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   │
│   ├── kubernetes/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   │
│   ├── notebooklm/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   │
│   ├── mcp/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   │
│   └── a2a/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       ├── README.md
│       └── tsconfig.json
│
├── community/
│   └── README.md
│
└── experimental/
    └── README.md
```

La estructura mantiene separadas las integraciones oficiales de las categorías destinadas a conectores comunitarios y experimentales.

---

## 4. Conectores oficiales implementados

Durante la Fase 6 se crearon los seis conectores oficiales definidos para la capa `connectors/official/`.

### 4.1 `@eq-labs/connector-github`

Se creó el workspace:

```text
connectors/official/github/
```

con namespace:

```text
@eq-labs/connector-github
```

El conector establece el límite de integración oficial entre el Engineering Ecosystem y GitHub.

Su documentación contempla como ámbito futuro recursos como:

- Repositorios.
- Organizaciones.
- Issues.
- Pull requests.
- Commits.
- Branches.
- Otros recursos soportados de GitHub.

La implementación actual establece el workspace, su configuración TypeScript, documentación y punto de entrada.

No se implementó integración con la API de GitHub ni mecanismo de autenticación.

Archivos implementados:

```text
connectors/official/github/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
export {};
```

---

### 4.2 `@eq-labs/connector-docker`

Se creó el workspace:

```text
connectors/official/docker/
```

con namespace:

```text
@eq-labs/connector-docker
```

El conector establece el límite de integración oficial entre el Engineering Ecosystem y Docker.

Su documentación contempla como ámbito futuro:

- Contenedores.
- Imágenes.
- Registries.
- Runtime.
- Otros recursos soportados de Docker.

La implementación actual establece el workspace, su configuración TypeScript, documentación y punto de entrada.

No se implementó integración con Docker API ni control de runtime.

Archivos implementados:

```text
connectors/official/docker/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
export {};
```

---

### 4.3 `@eq-labs/connector-kubernetes`

Se creó el workspace:

```text
connectors/official/kubernetes/
```

con namespace:

```text
@eq-labs/connector-kubernetes
```

El conector establece el límite de integración oficial entre el Engineering Ecosystem y Kubernetes.

Su documentación contempla como ámbito futuro:

- Clusters.
- Namespaces.
- Workloads.
- Deployments.
- Services.
- Recursos de configuración.
- Otros recursos soportados de Kubernetes.

La implementación actual establece el workspace, su configuración TypeScript, documentación y punto de entrada.

No se implementó integración con Kubernetes API ni operaciones sobre clusters.

Archivos implementados:

```text
connectors/official/kubernetes/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
export {};
```

---

### 4.4 `@eq-labs/connector-notebooklm`

Se creó el workspace:

```text
connectors/official/notebooklm/
```

con namespace:

```text
@eq-labs/connector-notebooklm
```

El conector establece el límite de integración oficial entre el Engineering Ecosystem y NotebookLM.

Su documentación contempla como ámbito futuro:

- Fuentes de conocimiento.
- Sincronización.
- Referencias documentales.
- Workflows de conocimiento.
- Otros recursos soportados de NotebookLM.

La implementación actual establece el workspace, su configuración TypeScript, documentación y punto de entrada.

No se implementó sincronización ni integración externa con NotebookLM.

Archivos implementados:

```text
connectors/official/notebooklm/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
export {};
```

---

### 4.5 `@eq-labs/connector-mcp`

Se creó el workspace:

```text
connectors/official/mcp/
```

con namespace:

```text
@eq-labs/connector-mcp
```

El conector establece el límite oficial para el **Model Context Protocol (MCP)** dentro del Engineering Ecosystem.

La documentación establece que este conector proporcionará posteriormente la capa de integración gobernada para servidores MCP y proveedores de contexto basados en MCP.

Entre los recursos contemplados en la documentación se encuentran:

- Filesystem.
- Git.
- Database.
- Obsidian.
- NotebookLM.

La implementación actual establece el workspace oficial, su configuración TypeScript, documentación y punto de entrada.

No se implementó:

- Servidor MCP.
- Transporte MCP.
- Registro de tools.
- Registro de resources.
- Autenticación.
- Integración con servicios externos.

Archivos implementados:

```text
connectors/official/mcp/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
export {};
```

---

### 4.6 `@eq-labs/connector-a2a`

Se creó el workspace:

```text
connectors/official/a2a/
```

con namespace:

```text
@eq-labs/connector-a2a
```

El conector establece el límite oficial para el protocolo **Agent2Agent (A2A)** dentro del Engineering Ecosystem.

La documentación establece que este conector proporcionará posteriormente la capa de integración gobernada necesaria para la comunicación e interoperabilidad entre agentes autónomos y servicios basados en agentes.

La implementación actual establece el workspace oficial, su configuración TypeScript, documentación y punto de entrada.

No se implementó:

- Implementación del protocolo A2A.
- Descubrimiento de agentes.
- Transporte de mensajes.
- Autenticación.
- Ciclo de vida de tareas.
- Integración con agentes externos.

Archivos implementados:

```text
connectors/official/a2a/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
export {};
```

---

## 5. Estructura común de los conectores oficiales

Los seis conectores oficiales utilizan una estructura homogénea:

```text
<connector>/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

Cada conector posee:

- Un `package.json` independiente.
- Un `README.md` propio.
- Una configuración TypeScript independiente.
- Un punto de entrada `src/index.ts`.

Esta estructura permite mantener cada integración aislada como unidad de workspace y facilita su evolución posterior sin alterar la estructura de los demás conectores.

---

## 6. Namespaces de los conectores

Los namespaces definidos para los conectores oficiales son:

| Conector   | Namespace                       |
| :--------- | :------------------------------ |
| GitHub     | `@eq-labs/connector-github`     |
| Docker     | `@eq-labs/connector-docker`     |
| Kubernetes | `@eq-labs/connector-kubernetes` |
| NotebookLM | `@eq-labs/connector-notebooklm` |
| MCP        | `@eq-labs/connector-mcp`        |
| A2A        | `@eq-labs/connector-a2a`        |

La convención utilizada es:

```text
@eq-labs/connector-<nombre>
```

Todos los paquetes utilizan versión:

```text
0.1.0
```

y licencia:

```text
Apache-2.0
```

---

## 7. Configuración TypeScript

Los seis conectores oficiales utilizan la configuración compartida:

```text
@eq-labs/config-typescript/node
```

Cada `tsconfig.json` utiliza:

```json
{
  "extends": "@eq-labs/config-typescript/node",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

La configuración permite mantener los conectores alineados con el estándar TypeScript Node.js establecido para el monorepo.

El punto de entrada de cada conector se mantiene deliberadamente vacío:

```typescript
export {};
```

debido al carácter estructural de esta fase.

---

## 8. Dependencia de configuración compartida

Cada conector declara la configuración TypeScript compartida mediante:

```json
"devDependencies": {
  "@eq-labs/config-typescript": "workspace:*",
  "typescript": "5.9.2"
}
```

La referencia:

```text
workspace:*
```

mantiene la dependencia dentro del monorepo y permite utilizar directamente el paquete de configuración compartida existente.

Esta configuración evita duplicar las reglas TypeScript dentro de cada conector.

---

## 9. Scripts de los conectores

Los seis conectores oficiales utilizan una interfaz homogénea de scripts:

```json
"scripts": {
  "build": "tsc -p tsconfig.json",
  "typecheck": "tsc -p tsconfig.json --noEmit"
}
```

El script `typecheck` permite validar la consistencia TypeScript sin generar artefactos.

El script `build` permite comprobar que el conector puede ser procesado correctamente por TypeScript utilizando su configuración local.

---

## 10. Separación respecto a `@eq-labs/integration`

Los conectores oficiales permanecen separados del paquete interno:

```text
@eq-labs/integration
```

La separación establece dos responsabilidades diferentes.

El paquete:

```text
@eq-labs/integration
```

representa las abstracciones internas de integración reutilizables dentro del Engineering Ecosystem.

Los conectores:

```text
connectors/official/<connector>
```

representan los límites concretos hacia tecnologías, servicios o protocolos externos.

Esta separación es especialmente relevante para:

```text
connectors/official/mcp
connectors/official/a2a
```

donde MCP y A2A se mantienen como límites externos oficiales independientes.

---

## 11. Categorías `community` y `experimental`

Se crearon las categorías:

```text
connectors/community/
connectors/experimental/
```

### `connectors/community/`

La categoría contiene:

```text
connectors/community/
└── README.md
```

Su documentación establece que esta categoría está destinada a conectores mantenidos por la comunidad.

Los conectores comunitarios no forman parte del conjunto oficial y no se incorporan como workspaces de pnpm hasta que exista un paquete de conector concreto.

### `connectors/experimental/`

La categoría contiene:

```text
connectors/experimental/
└── README.md
```

Su documentación establece que esta categoría está destinada a conectores experimentales bajo evaluación.

Los conectores experimentales no deben considerarse integraciones oficiales mientras no sean promovidos mediante el proceso gobernado correspondiente.

---

## 12. Integración con pnpm Workspaces

Los seis conectores oficiales fueron incorporados al monorepo como workspaces independientes.

La estructura resultante permite reconocer individualmente:

```text
connectors/official/github
connectors/official/docker
connectors/official/kubernetes
connectors/official/notebooklm
connectors/official/mcp
connectors/official/a2a
```

Las categorías:

```text
connectors/community
connectors/experimental
```

no representan actualmente paquetes workspace, debido a que contienen únicamente documentación de categoría.

La integración permitió ejecutar los scripts de los seis conectores mediante los comandos recursivos de pnpm.

---

## 13. Validación ejecutada

La validación técnica de la Fase 6 se ejecutó sobre el monorepo completo mediante:

```bash
pnpm install --force
pnpm -r typecheck
pnpm -r build
```

La ejecución permitió validar simultáneamente:

- Instalación de dependencias.
- Reconocimiento de los nuevos workspaces.
- Resolución de la configuración compartida.
- TypeScript de los conectores.
- Build de los conectores.
- Compatibilidad de los nuevos workspaces con el resto del monorepo.

---

## 14. Validación de instalación de dependencias

Se ejecutó:

```bash
pnpm install --force
```

Resultado registrado:

```text
WARN using --force I sure hope you know what you are doing
Scope: all 25 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +546
...
Done in 1m 31.3s using pnpm v10.16.1
```

La instalación finalizó correctamente.

El comando reconoció:

```text
25 workspace projects
```

confirmando la integración de los nuevos proyectos dentro del monorepo.

Durante la instalación se registraron warnings correspondientes a scripts de construcción ignorados:

```text
Ignored build scripts: @parcel/watcher, esbuild, unrs-resolver.
```

Los warnings no impidieron completar la instalación ni las validaciones posteriores.

---

## 15. Validación de TypeScript

Se ejecutó:

```bash
pnpm -r typecheck
```

Resultado:

```text
Scope: 24 of 25 workspace projects
```

Los seis conectores oficiales finalizaron correctamente:

| Conector                        | Resultado | Tiempo |
| :------------------------------ | :-------: | :----: |
| `@eq-labs/connector-a2a`        |    ✅     |  3.7s  |
| `@eq-labs/connector-docker`     |    ✅     |  1.7s  |
| `@eq-labs/connector-github`     |    ✅     |  1.9s  |
| `@eq-labs/connector-kubernetes` |    ✅     |  1.9s  |
| `@eq-labs/connector-mcp`        |    ✅     |  1.8s  |
| `@eq-labs/connector-notebooklm` |    ✅     |  1.9s  |

La ejecución también confirmó correctamente el `typecheck` de las aplicaciones y paquetes existentes incluidos en el proceso recursivo.

No se registraron errores de TypeScript en los conectores oficiales.

---

## 16. Validación de Build

Se ejecutó:

```bash
pnpm -r build
```

Resultado:

```text
Scope: 24 of 25 workspace projects
```

Los seis conectores oficiales finalizaron correctamente:

| Conector                        | Resultado | Tiempo |
| :------------------------------ | :-------: | :----: |
| `@eq-labs/connector-a2a`        |    ✅     |  1.7s  |
| `@eq-labs/connector-docker`     |    ✅     |  1.6s  |
| `@eq-labs/connector-github`     |    ✅     |  1.7s  |
| `@eq-labs/connector-kubernetes` |    ✅     |  1.6s  |
| `@eq-labs/connector-mcp`        |    ✅     |  1.4s  |
| `@eq-labs/connector-notebooklm` |    ✅     |  1.6s  |

Los paquetes de configuración existentes también finalizaron correctamente sus procesos `build`.

La aplicación `@eq-labs/dashboard` completó además su build mediante Vite:

```text
vite v7.1.3 building for production...
transforming...
✓ 29 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 3.17s
```

La validación confirma que los nuevos conectores pueden ser procesados correctamente junto con el resto del monorepo.

---

## 17. Warnings observados

Durante la instalación se registraron los siguientes warnings:

| Warning                                                          | Tratamiento                                                            |
| :--------------------------------------------------------------- | :--------------------------------------------------------------------- |
| Uso de `--force`                                                 | Registrado como parte del comando de validación ejecutado.             |
| `Ignored build scripts: @parcel/watcher, esbuild, unrs-resolver` | Registrado; no impidió la instalación ni las validaciones posteriores. |

El uso de `--force` corresponde al procedimiento de validación ejecutado y no representa por sí mismo un cambio permanente en la configuración de los conectores.

Los scripts ignorados por pnpm tampoco produjeron errores en los procesos `typecheck` o `build` registrados.

---

## 18. Política de implementación

La Fase 6 se ejecutó bajo los siguientes principios:

| Principio                                | Aplicación                                                 |
| :--------------------------------------- | :--------------------------------------------------------- |
| **Separación de integraciones externas** | Cada conector oficial dispone de workspace independiente.  |
| **Conectores oficiales explícitos**      | Los conectores se encuentran bajo `connectors/official/`.  |
| **Protocolos externos independientes**   | MCP y A2A poseen conectores oficiales propios.             |
| **Configuración compartida**             | Todos utilizan `@eq-labs/config-typescript/node`.          |
| **Workspace local**                      | Las dependencias internas utilizan `workspace:*`.          |
| **Estructura antes que funcionalidad**   | No se implementó lógica de integración durante esta fase.  |
| **Documentación local**                  | Cada conector oficial dispone de su propio README.         |
| **Separación comunitaria**               | `community/` se mantiene separado del conjunto oficial.    |
| **Separación experimental**              | `experimental/` se mantiene separado del conjunto oficial. |
| **Interfaz homogénea**                   | Todos los conectores utilizan `build` y `typecheck`.       |

---

## 19. Artefactos creados

Los principales artefactos creados durante la Fase 6 fueron:

| Artefacto                         | Tipo                    |
| :-------------------------------- | :---------------------- |
| `connectors/official/github/`     | Conector oficial        |
| `connectors/official/docker/`     | Conector oficial        |
| `connectors/official/kubernetes/` | Conector oficial        |
| `connectors/official/notebooklm/` | Conector oficial        |
| `connectors/official/mcp/`        | Conector oficial        |
| `connectors/official/a2a/`        | Conector oficial        |
| `connectors/community/`           | Categoría de conectores |
| `connectors/experimental/`        | Categoría de conectores |

Los seis conectores oficiales contienen:

```text
package.json
README.md
tsconfig.json
src/index.ts
```

Las categorías `community` y `experimental` contienen actualmente únicamente su documentación correspondiente.

---

## 20. Resultado de la implementación

La Fase 6 estableció físicamente la capa de conectores del Engineering Ecosystem.

El resultado incorpora los seis conectores oficiales definidos para esta fase:

```text
GitHub
Docker
Kubernetes
NotebookLM
MCP
A2A
```

La estructura también establece las categorías:

```text
community
experimental
```

Los seis conectores oficiales fueron incorporados como workspaces independientes de pnpm y configurados mediante la infraestructura TypeScript compartida del monorepo.

La implementación mantiene los conectores en estado estructural, sin introducir todavía implementaciones funcionales de las integraciones externas.

La validación realizada sobre el monorepo confirmó correctamente la instalación, el `typecheck` y el `build` de los nuevos conectores y de los proyectos existentes incluidos en los procesos recursivos.

---

## 21. Estado de la Fase

| Aspecto                      |     Estado     |
| :--------------------------- | :------------: |
| **Implementación**           | ✅ Completada  |
| **Estructura de conectores** | ✅ Completada  |
| **Conectores oficiales**     | ✅ Completados |
| **Workspaces**               |  ✅ Validados  |
| **TypeScript**               |  ✅ Validado   |
| **Build**                    |  ✅ Validado   |
| **Documentación**            |  ✅ Borrador   |

La implementación técnica de la **Fase 6 — Connectors** fue completada.

Los seis conectores oficiales definidos fueron creados, incorporados al monorepo y validados mediante los comandos recursivos correspondientes.

El documento permanece en estado **Borrador** como documento técnico de implementación de fase.

---

## 22. Trazabilidad

| Elemento                          | Referencia                                       |
| :-------------------------------- | :----------------------------------------------- |
| **Documento normativo padre**     | EE-DOC-006 — Repository Structure                |
| **Fase**                          | Fase 6 — Connectors                              |
| **Implementación**                | EE-IMP-006-P06                                   |
| **Dependencia de implementación** | EE-IMP-006-P05                                   |
| **Directorio principal**          | `connectors/`                                    |
| **Directorio oficial**            | `connectors/official/`                           |
| **Conectores oficiales**          | GitHub, Docker, Kubernetes, NotebookLM, MCP, A2A |
| **Categoría comunitaria**         | `connectors/community/`                          |
| **Categoría experimental**        | `connectors/experimental/`                       |
| **Configuración compartida**      | `@eq-labs/config-typescript/node`                |
| **Workspace manager**             | pnpm 10.16.1                                     |
| **TypeScript**                    | 5.9.2                                            |
| **Workspace scope validado**      | 25 proyectos                                     |
| **Validación de instalación**     | `pnpm install --force`                           |
| **Validación TypeScript**         | `pnpm -r typecheck`                              |
| **Validación Build**              | `pnpm -r build`                                  |
| **Documentación técnica**         | EE-IMP-006-P06                                   |

---

## 23. Referencias

| Referencia                     | Descripción                                                                                                                |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-006**                 | _Repository Structure_ — documento normativo padre que define la estructura del repositorio y las fases de implementación. |
| **EE-IMP-006-P05**             | Documentación de la Fase 5 — Apps, utilizada como dependencia inmediata de implementación.                                 |
| **EE-IMP-006-P04**             | _Core Packages Structure_ — documentación de la Fase 4 y estructura base de los paquetes del ecosistema.                   |
| **@eq-labs/config-typescript** | Configuración TypeScript compartida utilizada por los conectores oficiales.                                                |

---

## 24. Historial de cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                                                                                                              | Cambios                                                | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------- | :----------- |
| **v1.0.0** | 2026-08-29 | Equipo de Arquitectura | Equipo de Arquitectura | Creación de EE-IMP-006-P06 y documentación de la estructura de conectores oficiales, comunitarios y experimentales. | Registrar la implementación y validación de la Fase 6. | **Aprobado** |

---

## **FIN DEL DOCUMENTO**
