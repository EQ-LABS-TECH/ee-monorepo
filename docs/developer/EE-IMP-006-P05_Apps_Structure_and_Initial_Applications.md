# EE-IMP-006-P05 — Apps Structure

## METADATOS

| Campo                 | Valor                               |
| :-------------------- | :---------------------------------- |
| **ID**                | EE-IMP-006-P05                      |
| **Documento**         | Apps Structure                      |
| **Código corto**      | EE-IMP-006-P05                      |
| **Fase**              | Fase 5                              |
| **Tipo**              | Documento Técnico de Implementación |
| **Clasificación**     | Implementación                      |
| **Nivel**             | Técnico                             |
| **Normativo**         | No                                  |
| **Versión**           | v1.0.0                              |
| **Estado**            | Aprobado                            |
| **Propietario**       | Equipo de Arquitectura              |
| **Documento padre**   | EE-DOC-006                          |
| **Dependencias**      | EE-DOC-006, EE-IMP-006-P04          |
| **Aprobado por**      | Equipo de Arquitectura              |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps    |
| **Fecha de creación** | 2026-08-31                          |
| **Última revisión**   | 2026-08-31                          |
| **Próxima revisión**  | —                                   |

---

## 1. Objetivo

Documentar la implementación y validación de la **Fase 5 — Apps** del Engineering Ecosystem (EE-LABS).

El objetivo de esta fase fue establecer el directorio `apps/` del monorepo y crear sus primeras aplicaciones funcionales, proporcionando puntos de entrada concretos para la interacción con el Engineering Ecosystem.

A diferencia de la Fase 4, cuyo objetivo principal fue establecer los paquetes estructurales de `packages/`, la Fase 5 incorpora implementaciones mínimas ejecutables para las aplicaciones principales.

La fase estableció tres aplicaciones:

- `@eq-labs/cli`
- `@eq-labs/dashboard`
- `@eq-labs/extensions`

La implementación se mantuvo deliberadamente mínima, sin incorporar todavía funcionalidades de negocio, workflows, integraciones, autenticación, navegación, comandos del ecosistema ni capacidades específicas de extensiones de IDE.

---

## 2. Alcance implementado

La Fase 5 comprendió la creación del directorio:

```text
apps/
```

y las siguientes tres aplicaciones:

```text
apps/
├── cli/
├── dashboard/
└── extensions/
```

Cada aplicación fue incorporada como workspace independiente del monorepo.

El alcance funcional implementado fue:

| Aplicación            | Implementación                                             |
| :-------------------- | :--------------------------------------------------------- |
| `@eq-labs/cli`        | CLI funcional con salida `Hello World`.                    |
| `@eq-labs/dashboard`  | Aplicación React funcional con página inicial.             |
| `@eq-labs/extensions` | Estructura base preparada para futuras extensiones de IDE. |

La fase no implementó:

- comandos funcionales del ecosistema;
- workflows;
- autenticación;
- autorización;
- navegación del dashboard;
- módulos de negocio;
- integración con backend;
- proveedores de datos;
- extensiones específicas de IDE;
- comandos de IDE;
- activation handlers;
- providers;
- interfaces específicas de extensiones.

---

## 3. Estructura física implementada

La estructura resultante de `apps/` quedó establecida de la siguiente manera:

```text
apps/
├── cli/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── README.md
│   └── tsconfig.json
│
├── dashboard/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── extensions/
    ├── src/
    │   └── index.ts
    ├── package.json
    ├── README.md
    └── tsconfig.json
```

La estructura establece tres puntos de entrada diferenciados:

```text
apps/cli
apps/dashboard
apps/extensions
```

Cada aplicación mantiene responsabilidades independientes y utiliza la configuración compartida existente cuando corresponde.

---

## 4. Apps implementadas

### 4.1 `@eq-labs/cli`

Se creó el paquete:

```text
apps/cli/
```

con namespace:

```text
@eq-labs/cli
```

La aplicación representa el punto de entrada de línea de comandos del Engineering Ecosystem.

La implementación actual es deliberadamente mínima y proporciona una salida funcional:

```text
Hello World
```

Archivos creados:

