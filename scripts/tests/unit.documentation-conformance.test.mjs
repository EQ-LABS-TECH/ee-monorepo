import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  inspectGovernedDocument,
  scanDocumentationCorpus,
} from '../lib/documentation-conformance.mjs';

function documentFixture({
  id = 'EE-DOC-001',
  shortCode = 'DOC-001',
  status = 'Aprobado',
  nextReview = '2027-05-04',
  heading = '## 01. Propósito',
  historyHeader = '| Versión | Fecha | Autor | Aprobado por | Motivo | Cambios | Estado |',
  historyRow = '| v1.0.0 | 2026-01-01 | Equipo | Equipo | Creación | Versión inicial | Aprobado |',
} = {}) {
  return [
    '# EE-DOC-001 — Example',
    '',
    '## METADATOS',
    '',
    '| Campo | Valor |',
    '| ----- | ----- |',
    `| **ID** | ${id} |`,
    `| **Código corto** | ${shortCode} |`,
    `| **Estado** | ${status} |`,
    `| **Próxima revisión** | ${nextReview} |`,
    '',
    heading,
    '',
    'Contenido.',
    '',
    '## 02. Historial de Cambios',
    '',
    historyHeader,
    '| ------- | ---------- | ----- | ------------ | ------ | ------- | ------ |',
    historyRow,
    '',
  ].join('\n');
}

test('accepts a document matching the deterministic PA-001 baseline checks', () => {
  assert.deepEqual(
    inspectGovernedDocument('docs/architecture/EE-DOC-001_Example.md', documentFixture()),
    [],
  );
});

test('reports ID, short-code, frozen-review, and section-number findings', () => {
  const findings = inspectGovernedDocument(
    'docs/architecture/EE-DOC-001_Example.md',
    documentFixture({
      shortCode: 'EE-DOC-001',
      status: 'Congelado',
      nextReview: '2027-05-04',
      heading: '## 1. Propósito',
    }),
  );

  assert.deepEqual(
    findings.map(({ code }) => code),
    [
      'metadata-short-code-mismatch',
      'frozen-review-value-invalid',
      'section-number-format-invalid',
    ],
  );
});

test('accepts a frozen review value with a parenthetical clarification', () => {
  assert.deepEqual(
    inspectGovernedDocument(
      'docs/architecture/EE-DOC-001_Example.md',
      documentFixture({
        status: 'Congelado',
        nextReview: 'No aplica — Documento Congelado (cambio solo vía RFC)',
      }),
    ),
    [],
  );
});

test('checks nested headings against the two-digit section prefix', () => {
  const findings = inspectGovernedDocument(
    'docs/architecture/EE-DOC-001_Example.md',
    documentFixture({ heading: '### 4.1. Alcance' }),
  );

  assert.deepEqual(
    findings.map(({ code }) => code),
    ['section-number-format-invalid'],
  );
});

test('reports malformed history rows and change text over 230 visible characters', () => {
  const findings = inspectGovernedDocument(
    'docs/architecture/EE-DOC-001_Example.md',
    documentFixture({
      historyRow: `| v1.0.0 | 2026-01-01 | Equipo | Equipo | ${'m'.repeat(120)} | ${'c'.repeat(120)} | Aprobado | extra |`,
    }),
  );

  assert.deepEqual(
    findings.map(({ code }) => code),
    ['change-history-row-column-count'],
  );

  const longHistory = documentFixture({
    historyRow: `| v1.0.0 | 2026-01-01 | Equipo | Equipo | ${'m'.repeat(120)} | ${'c'.repeat(120)} | Aprobado |`,
  });
  assert.equal(
    inspectGovernedDocument('docs/architecture/EE-DOC-001_Example.md', longHistory)[0].code,
    'change-history-text-too-long',
  );
});

test('scans core governed documents and reports deferred VAL/WAIVE coverage', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-documentation-baseline-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const architecture = join(root, 'docs', 'architecture');
  const validation = join(root, 'docs', 'validation', 'waivers');
  mkdirSync(architecture, { recursive: true });
  mkdirSync(validation, { recursive: true });
  writeFileSync(join(architecture, 'EE-DOC-001_Example.md'), documentFixture());
  writeFileSync(join(validation, 'EE-WAIVE-QG-001_example_20261105.md'), 'special format');

  assert.deepEqual(scanDocumentationCorpus(root), {
    filesScanned: 1,
    specialFilesDeferred: 1,
    findings: [],
  });
});
