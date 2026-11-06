import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateTemplates } from '../lib/validate-templates.mjs';

const SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'id',
    'name',
    'category',
    'version',
    'description',
    'target',
    'owner',
    'locale',
    'allowedTargets',
    'inputs',
    'outputs',
  ],
  properties: {
    schemaVersion: { type: 'string', const: '1' },
    id: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    name: { type: 'string', minLength: 1 },
    category: { type: 'string', enum: ['T-DOC', 'T-PKG', 'T-APP', 'T-CON'] },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    description: { type: 'string', minLength: 1 },
    target: { type: 'string', minLength: 1 },
    owner: { type: 'string', minLength: 1 },
    locale: { type: 'string', enum: ['es', 'en'] },
    allowedTargets: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
    inputs: { type: 'array', items: { type: 'object' } },
    outputs: { type: 'array', items: { type: 'string', minLength: 1 } },
  },
};

function validMeta(overrides = {}) {
  return {
    schemaVersion: '1',
    id: 'sample',
    name: 'Sample',
    category: 'T-PKG',
    version: '0.1.0',
    description: 'sample',
    target: 'packages/',
    owner: 'architecture',
    locale: 'en',
    allowedTargets: ['packages/'],
    inputs: [{ name: 'name', type: 'string', required: true }],
    outputs: ['README.md'],
    ...overrides,
  };
}

function fixture({ dir = 'package', id = 'sample', meta = {}, hbsFiles = ['README.md.hbs'] } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ee-tpl-val-'));
  const templatesRoot = join(root, 'templates');
  mkdirSync(templatesRoot, { recursive: true });
  writeFileSync(join(templatesRoot, 'template.schema.json'), JSON.stringify(SCHEMA));
  for (const d of ['document', 'package', 'app', 'connector']) {
    mkdirSync(join(templatesRoot, d), { recursive: true });
  }
  const tplDir = join(templatesRoot, dir, id);
  mkdirSync(join(tplDir, 'files'), { recursive: true });
  writeFileSync(join(tplDir, 'template.json'), JSON.stringify(validMeta({ id, ...meta })));
  for (const hbs of hbsFiles) writeFileSync(join(tplDir, 'files', hbs), '// template');
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

test('valid template passes schema and outputs check', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const { errors, warnings } = validateTemplates({ root: f.root });
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('missing template.schema.json is reported', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  rmSync(join(f.root, 'templates', 'template.schema.json'));
  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((e) => e.includes('missing templates/template.schema.json')));
});

test('schema violation: invalid version (SemVer)', (t) => {
  const f = fixture({ meta: { version: '0.1' } });
  t.after(f.cleanup);
  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((e) => e.includes('/version') && /must match pattern/.test(e)));
});

test('schema violation: invalid id pattern', (t) => {
  const f = fixture({ id: 'UPPER_CASE', meta: { id: 'UPPER_CASE' } });
  t.after(f.cleanup);
  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((e) => e.includes('/id') && /must match pattern/.test(e)));
});

test('schema violation: missing required key', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const metaPath = join(f.root, 'templates', 'package', 'sample', 'template.json');
  const data = JSON.parse(readFileSync(metaPath, 'utf8'));
  delete data.description;
  writeFileSync(metaPath, JSON.stringify(data));
  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((e) => /must have required property 'description'/.test(e)));
});

test('category mismatch between folder and template.json', (t) => {
  const f = fixture({ meta: { category: 'T-APP' } });
  t.after(f.cleanup);
  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((e) => /category "T-APP" != T-PKG/.test(e)));
});

test('output without matching .hbs file is reported', (t) => {
  const f = fixture({
    meta: { outputs: ['README.md', 'missing.md'] },
    hbsFiles: ['README.md.hbs'],
  });
  t.after(f.cleanup);
  const { errors } = validateTemplates({ root: f.root });
  assert.ok(
    errors.some((e) => e.includes('output "missing.md" has no "missing.md.hbs" under files/')),
  );
});

test('rejects unsafe output paths', (t) => {
  const f = fixture({ meta: { outputs: ['../outside'] } });
  t.after(f.cleanup);

  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((error) => error.includes('output path is unsafe')));
});

test('reports undeclared Handlebars variables, including conditional inputs', (t) => {
  const f = fixture({ meta: { inputs: [{ name: 'name', type: 'string' }] } });
  t.after(f.cleanup);
  writeFileSync(
    join(f.root, 'templates', 'package', 'sample', 'files', 'README.md.hbs'),
    '{{#if optionalTitle}}{{optionalTitle}}{{/if}}{{name}}',
  );

  const { errors } = validateTemplates({ root: f.root });
  assert.ok(
    errors.some((error) => error.includes('template variable "optionalTitle" is not declared')),
  );
  assert.ok(!errors.some((error) => error.includes('template variable "name" is not declared')));
});

test('requires every .hbs file to be declared in outputs', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(
    join(f.root, 'templates', 'package', 'sample', 'files', 'extra.txt.hbs'),
    'extra template',
  );

  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((error) => error.includes('extra.txt.hbs" is not declared in outputs')));
});