```text
apps/cli/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada contiene:

```typescript
console.log('Hello World');
```

El `package.json` define:

```json
{
  "name": "@eq-labs/cli",
  "version": "0.1.0",
  "private": true,
  "description": "Command-line interface for the EQ-LABS Engineering Ecosystem.",
  "license": "Apache-2.0",
  "type": "module"
}
```

Los scripts implementados son:

```json
"scripts": {
  "build": "tsc -p tsconfig.json",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "start": "node dist/index.js"
}
```

El script `start` utiliza el artefacto generado en:

```text
dist/index.js
```

de acuerdo con el `outDir` definido en `tsconfig.json`.

La configuración TypeScript utiliza:

```text
@eq-labs/config-typescript/node
```

y establece:

```json
{
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false
  }
}
```

La aplicación dispone de una implementación funcional mínima y queda preparada para futuras capacidades de CLI.

---

### 4.2 `@eq-labs/dashboard`

Se creó el paquete:

```text
apps/dashboard/
```

con namespace:

```text
@eq-labs/dashboard
```

La aplicación representa el punto de entrada web del Engineering Ecosystem.

La implementación utiliza:

- React;
- React DOM;
- Vite;
- TypeScript;
- configuración TypeScript compartida;
- configuración Vite compartida.

Archivos creados:

```text
apps/dashboard/
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

El componente principal implementado es:

```typescript
function App() {
  return (
    <main>
      <h1>EQ-LABS Engineering Ecosystem</h1>
      <p>Dashboard</p>
    </main>
  );
}

export default App;
```

El punto de entrada React utiliza:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

La página HTML utiliza:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

La configuración de Vite utiliza directamente el preset compartido:

```typescript
import config from '@eq-labs/config-vite/react';

export default config;
```

Esto mantiene la aplicación alineada con la arquitectura de configuración centralizada en:

```text
packages/config/
```

Las dependencias principales fueron fijadas mediante versiones exactas:

```json
"dependencies": {
  "react": "19.1.1",
  "react-dom": "19.1.1"
}
```

y:

```json
"devDependencies": {
  "@types/react": "19.1.10",
  "@types/react-dom": "19.1.7",
  "@vitejs/plugin-react": "5.0.2",
  "typescript": "5.9.2",
  "vite": "7.1.3"
}
```

La aplicación genera correctamente el bundle de producción mediante Vite.

---

### 4.3 `@eq-labs/extensions`

Se creó el paquete:

```text
apps/extensions/
```

con namespace:

```text
@eq-labs/extensions
```

La aplicación representa la base estructural para futuras extensiones asociadas a entornos de desarrollo.

Archivos creados:

```text
apps/extensions/
├── src/
│   └── index.ts
├── package.json
├── README.md
└── tsconfig.json
```

El punto de entrada actual contiene:

```typescript
export {};
```

La aplicación no implementa todavía una extensión concreta de IDE.

No se incorporaron:

- activation handlers;
- comandos;
- providers;
- interfaces de usuario;
- integración con un IDE específico;
- lógica de integración.

La aplicación queda establecida como punto estructural para futuras implementaciones de extensiones.

---

## 5. Configuración de las aplicaciones

Las aplicaciones fueron configuradas como workspaces independientes dentro del monorepo.

Las aplicaciones Node/TypeScript:

```text
@eq-labs/cli
@eq-labs/extensions
```

utilizan:

```text
@eq-labs/config-typescript/node
```

El dashboard utiliza:

```text
@eq-labs/config-typescript/react
```

y:

```text
@eq-labs/config-vite/react
```

Las dependencias internas de configuración utilizan referencias workspace:

```json
"@eq-labs/config-typescript": "workspace:*"
```

y, para el dashboard:

```json
"@eq-labs/config-vite": "workspace:*"
```

Esta integración permite que las aplicaciones consuman los paquetes de configuración compartida existentes dentro del mismo monorepo.

---

## 6. Configuración de `@eq-labs/config-vite`

Durante la implementación del dashboard fue necesario completar la exposición pública del preset React de Vite.

El paquete:

```text
packages/config/vite/
```

mantiene los archivos:

```text
base.mjs
base.d.ts
library.mjs
library.d.ts
react.mjs
react.d.ts
```

El `package.json` fue configurado para incluir los archivos JavaScript y sus declaraciones de tipos:

```json
"files": [
  "base.mjs",
  "base.d.ts",
  "library.mjs",
  "library.d.ts",
  "react.mjs",
  "react.d.ts",
  "README.md",
  "package.json"
]
```

Los exports quedaron definidos de forma explícita:

```json
"exports": {
  "./base": {
    "types": "./base.d.ts",
    "import": "./base.mjs"
  },
  "./library": {
    "types": "./library.d.ts",
    "import": "./library.mjs"
  },
  "./react": {
    "types": "./react.d.ts",
    "import": "./react.mjs"
  }
}
```

Esta configuración permite consumir:

```text
@eq-labs/config-vite/react
```

desde:

```text
apps/dashboard/vite.config.ts
```

