#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();

const ESLINT_VERSION = "9.35.0";
const CONFIG_PACKAGE = "@eq-labs/config-eslint";

const TYPESCRIPT_WORKSPACES = [
  "apps/cli",
  "apps/dashboard",
  "apps/extensions",

  "connectors/official/a2a",
  "connectors/official/docker",
  "connectors/official/github",
  "connectors/official/kubernetes",
  "connectors/official/mcp",
  "connectors/official/notebooklm",

  "packages/config/typescript",
  "packages/config/vite",

  "packages/foundation",
  "packages/shared",
  "packages/execution",
  "packages/intelligence",
  "packages/knowledge",
  "packages/governance",
  "packages/integration",
  "packages/registry",
  "packages/sdk",
];

const JAVASCRIPT_WORKSPACES = [
  "packages/config/jest",
  "packages/config/prettier",
  "packages/config/vitest",
];

const ESLINT_WORKSPACE = "packages/config/eslint";

function packagePath(workspace) {
  return join(ROOT, workspace, "package.json");
}

function configPath(workspace) {
  return join(ROOT, workspace, "eslint.config.mjs");
}

function readPackage(workspace) {
  const file = packagePath(workspace);

  if (!existsSync(file)) {
    throw new Error(`Missing package.json: ${workspace}/package.json`);
  }

  return JSON.parse(readFileSync(file, "utf8"));
}

function writePackage(workspace, pkg) {
  const file = packagePath(workspace);

  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function writeConfig(workspace, type) {
  const file = configPath(workspace);

  mkdirSync(dirname(file), { recursive: true });

  const content =
    type === "typescript"
      ? `import typescript from '@eq-labs/config-eslint/typescript';

export default typescript;
`
      : `import base from '@eq-labs/config-eslint/base';

export default base;
`;

  writeFileSync(file, content, "utf8");
}

function configureWorkspace(workspace, type) {
  const pkg = readPackage(workspace);

  pkg.scripts ??= {};
  pkg.devDependencies ??= {};

  pkg.scripts.lint = "eslint .";

  pkg.devDependencies.eslint = ESLINT_VERSION;

  if (workspace !== ESLINT_WORKSPACE) {
    pkg.devDependencies[CONFIG_PACKAGE] = "workspace:*";
  }

  writePackage(workspace, pkg);

  writeConfig(workspace, type);

  console.log(`  ✓ ${workspace}`);
}

function configureEslintPackage() {
  const pkg = readPackage(ESLINT_WORKSPACE);

  pkg.scripts ??= {};
  pkg.devDependencies ??= {};

  pkg.scripts.lint = "eslint .";

  pkg.devDependencies.eslint = ESLINT_VERSION;

  delete pkg.devDependencies[CONFIG_PACKAGE];

  writePackage(ESLINT_WORKSPACE, pkg);

  writeConfig(ESLINT_WORKSPACE, "javascript");

  console.log(`  ✓ ${ESLINT_WORKSPACE}`);
}

function validateWorkspaceSet() {
  const workspaces = [
    ...TYPESCRIPT_WORKSPACES,
    ...JAVASCRIPT_WORKSPACES,
    ESLINT_WORKSPACE,
  ];

  const duplicates = workspaces.filter(
    (workspace, index) => workspaces.indexOf(workspace) !== index,
  );

  if (duplicates.length > 0) {
    throw new Error(`Duplicate workspace detected: ${duplicates.join(", ")}`);
  }

  for (const workspace of workspaces) {
    if (!existsSync(packagePath(workspace))) {
      throw new Error(`Workspace does not exist: ${workspace}`);
    }
  }
}

function main() {
  console.log("🔧 Configuring Engineering Ecosystem linting");
  console.log("===========================================");
  console.log("");

  validateWorkspaceSet();

  console.log("📘 TypeScript workspaces");

  for (const workspace of TYPESCRIPT_WORKSPACES) {
    configureWorkspace(workspace, "typescript");
  }

  console.log("");

  console.log("📘 JavaScript/ESM workspaces");

  for (const workspace of JAVASCRIPT_WORKSPACES) {
    configureWorkspace(workspace, "javascript");
  }

  console.log("");

  console.log("📘 ESLint configuration workspace");

  configureEslintPackage();

  console.log("");

  console.log("✅ Lint configuration completed.");
  console.log("");
  console.log(`ESLint version: ${ESLINT_VERSION}`);
  console.log(`Shared configuration: ${CONFIG_PACKAGE}`);
  console.log("");
}

try {
  main();
} catch (error) {
  console.error("");
  console.error("❌ Lint configuration failed.");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("");

  process.exit(1);
}
