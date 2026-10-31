import { readdirSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const CODE_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs']);
const IGNORED_DIRECTORIES = new Set([
  '.tmp',
  '.turbo',
  'bin',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

function discoverScriptFiles(scriptsRoot) {
  const files = [];

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) visit(path);
        continue;
      }

      if (!entry.isFile()) continue;

      const relativePath = relative(scriptsRoot, path).replaceAll('\\', '/');
      const extension = relativePath.slice(relativePath.lastIndexOf('.'));
      const isCommandEntrypoint =
        relativePath.startsWith('commands/') &&
        !relativePath.slice('commands/'.length).includes('.');

      if (CODE_EXTENSIONS.has(extension) || isCommandEntrypoint) files.push(path);
    }
  }

  visit(scriptsRoot);
  return files.sort();
}

function renderMessages(results, cwd) {
  const lines = [];

  for (const result of results) {
    for (const message of result.messages ?? []) {
      if (message.severity !== 2) continue;
      const location = message.line ? `:${message.line}:${message.column ?? 1}` : '';
      lines.push(`${relative(cwd, result.filePath)}${location}: error: ${message.message}`);
    }
  }

  return lines;
}

export function lintScripts({
  cwd = process.cwd(),
  env = process.env,
  spawnSyncImpl = spawnSync,
  writeOut = (value) => process.stdout.write(value),
  writeErr = (value) => process.stderr.write(value),
} = {}) {
  const scriptsRoot = resolve(cwd, 'scripts');
  const runnerPath = resolve(scriptsRoot, 'lib/run-eslint-scripts.mjs');
  const files = discoverScriptFiles(scriptsRoot);

  if (files.length === 0) {
    return { status: 'ERROR', detail: 'No script source files were discovered.' };
  }

  const result = spawnSyncImpl(process.execPath, [runnerPath], {
    encoding: 'utf-8',
    cwd,
    env,
    input: JSON.stringify(files),
  });

  if (result.error) {
    return { status: 'ERROR', detail: `Unable to start ESLint: ${result.error.message}` };
  }

  let reports;

  try {
    reports = JSON.parse(result.stdout ?? '');
  } catch {
    if (result.stderr) writeErr(result.stderr);
    return { status: 'ERROR', detail: 'ESLint did not return valid JSON evidence.' };
  }

  if (!Array.isArray(reports)) {
    return { status: 'ERROR', detail: 'ESLint evidence is not a result list.' };
  }

  const reportedFiles = new Set(
    reports.map((report) => resolve(cwd, report.filePath)).filter(isAbsolute),
  );
  const missingFiles = files.filter((file) => !reportedFiles.has(file));

  if (missingFiles.length > 0) {
    return {
      status: 'ERROR',
      detail: `ESLint omitted ${missingFiles.length} discovered script file(s).`,
    };
  }

  const errors = reports.reduce((total, report) => total + (report.errorCount ?? 0), 0);
  const warnings = reports.reduce((total, report) => total + (report.warningCount ?? 0), 0);
  const messages = renderMessages(reports, cwd);

  if (result.status !== 0 || errors > 0) {
    for (const message of messages) writeOut(`${message}\n`);
    if (result.stderr) writeErr(result.stderr);

    return {
      status: 'FAIL',
      detail: `ESLint found ${errors} error(s) across ${files.length} script file(s).`,
    };
  }

  writeOut(`ESLint scripts: checked ${files.length} file(s), ${warnings} warning(s).\n`);
  return { status: 'PASS', detail: `${files.length} script file(s) linted.` };
}