La inclusión de las declaraciones `.d.ts` permite además que TypeScript pueda resolver los tipos correspondientes al módulo.

---

## 7. Correcciones realizadas durante la implementación

Durante la implementación de la Fase 5 se identificaron y resolvieron varios aspectos técnicos.

### 7.1 Entry point del CLI

La configuración inicial del CLI utilizaba un `start` que apuntaba a:

```text
src/index.js
```

Sin embargo, la compilación TypeScript utiliza:

```json
"outDir": "dist"
```

por lo que el archivo generado se encuentra en:

```text
dist/index.js
```

El script fue corregido a:

```json
"start": "node dist/index.js"
```

Esto alinea el comando de ejecución con el artefacto real generado por TypeScript.

### 7.2 Resolución de `@eq-labs/config-vite/react`

El dashboard inicialmente presentó un error relacionado con la resolución del módulo:

```text
@eq-labs/config-vite/react
```

La causa estaba relacionada con la ausencia de una exportación pública correctamente definida para el preset React.

La solución consistió en definir explícitamente:

```json
"./react": {
  "types": "./react.d.ts",
  "import": "./react.mjs"
}
```

en los `exports` del paquete.

### 7.3 Declaraciones TypeScript para `config-vite`

TypeScript inicialmente reportó:

```text
TS7016
No se encontró ningún archivo de declaración para el módulo
@eq-labs/config-vite/react
```

La solución fue incorporar:

```text
react.d.ts
```

y exponerlo mediante:

```json
"types": "./react.d.ts"
```

Esto permitió que TypeScript reconociera el módulo compartido con sus declaraciones correspondientes.

### 7.4 Tipado del entorno Vite

Para el dashboard se creó:

```text
apps/dashboard/src/vite-env.d.ts
```

con:

```typescript
/// <reference types="vite/client" />
```

Este archivo permite que TypeScript reconozca los tipos proporcionados por Vite dentro del entorno de la aplicación.

---

## 8. Política de versiones

Las aplicaciones implementadas respetan la política establecida para las dependencias externas mediante versiones explícitas.

En particular, el dashboard utiliza versiones exactas para React, React DOM, tipos de React, Vite, plugin React y TypeScript.

Se evita utilizar rangos con `^` en las dependencias externas de la aplicación.

Las dependencias internas del monorepo continúan utilizando:

```text
workspace:*
```

como mecanismo de resolución entre paquetes locales.

Esta separación permite mantener:

- versiones externas explícitas;
- dependencias internas vinculadas al workspace;
- coherencia con la política de configuración centralizada.

---

## 9. Integración con pnpm Workspaces

Las tres aplicaciones fueron incorporadas como workspaces bajo:

```text
apps/*
```

La estructura física utilizada es:

```text
apps/
├── cli/
├── dashboard/
└── extensions/
```

El patrón:

```yaml
apps/*
```

permite detectar directamente las tres aplicaciones.

Para `apps/extensions/`, la implementación actual corresponde al propio workspace:

```text
apps/extensions/
```

y no a extensiones individuales internas.

La expansión futura hacia extensiones concretas podrá utilizar posteriormente una estructura como:

```text
apps/extensions/*
```

cuando existan implementaciones independientes de extensiones.

La configuración actual permite que las tres aplicaciones sean reconocidas correctamente por pnpm.

---

## 10. Documentación local

Cada aplicación creada durante la Fase 5 incorpora su propio:

```text
README.md
```

Los README fueron redactados en inglés y documentan:

- propósito;
- estado actual;
- alcance de la implementación;
- tecnología utilizada cuando corresponde;
- configuración compartida;
- comandos disponibles;
- limitaciones funcionales actuales.

Los README mantienen explícitamente el carácter mínimo de esta fase y no atribuyen funcionalidades que todavía no hayan sido implementadas.

---

## 11. Scripts implementados

Las aplicaciones cuentan con interfaces de ejecución coherentes con su naturaleza.

**CLI:**

```json
"scripts": {
  "build": "tsc -p tsconfig.json",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "start": "node dist/index.js"
}
```

