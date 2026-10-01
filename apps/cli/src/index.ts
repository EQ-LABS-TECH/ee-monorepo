#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const ALLOWED = new Set([
  "doctor",
  "validate",
  "lint",
  "typecheck",
  "test",
  "build",
  "format",
  "bootstrap",
  "clean",
]);

function printHelp(): void {
  console.log(`@eq-labs/cli — Engineering Ecosystem DX facade (EE-DOC-011 §06)

Usage:
  ee help
  ee run <root-command>

Root commands are the canonical automation surface (pnpm run <cmd>).
This CLI does not reimplement Quality Gates.

Delegable commands:
  ${[...ALLOWED].join(", ")}
`);
}

function runRoot(cmd: string): number {
  if (!ALLOWED.has(cmd)) {
    console.error(`Unknown or non-delegable command: ${cmd}`);
    printHelp();
    return 1;
  }
  const result = spawnSync("pnpm", ["run", cmd], {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: process.cwd(),
  });
  return result.status ?? 1;
}

const args = process.argv.slice(2);
const [verb, target] = args;

if (!verb || verb === "help" || verb === "--help" || verb === "-h") {
  printHelp();
  process.exit(0);
}

if (verb === "run" && target) {
  process.exit(runRoot(target));
}

console.error(`Unknown usage: ${args.join(" ")}`);
printHelp();
process.exit(1);
