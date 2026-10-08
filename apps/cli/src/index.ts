#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createAiRoot } from './composition/ai-root.js';
import { createKnowledgeRoot } from './composition/knowledge-root.js';

const ALLOWED = new Set([
  'doctor',
  'validate',
  'lint',
  'typecheck',
  'test',
  'build',
  'format',
  'bootstrap',
  'clean',
]);

function printHelp(): void {
  console.log(`@eq-labs/cli — Engineering Ecosystem DX facade (EE-DOC-011 §06)

Usage:
  ee help
  ee run <root-command>
  ee composition

Root commands are the canonical automation surface (pnpm run <cmd>).
This CLI does not reimplement Quality Gates.

Delegable commands:
  ${[...ALLOWED].join(', ')}

composition — invoke apps/cli composition root (EE-DOC-006 §13.5 / EE-DOC-015 §05.2.2)
`);
}

function runRoot(cmd: string): number {
  if (!ALLOWED.has(cmd)) {
    console.error(`Unknown or non-delegable command: ${cmd}`);
    printHelp();
    return 1;
  }
  const result = spawnSync('pnpm', ['run', cmd], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: process.cwd(),
  });
  return result.status ?? 1;
}

/** Composition root effective: factory invoked from runtime entrypoint. */
function runComposition(): number {
  const ai = createAiRoot();
  const knowledge = createKnowledgeRoot();
  console.log(
    JSON.stringify(
      {
        compositionRoot: 'apps/cli',
        aiRootId: ai.rootId,
        defaultProvider: 'noop',
        knowledgePortVersion: knowledge.portVersion,
        status: 'wired',
      },
      null,
      2,
    ),
  );
  return 0;
}

const args = process.argv.slice(2);
const [verb, target] = args;

if (!verb || verb === 'help' || verb === '--help' || verb === '-h') {
  printHelp();
  process.exit(0);
}

if (verb === 'composition') {
  process.exit(runComposition());
}

if (verb === 'run' && target) {
  process.exit(runRoot(target));
}

console.error(`Unknown usage: ${args.join(' ')}`);
printHelp();
process.exit(1);