**Dashboard:**

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "preview": "vite preview"
}
```

**Extensions:**

```json
"scripts": {
  "build": "tsc -p tsconfig.json",
  "typecheck": "tsc -p tsconfig.json --noEmit"
}
```

La diferencia entre los scripts responde a la naturaleza de cada aplicación.

El dashboard requiere servidor de desarrollo y preview de Vite, mientras que CLI y extensions utilizan directamente TypeScript.

---

## 12. Validación ejecutada

La validación técnica de la Fase 5 se realizó mediante:

```bash
pnpm install
pnpm -r typecheck
pnpm -r build
```

La ejecución se realizó sobre el workspace completo.

El estado registrado indica:

```text
Scope: all 19 workspace projects
```

para la instalación.

Las operaciones recursivas de validación se ejecutaron sobre:

```text
18 of 19 workspace projects
```

---

## 13. Validación de TypeScript

Se ejecutó:

```bash
pnpm -r typecheck
```

Resultado registrado:

```text
Scope: 18 of 19 workspace projects
```

Las tres aplicaciones de la Fase 5 finalizaron correctamente:

| Aplicación            | Resultado |
| :-------------------- | :-------: |
| `@eq-labs/cli`        |    ✅     |
| `@eq-labs/dashboard`  |    ✅     |
| `@eq-labs/extensions` |    ✅     |

También finalizaron correctamente los paquetes existentes que participaron en la ejecución recursiva:

| Paquete                 | Resultado |
| :---------------------- | :-------: |
| `packages/execution`    |    ✅     |
| `packages/foundation`   |    ✅     |
| `packages/governance`   |    ✅     |
| `packages/integration`  |    ✅     |
| `packages/intelligence` |    ✅     |
| `packages/knowledge`    |    ✅     |
| `packages/registry`     |    ✅     |
| `packages/sdk`          |    ✅     |
| `packages/shared`       |    ✅     |

No se registraron errores de TypeScript durante la validación final.

La resolución de:

```text
@eq-labs/config-vite/react
```

y sus declaraciones de tipos quedó validada mediante esta ejecución.

---

## 14. Validación de Build

Se ejecutó:

```bash
pnpm -r build
```

Resultado registrado:

```text
Scope: 18 of 19 workspace projects
```

Las tres aplicaciones de la Fase 5 finalizaron correctamente.

**CLI:**

```text
apps/cli build$ tsc -p tsconfig.json
└─ Done in 1.7s
```

**Dashboard:**

```text
apps/dashboard build$ vite build
│ vite v7.1.3 building for production...
│ transforming...
│ ✓ 29 modules transformed.
│ rendering chunks...
│ computing gzip size...
│ dist/index.html                   0.51 kB
│ dist/assets/index-B51qReza.css    0.11 kB
│ dist/assets/index-pyin-Vg4.js   187.48 kB
│ ✓ built in 2.01s
└─ Done in 7.4s
```

El dashboard produjo correctamente el artefacto de producción dentro de:

```text
dist/
```

**Extensions:**

```text
apps/extensions build$ tsc -p tsconfig.json
└─ Done in 1.5s
```

La validación confirma que las tres aplicaciones pueden ser compiladas dentro del workspace.

---

## 15. Warnings observados

Durante:

```bash
pnpm install
```

se registró el siguiente warning:

```text
Ignored build scripts: esbuild.
Run "pnpm approve-builds" to pick which dependencies
should be allowed to run scripts.
```

Este warning fue registrado como parte de la instalación del workspace.

No impidió la ejecución de:

```bash
pnpm -r typecheck
```

ni:

```bash
pnpm -r build
```

La instalación terminó correctamente con:

```text
Already up to date
```

El warning corresponde al mecanismo de aprobación de scripts de build de pnpm y no produjo errores en las validaciones ejecutadas para esta fase.

---

## 16. Política de implementación

La Fase 5 se ejecutó bajo los siguientes principios:

| Principio                            | Aplicación                                                                                  |
| :----------------------------------- | :------------------------------------------------------------------------------------------ |
| **Aplicación mínima funcional**      | Cada aplicación proporciona un punto de entrada funcional o estructural según su propósito. |
| **Separación de responsabilidades**  | CLI, dashboard y extensions mantienen responsabilidades independientes.                     |
| **Configuración compartida**         | Las aplicaciones consumen los paquetes de configuración centralizados.                      |
| **Workspace local**                  | Las dependencias internas utilizan `workspace:*`.                                           |
| **Versiones externas exactas**       | Las dependencias externas del dashboard utilizan versiones explícitas.                      |
| **Estructura antes que complejidad** | No se incorporan funcionalidades que pertenecen a fases posteriores.                        |
| **Documentación local**              | Cada aplicación contiene su propio README.                                                  |
| **Validación reproducible**          | Las aplicaciones utilizan scripts estándar de `typecheck` y `build`.                        |

---

## 17. Artefactos creados

Los principales artefactos creados durante la Fase 5 fueron:

| Artefacto          | Tipo                      |
| :----------------- | :------------------------ |
| `apps/cli/`        | Aplicación CLI            |
| `apps/dashboard/`  | Aplicación web            |
| `apps/extensions/` | Base para extensiones IDE |

### CLI

```text
apps/cli/
├── src/index.ts
├── package.json
├── README.md
└── tsconfig.json
```

### Dashboard

```text
apps/dashboard/
├── src/App.tsx
├── src/index.css
├── src/main.tsx
├── src/vite-env.d.ts
├── index.html
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

