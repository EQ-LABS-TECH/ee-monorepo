import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertDocIdUnique } from '../lib/plop-utils.mjs';

function fixture({ files = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ee-plop-utils-'));
  const docs = join(root, 'docs');
  mkdirSync(docs, { recursive: true });

  for (const [rel, content] of Object.entries(files)) {
    const full = join(docs, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }

  return { root, docs, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const metaDoc = (id, title = 'X') => `# ${id} — ${title}

| Campo | Valor |
| :---- | :---- |
| **ID** | ${id} |
| **Código corto** | ${id} |
`;

test('assertDocIdUnique: available id passes on empty docs/', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  assert.doesNotThrow(() => assertDocIdUnique('EE-DOC-020', f.docs));
});

test('assertDocIdUnique: existing filename with different title rejects', (t) => {
  const f = fixture({ files: { 'EE-DOC-020_OLD.md': metaDoc('EE-DOC-020', 'OLD') } });
  t.after(f.cleanup);
  assert.throws(() => assertDocIdUnique('EE-DOC-020', f.docs), /docId EE-DOC-020 already in use/);
});

test('assertDocIdUnique: same id in content with different filename rejects (ID field)', (t) => {
  const f = fixture({ files: { 'notas_viejas.md': metaDoc('EE-DOC-020', 'OLD') } });
  t.after(f.cleanup);
  assert.throws(
    () => assertDocIdUnique('EE-DOC-020', f.docs),
    /docId EE-DOC-020 already in use \(ID field\)/,
  );
});

test('assertDocIdUnique: recursive lookup across subfolders rejects', (t) => {
  const f = fixture({ files: { 'adr/EE-DOC-020_OLD.md': metaDoc('EE-DOC-020') } });
  t.after(f.cleanup);
  assert.throws(() => assertDocIdUnique('EE-DOC-020', f.docs), /docId EE-DOC-020 already in use/);
});

test('assertDocIdUnique: different id in same folder allows', (t) => {
  const f = fixture({ files: { 'EE-DOC-020_OLD.md': metaDoc('EE-DOC-020') } });
  t.after(f.cleanup);
  assert.doesNotThrow(() => assertDocIdUnique('EE-DOC-021', f.docs));
});

test('assertDocIdUnique: missing docs/ root allows (nothing to collide)', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-plop-utils-empty-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.doesNotThrow(() => assertDocIdUnique('EE-DOC-020', join(root, 'docs')));
});

test('assertDocIdUnique: read error fails closed (does not silently skip)', (t) => {
  const f = fixture({ files: { 'adr/EE-DOC-020_OLD.md': metaDoc('EE-DOC-020') } });
  t.after(() => {
    try {
      chmodSync(join(f.docs, 'adr'), 0o755);
    } catch {
      /* best effort */
    }
    f.cleanup();
  });

  // Only enforce on POSIX where chmod actually denies reads; Windows ignores it.
  if (process.platform === 'win32') {
    t.skip('chmod-based read-error simulation is POSIX-only');
    return;
  }

  chmodSync(join(f.docs, 'adr'), 0o000);
  assert.throws(
    () => assertDocIdUnique('EE-DOC-020', f.docs),
    /cannot read .* while checking docId EE-DOC-020/,
  );
});
