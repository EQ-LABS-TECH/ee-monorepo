#!/usr/bin/env node

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const require = createRequire(resolve(root, 'packages/governance/package.json'));
const { ESLint } = require('eslint');
const configPath = resolve(root, 'scripts/eslint.config.mjs');

async function main() {
  const files = JSON.parse(readFileSync(0, 'utf8'));

  if (
    !Array.isArray(files) ||
    files.length === 0 ||
    files.some((file) => typeof file !== 'string')
  ) {
    throw new TypeError('Invalid script lint input.');
  }

  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: configPath,
  });
  const extensionless = files.filter((file) => !/\.[^/\\]+$/.test(file));
  const regularFiles = files.filter((file) => !extensionless.includes(file));
  const reports = await eslint.lintFiles(regularFiles);

  for (const filePath of extensionless) {
    const source = readFileSync(filePath, 'utf8');
    const virtualPath = `${filePath}.mjs`;
    const [report] = await eslint.lintText(source, { filePath: virtualPath });
    reports.push({ ...report, filePath });
  }

  process.stdout.write(JSON.stringify(reports));
}

main().catch((error) => {
  console.error(`Script ESLint runner failed: ${error.name}`);
  process.exitCode = 1;
});