### Extensions

```text
apps/extensions/
├── src/index.ts
├── package.json
├── README.md
└── tsconfig.json
```

Adicionalmente, la implementación requirió completar los artefactos de tipos y exports de:

```text
packages/config/vite/
```

para soportar correctamente el consumo de:

```text
@eq-labs/config-vite/react
```

---

## 18. Resultado de la implementación

La Fase 5 estableció el directorio `apps/` del Engineering Ecosystem con tres aplicaciones reconocidas como workspaces:

```text
@eq-labs/cli
@eq-labs/dashboard
@eq-labs/extensions
```

El resultado proporciona:

- un CLI funcional con salida `Hello World`;
- un dashboard React funcional;
- una base estructural para futuras extensiones de IDE;
- integración con la configuración TypeScript compartida;
- integración del dashboard con la configuración Vite compartida;
- scripts homogéneos de validación;
- documentación local para cada aplicación.

El dashboard fue compilado correctamente mediante Vite y produjo sus artefactos de producción.

Las tres aplicaciones pasaron correctamente la validación TypeScript y Build.

La fase no incorpora todavía funcionalidad de negocio ni capacidades avanzadas del Engineering Ecosystem.

---

## 19. Estado de la Fase

| Aspecto                        |    Estado-    |
| :----------------------------- | :-----------: |
| **Implementación**             | ✅ Completada |
| **Validación TypeScript**      | ✅ Completada |
| **Validación Build**           | ✅ Completada |
| **Integración con Workspaces** | ✅ Completada |
| **Documentación**              |  ✅ Borrador  |

La implementación y validación técnica de la Fase 5 fueron completadas correctamente.

El documento permanece en estado **Borrador** como documento técnico de implementación de fase.

---

## 20. Trazabilidad

| Elemento                          | Referencia                                                            |
| :-------------------------------- | :-------------------------------------------------------------------- |
| **Documento normativo padre**     | EE-DOC-006 — Repository Structure                                     |
| **Fase**                          | Fase 5 — Apps                                                         |
| **Implementación**                | EE-IMP-006-P05                                                        |
| **Dependencia de implementación** | EE-IMP-006-P04                                                        |
| **Apps creadas**                  | `apps/cli/`, `apps/dashboard/`, `apps/extensions/`                    |
| **CLI**                           | `@eq-labs/cli`                                                        |
| **Dashboard**                     | `@eq-labs/dashboard`                                                  |
| **Extensions**                    | `@eq-labs/extensions`                                                 |
| **Configuración TypeScript**      | `@eq-labs/config-typescript/node`, `@eq-labs/config-typescript/react` |
| **Configuración Vite**            | `@eq-labs/config-vite/react`                                          |
| **Workspace manager**             | pnpm                                                                  |
| **TypeScript**                    | 5.9.2                                                                 |
| **React**                         | 19.1.1                                                                |
| **Vite**                          | 7.1.3                                                                 |
| **Validación**                    | `pnpm install`, `pnpm -r typecheck`, `pnpm -r build`                  |
| **Documentación técnica**         | EE-IMP-006-P05                                                        |

---

## 21. Referencias

| Referencia         | Descripción                                                                                                                |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-006**     | _Repository Structure_ — documento normativo padre que define la estructura del repositorio y las fases de implementación. |
| **EE-IMP-006-P04** | _Core Packages Structure_ — documentación de la Fase 4 y de los paquetes principales creados previamente.                  |
| **EE-IMP-006-P03** | _Workspaces_ — documentación de la configuración de pnpm y workspaces utilizada como base para esta fase.                  |
| **EE-IMP-006-P02** | _Monorepo Shared Configuration_ — documentación de la configuración compartida utilizada por las aplicaciones.             |

---

## 22. Historial de cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                                                                                                               | Cambios                                                | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :----------- |
| **v1.0.0** | 2026-08-31 | Equipo de Arquitectura | Equipo de Arquitectura | Creación de EE-IMP-006-P05 y documentación de la implementación de `apps/cli`, `apps/dashboard` y `apps/extensions`. | Registrar la implementación y validación de la Fase 5. | **Aprobado** |

---

## **FIN DEL DOCUMENTO**
