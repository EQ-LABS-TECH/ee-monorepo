import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const skills = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('ee-'))
  .map((entry) => entry.name)
  .sort();
const expected = [
  'ee-architecture-designer',
  'ee-change-governance',
  'ee-documentation-engineer',
  'ee-engineering-auditor',
  'ee-engineering-orchestrator',
  'ee-implementation-engineer',
  'ee-pr-reviewer',
  'ee-skill-maintainer',
  'ee-validation-engineer',
].sort();
assert.deepEqual(
  skills,
  expected,
  'El catálogo debe contener exactamente las nueve skills previstas',
);
assert.ok(existsSync(join(root, 'contract.md')));
assert.ok(existsSync(join(root, 'workflow.md')));
const names = new Set();
for (const skill of skills) {
  const skillFile = join(root, skill, 'SKILL.md');
  assert.ok(existsSync(skillFile), `${skill} necesita SKILL.md`);
  const content = readFileSync(skillFile, 'utf8');
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(fm, `${skill}: frontmatter YAML ausente`);
  assert.match(fm[1], new RegExp(`^name:\\s*${skill}$`, 'm'));
  assert.match(fm[1], /^description:\s*\S.+$/m);
  assert.ok(!names.has(skill), `${skill}: nombre repetido`);
  names.add(skill);
  const refs = [...content.matchAll(/(?:references|assets)\/([\w.-]+\.md)/g)];
  for (const [, file] of refs) {
    const subfolder = content.includes(`assets/${file}`) ? 'assets' : 'references';
    assert.ok(
      existsSync(join(root, skill, subfolder, file)),
      `${skill}: referencia inexistente ${subfolder}/${file}`,
    );
  }
  assert.ok(
    existsSync(join(root, skill, 'references', 'execution-contract.md')),
    `${skill}: falta contrato portable`,
  );
}
const workflow = readFileSync(join(root, 'workflow.md'), 'utf8');
for (const skill of expected)
  assert.ok(
    workflow.includes(skill) ||
      ['ee-skill-maintainer', 'ee-engineering-orchestrator'].includes(skill),
    `Falta ${skill}`,
  );
assert.match(workflow, /ee-skill-maintainer/);
const contract = readFileSync(join(root, 'contract.md'), 'utf8');
for (const term of [
  'LOCAL_WRITE',
  'ARTIFACT_EXPORT',
  'Paquetes_Archivos_Monorepo.md',
  'base_sha256',
  'manifest.json',
]) {
  assert.ok(contract.includes(term), `Contrato omite ${term}`);
}
console.log(
  `PASS: ${skills.length} skills, frontmatter, referencias y contrato estructural verificados`,
);
