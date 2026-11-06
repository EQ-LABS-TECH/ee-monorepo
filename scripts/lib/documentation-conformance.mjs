import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const GOVERNED_CORE_DOCUMENT = /^EE-(?:DOC|ADR|RFC|IMP|TEC)-.+\.md$/;
const GOVERNED_SPECIAL_DOCUMENT = /^EE-(?:VAL|WAIVE)-.+\.md$/;
const FROZEN_REVIEW_VALUE = 'No aplica — Documento Congelado';

function stripMarkdown(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\\([\\|])/g, '$1')
    .trim();
}

function splitTableRow(line) {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);

  const cells = [];
  let cell = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '\\' && value[index + 1] === '|') {
      cell += '|';
      index += 1;
    } else if (character === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function metadataFields(lines) {
  const headingIndex = lines.findIndex((line) => /^##\s+METADATOS\s*$/i.test(line.trim()));
  if (headingIndex < 0) return null;

  const fields = new Map();
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^#{1,6}\s/.test(line)) break;
    if (!/^\s*\|/.test(line)) continue;
    const cells = splitTableRow(line);
    if (cells.length < 2) continue;
    const label = stripMarkdown(cells[0]);
    if (label && label.toLowerCase() !== 'campo') fields.set(label.toLowerCase(), cells[1]);
  }
  return fields;
}

function findHistoryTable(lines) {
  const headingIndex = lines.findIndex((line) =>
    /^#{2,6}\s+.*historial de cambios\b/i.test(line.trim()),
  );
  if (headingIndex < 0) return { headingIndex: -1, rows: [] };

  const headingLevel = /^#+/.exec(lines[headingIndex].trim())[0].length;
  let tableStart = -1;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const nextHeading = /^(#{1,6})\s/.exec(lines[index].trim());
    if (nextHeading && nextHeading[1].length <= headingLevel) break;
    if (!/^\s*\|/.test(lines[index])) continue;

    const cells = splitTableRow(lines[index]);
    const firstCell = stripMarkdown(cells[0]).toLowerCase();
    const secondCell = stripMarkdown(cells[1] ?? '').toLowerCase();
    const thirdCell = stripMarkdown(cells[2] ?? '').toLowerCase();
    if (
      (firstCell === 'versión' || firstCell === 'version') &&
      secondCell === 'fecha' &&
      thirdCell === 'autor'
    ) {
      tableStart = index;
      break;
    }
  }
  if (tableStart < 0) return { headingIndex, rows: [] };

  const rows = [];
  for (let index = tableStart; index < lines.length; index += 1) {
    const nextHeading = /^(#{1,6})\s/.exec(lines[index].trim());
    if (nextHeading && nextHeading[1].length <= headingLevel) break;
    if (/^\s*\|/.test(lines[index])) {
      rows.push({ line: index + 1, cells: splitTableRow(lines[index]) });
    } else if (rows.length > 0) {
      break;
    }
  }
  return { headingIndex, rows };
}

function pushFinding(findings, path, line, code, detail) {
  findings.push({ path, ...(line ? { line } : {}), code, detail });
}

export function inspectGovernedDocument(path, content) {
  if (typeof path !== 'string' || typeof content !== 'string') {
    throw new TypeError('Document path and content must be strings');
  }

  const normalizedPath = path.replaceAll('\\', '/');
  const lines = content.split(/\r?\n/);
  const findings = [];
  const fields = metadataFields(lines);

  if (!fields) {
    pushFinding(
      findings,
      normalizedPath,
      undefined,
      'metadata-section-missing',
      'No ## METADATOS section was found.',
    );
  } else {
    const id = stripMarkdown(fields.get('id') ?? '');
    const shortCode = stripMarkdown(fields.get('código corto') ?? fields.get('codigo corto') ?? '');
    const status = stripMarkdown(fields.get('estado') ?? '');
    const nextReview = stripMarkdown(
      fields.get('próxima revisión') ?? fields.get('proxima revision') ?? '',
    );

    if (!id) {
      pushFinding(
        findings,
        normalizedPath,
        undefined,
        'metadata-id-missing',
        'Metadata field ID is missing.',
      );
    } else if (!basename(normalizedPath).startsWith(`${id}_`)) {
      pushFinding(
        findings,
        normalizedPath,
        undefined,
        'document-id-filename-mismatch',
        `Filename must begin with ${id}_.`,
      );
    }

    if (!shortCode) {
      pushFinding(
        findings,
        normalizedPath,
        undefined,
        'metadata-short-code-missing',
        'Metadata field Código corto is missing.',
      );
    } else if (id && shortCode !== id.replace(/^EE-/, '')) {
      pushFinding(
        findings,
        normalizedPath,
        undefined,
        'metadata-short-code-mismatch',
        `Código corto must equal ${id.replace(/^EE-/, '')}.`,
      );
    }

    if (
      status.toLowerCase() === 'congelado' &&
      !(nextReview === FROZEN_REVIEW_VALUE || nextReview.startsWith(`${FROZEN_REVIEW_VALUE} (`))
    ) {
      pushFinding(
        findings,
        normalizedPath,
        undefined,
        'frozen-review-value-invalid',
        `Próxima revisión must be exactly “${FROZEN_REVIEW_VALUE}” when Estado is Congelado.`,
      );
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(#{2,4})\s+(\S.*)$/.exec(lines[index].trim());
    if (!heading || /^##\s+METADATOS\s*$/i.test(lines[index].trim())) continue;
    const [, marks, title] = heading;
    if (!/^\d/.test(title)) continue;

    const numbered = /^(\d+(?:\.\d+)*)\.\s+/.exec(title);
    if (!numbered) {
      pushFinding(
        findings,
        normalizedPath,
        index + 1,
        'section-number-format-invalid',
        'A numbered section heading has an invalid numeric prefix.',
      );
      continue;
    }

    const parts = numbered[1].split('.');
    const expectedDepth = marks.length - 1;
    if (
      parts[0].length !== 2 ||
      parts.length !== expectedDepth ||
      parts.some((part) => Number(part) === 0)
    ) {
      pushFinding(
        findings,
        normalizedPath,
        index + 1,
        'section-number-format-invalid',
        `Section numbering does not match EE-DOC-002 §06 for heading level ${marks.length}.`,
      );
    }
  }

  const history = findHistoryTable(lines);
  if (history.headingIndex < 0 || history.rows.length < 2) {
    pushFinding(
      findings,
      normalizedPath,
      undefined,
      'change-history-missing',
      'A change-history heading and table are required for this document family.',
    );
    return findings;
  }

  const header = history.rows[0];
  if (header.cells.length !== 7) {
    pushFinding(
      findings,
      normalizedPath,
      header.line,
      'change-history-column-count',
      `History table header has ${header.cells.length} columns; expected 7.`,
    );
  }
  const dataRows = history.rows
    .slice(1)
    .filter(({ cells, line }) => !isTableSeparator(lines[line - 1]) && cells.some(Boolean));
  for (const row of dataRows) {
    if (row.cells.length !== 7) {
      pushFinding(
        findings,
        normalizedPath,
        row.line,
        'change-history-row-column-count',
        `History row has ${row.cells.length} columns; expected 7.`,
      );
      continue;
    }
    const changeLength =
      [...stripMarkdown(row.cells[4])].length + [...stripMarkdown(row.cells[5])].length;
    if (changeLength > 230) {
      pushFinding(
        findings,
        normalizedPath,
        row.line,
        'change-history-text-too-long',
        `Motivo + Cambios contain ${changeLength} visible characters; maximum is 230.`,
      );
    }
  }

  return findings;
}

function walkMarkdown(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

export function scanDocumentationCorpus(root) {
  const docsRoot = join(root, 'docs');
  const allMarkdown = walkMarkdown(docsRoot);
  const coreDocuments = allMarkdown.filter((path) => GOVERNED_CORE_DOCUMENT.test(basename(path)));
  const specialDocuments = allMarkdown.filter((path) =>
    GOVERNED_SPECIAL_DOCUMENT.test(basename(path)),
  );

  const findings = [];
  for (const absolutePath of coreDocuments) {
    const relativePath = relative(root, absolutePath).replaceAll('\\', '/');
    findings.push(...inspectGovernedDocument(relativePath, readFileSync(absolutePath, 'utf8')));
  }

  return {
    filesScanned: coreDocuments.length,
    specialFilesDeferred: specialDocuments.length,
    findings,
  };
}