test('duplicate template ids across categories are reported', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-tpl-dup-'));
  const templatesRoot = join(root, 'templates');
  mkdirSync(templatesRoot, { recursive: true });
  writeFileSync(join(templatesRoot, 'template.schema.json'), JSON.stringify(SCHEMA));
  for (const d of ['document', 'package', 'app', 'connector']) {
    mkdirSync(join(templatesRoot, d), { recursive: true });
  }
  for (const [dir, cat] of [
    ['package', 'T-PKG'],
    ['app', 'T-APP'],
  ]) {
    const tplDir = join(templatesRoot, dir, 'dup');
    mkdirSync(join(tplDir, 'files'), { recursive: true });
    writeFileSync(
      join(tplDir, 'template.json'),
      JSON.stringify(validMeta({ id: 'dup', category: cat, outputs: ['README.md'] })),
    );
    writeFileSync(join(tplDir, 'files', 'README.md.hbs'), '// template');
  }
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { errors } = validateTemplates({ root });
  assert.ok(errors.some((e) => e.includes('duplicate template id "dup"')));
});

test('ignores category directories that do not have template markers', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const unrelated = join(f.root, 'templates', 'package', 'notes');
  mkdirSync(unrelated);
  writeFileSync(join(unrelated, 'README.md'), 'Not a template.');

  assert.deepEqual(validateTemplates({ root: f.root }).errors, []);
});

test('reports a template candidate with files but no template.json', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const candidateFiles = join(f.root, 'templates', 'package', 'incomplete', 'files');
  mkdirSync(candidateFiles, { recursive: true });
  writeFileSync(join(candidateFiles, 'README.md.hbs'), 'template');

  const { errors } = validateTemplates({ root: f.root });
  assert.ok(
    errors.some(
      (error) => error.includes('package/incomplete/') && error.includes('template.json'),
    ),
  );
});

test('reports a valid template metadata directory without files/', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  rmSync(join(f.root, 'templates', 'package', 'sample', 'files'), { recursive: true });

  const { errors } = validateTemplates({ root: f.root });
  assert.ok(
    errors.some((error) => error.includes('package/sample/') && error.includes('missing files/')),
  );
});

test('reports category read failures instead of silently skipping them', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const categoryPath = join(f.root, 'templates', 'package');
  const fsImpl = {
    statSync: fs.statSync,
    readFileSync: fs.readFileSync,
    readdirSync(path, options) {
      if (path === categoryPath)
        throw Object.assign(new Error('access denied'), { code: 'EACCES' });
      return fs.readdirSync(path, options);
    },
  };

  const { errors } = validateTemplates({ root: f.root, fsImpl });
  assert.ok(
    errors.some(
      (error) =>
        error.includes('cannot read templates/package/') && error.includes('access denied'),
    ),
  );
});

test('reports metadata stat and read failures', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const metaPath = join(f.root, 'templates', 'package', 'sample', 'template.json');
  const fsImpl = {
    statSync(path) {
      if (path === metaPath) throw Object.assign(new Error('access denied'), { code: 'EACCES' });
      return fs.statSync(path);
    },
    readFileSync(path, encoding) {
      if (path === metaPath) throw Object.assign(new Error('read denied'), { code: 'EACCES' });
      return fs.readFileSync(path, encoding);
    },
    readdirSync: fs.readdirSync,
  };

  const { errors } = validateTemplates({ root: f.root, fsImpl });
  assert.ok(
    errors.some((error) => error.includes('cannot inspect templates/package/sample/template.json')),
  );
});

test('reports metadata read failures instead of omitting the candidate', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const metaPath = join(f.root, 'templates', 'package', 'sample', 'template.json');
  const fsImpl = {
    statSync: fs.statSync,
    readdirSync: fs.readdirSync,
    readFileSync(path, encoding) {
      if (path === metaPath) throw Object.assign(new Error('read denied'), { code: 'EACCES' });
      return fs.readFileSync(path, encoding);
    },
  };

  const { errors } = validateTemplates({ root: f.root, fsImpl });
  assert.ok(errors.some((error) => error.includes('cannot read package/sample/template.json')));
});

test('rejects files/ when it is a file instead of a directory', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const filesDir = join(f.root, 'templates', 'package', 'sample', 'files');
  rmSync(filesDir, { recursive: true });
  writeFileSync(filesDir, 'not a directory');

  const { errors } = validateTemplates({ root: f.root });
  assert.ok(errors.some((error) => error.includes('package/sample/files is not a directory')));
});

// --- M-06a regression: real repo templates ---

test('real repo T-DOC templates pass schema and outputs check', () => {
  const root = process.cwd();
  const { errors } = validateTemplates({ root });
  const tdocIds = ['ee-doc', 'ee-adr', 'ee-imp', 'ee-rfc', 'ee-tec'];
  const tdocErrors = errors.filter((e) => tdocIds.some((id) => e.includes(`/${id}`)));
  assert.deepEqual(
    tdocErrors,
    [],
    `T-DOC templates must not produce errors: ${tdocErrors.join('\n')}`,
  );
});

test('real repo ee-imp and ee-tec outputs match their .hbs files (M-06a fix)', () => {
  const root = process.cwd();
  const { errors } = validateTemplates({ root });
  // Regression guard: if someone reverts outputs to "body.md", this fails.
  assert.ok(
    !errors.some((e) => e.includes('ee-imp') && e.includes('body.md')),
    'ee-imp outputs must not point to body.md',
  );
  assert.ok(
    !errors.some((e) => e.includes('ee-tec') && e.includes('body.md')),
    'ee-tec outputs must not point to body.md',
  );
});
