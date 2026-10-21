import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WRAPPER_PATH = resolve(HERE, '..', 'commands', 'generate');

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'ee-generate-fixture-'));
  const scriptsDir = join(root, 'scripts');
  const templatesDir = join(root, 'templates', 'document', 'mock');
  const filesDir = join(templatesDir, 'files');
  const docsDir = join(root, 'docs', 'mock');

  mkdirSync(scriptsDir, { recursive: true });
  mkdirSync(filesDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });

  // El plopfile define su propio ROOT — no hereda el del wrapper.
  const plopfileContent = `
import { join } from 'node:path';

const ROOT = process.cwd();

export default function (plop) {
  plop.setGenerator('mock-gen', {
    description: 'Mock generator for regression test',
    prompts: [
      { type: 'input', name: 'testId', message: 'Test ID:' },
      { type: 'input', name: 'testTitle', message: 'Title:' }
    ],
    actions(data) {
      if (!data.testId || !data.testTitle) {
        throw new Error('Missing required args in actions context');
      }
      return [{
        type: 'add',
        path: join(ROOT, 'docs', 'mock', \`\${data.testId}_\${data.testTitle}.md\`),
        templateFile: join(ROOT, 'templates', 'document', 'mock', 'files', 'mock.md.hbs'),
        data: { ...data }
      }];
    }
  });
}
`;

  writeFileSync(join(scriptsDir, 'plopfile.mjs'), plopfileContent);

  const hbsContent = `# {{testId}} — {{testTitle}}\n\nEste es un mock generado por el test.\n`;
  writeFileSync(join(filesDir, 'mock.md.hbs'), hbsContent);

  return {
    root,
    docsDir,
    cleanup: () => {
      if (existsSync(root)) rmSync(root, { recursive: true, force: true });
    },
  };
}

test('generate-command: passes named args non-interactively and creates file', (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);

  const result = spawnSync(
    process.execPath,
    [WRAPPER_PATH, 'mock-gen', '--testId=MOCK-001', '--testTitle=REGRESSION'],
    {
      cwd: fixture.root,
      encoding: 'utf8',
    },
  );

  assert.equal(
    result.status,
    0,
    `Wrapper failed with exit ${result.status}:\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
  );

  const expectedFile = join(fixture.docsDir, 'MOCK-001_REGRESSION.md');
  assert.ok(existsSync(expectedFile), `El archivo no fue generado en ${expectedFile}`);

  const content = readFileSync(expectedFile, 'utf8');
  assert.match(content, /# MOCK-001 — REGRESSION/);
});

test('generate-command: propagates non-zero exit code from generator errors', (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);

  const failingPlopfile = `
export default function (plop) {
  plop.setGenerator('failing-gen', {
    description: 'Always fails',
    prompts: [],
    actions() {
      throw new Error('Forced failure for test');
    }
  });
}
`;
  writeFileSync(join(fixture.root, 'scripts', 'plopfile.mjs'), failingPlopfile);

  const result = spawnSync(process.execPath, [WRAPPER_PATH, 'failing-gen'], {
    cwd: fixture.root,
    encoding: 'utf8',
  });

  // Plop captura el throw y lo muestra como [ERROR] <mensaje>, pero el exit
  // code sí se propaga vía process.exitCode. Verificamos ambos.
  assert.notEqual(
    result.status,
    0,
    `El wrapper debe propagar exit != 0. Obtenido: ${result.status}\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
  );

  const output = (result.stdout || '') + (result.stderr || '');
  assert.match(output, /Forced failure for test/);
});
