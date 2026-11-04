/**
 * Template validation (QG-REPO-001 / EE-DOC-012).
 *
 * Extracted from scripts/commands/validate to allow unit testing via node:test.
 * `template.schema.json` is the Single Source of Truth for metadata rules;
 * manual checks cover filesystem correspondence and the documented template layout.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import * as nodeFs from 'node:fs';
import { join } from 'node:path';

const CATEGORY_DIRS = {
  document: 'T-DOC',
  package: 'T-PKG',
  app: 'T-APP',
  connector: 'T-CON',
};

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function inspectPath(fsImpl, path, label, errors) {
  try {
    return fsImpl.statSync(path);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return null;
    errors.push(`QG-REPO-001: cannot inspect ${label}: ${errorMessage(error)}`);
    return undefined;
  }
}

function isCandidateTemplate(entries, metaStat, filesStat) {
  return (
    Boolean(metaStat) ||
    Boolean(filesStat?.isDirectory()) ||
    entries.some((entry) => entry.name === 'files') ||
    entries.some((entry) => entry.name.endsWith('.hbs'))
  );
}

/**
 * @param {{ root: string, fsImpl?: typeof nodeFs }} options
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateTemplates({ root, fsImpl = nodeFs }) {
  const errors = [];
  const warnings = [];
  const templatesRoot = join(root, 'templates');
  const templatesStat = inspectPath(fsImpl, templatesRoot, 'templates/', errors);

  if (templatesStat === null) {
    errors.push('QG-REPO-001: missing templates/ (EE-DOC-012 / EE-RFC-002)');
    return { errors, warnings };
  }
  if (!templatesStat) return { errors, warnings };
  if (!templatesStat.isDirectory()) {
    errors.push('QG-REPO-001: templates/ is not a directory');
    return { errors, warnings };
  }

  const schemaPath = join(templatesRoot, 'template.schema.json');
  const schemaStat = inspectPath(fsImpl, schemaPath, 'templates/template.schema.json', errors);
  if (schemaStat === null) errors.push('QG-REPO-001: missing templates/template.schema.json');
  else if (!schemaStat.isFile())
    errors.push('QG-REPO-001: templates/template.schema.json is not a file');

  let validateSchema = null;
  if (schemaStat?.isFile()) {
    try {
      const ajv = new Ajv2020({ allErrors: true, strict: false });
      const schema = JSON.parse(fsImpl.readFileSync(schemaPath, 'utf8'));
      validateSchema = ajv.compile(schema);
    } catch (error) {
      errors.push(`QG-REPO-001: cannot compile template.schema.json: ${errorMessage(error)}`);
    }
  }

  const seenIds = new Set();

  for (const [category, expectedCategory] of Object.entries(CATEGORY_DIRS)) {
    const categoryPath = join(templatesRoot, category);
    const categoryStat = inspectPath(fsImpl, categoryPath, `templates/${category}/`, errors);

    if (categoryStat === null) {
      errors.push(`QG-REPO-001: missing templates/${category}/`);
      continue;
    }
    if (!categoryStat) continue;
    if (!categoryStat.isDirectory()) {
      errors.push(`QG-REPO-001: templates/${category}/ is not a directory`);
      continue;
    }

    let entries;
    try {
      entries = fsImpl.readdirSync(categoryPath, { withFileTypes: true });
    } catch (error) {
      errors.push(`QG-REPO-001: cannot read templates/${category}/: ${errorMessage(error)}`);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const templateDir = join(categoryPath, entry.name);
      let templateEntries;
      try {
        templateEntries = fsImpl.readdirSync(templateDir, { withFileTypes: true });
      } catch (error) {
        errors.push(
          `QG-REPO-001: cannot inspect ${category}/${entry.name}/: ${errorMessage(error)}`,
        );
        continue;
      }

      const metaPath = join(templateDir, 'template.json');
      const metaStat = inspectPath(
        fsImpl,
        metaPath,
        `templates/${category}/${entry.name}/template.json`,
        errors,
      );
      const filesPath = join(templateDir, 'files');
      const filesStat = inspectPath(
        fsImpl,
        filesPath,
        `templates/${category}/${entry.name}/files/`,
        errors,
      );

      if (!isCandidateTemplate(templateEntries, metaStat, filesStat)) continue;

      if (metaStat === null) {
        errors.push(
          `QG-REPO-001: template candidate ${category}/${entry.name}/ is missing template.json`,
        );
        continue;
      }
      if (!metaStat) continue;
      if (!metaStat.isFile()) {
        errors.push(`QG-REPO-001: ${category}/${entry.name}/template.json is not a file`);
        continue;
      }
      if (filesStat === null) {
        errors.push(`QG-REPO-001: ${category}/${entry.name}/ is missing files/`);
        continue;
      }
      if (!filesStat) continue;
      if (!filesStat.isDirectory()) {
        errors.push(`QG-REPO-001: ${category}/${entry.name}/files is not a directory`);
        continue;
      }

      let data;
      try {
        data = JSON.parse(fsImpl.readFileSync(metaPath, 'utf8'));
      } catch (error) {
        errors.push(
          `QG-REPO-001: cannot read ${category}/${entry.name}/template.json: ${errorMessage(error)}`,
        );
        continue;
      }

      if (validateSchema && !validateSchema(data)) {
        for (const error of validateSchema.errors ?? []) {
          errors.push(
            `QG-REPO-001: ${category}/${entry.name}${error.instancePath || '/'}: ${error.message}`,
          );
        }
      }

      if (data.category && data.category !== expectedCategory) {
        errors.push(
          `QG-REPO-001: ${category}/${entry.name} category "${data.category}" != ${expectedCategory}`,
        );
      }

      if (data.id) {
        if (seenIds.has(data.id)) {
          errors.push(`QG-REPO-001: duplicate template id "${data.id}"`);
        }
        seenIds.add(data.id);
      }

      if (Array.isArray(data.outputs)) {
        for (const output of data.outputs) {
          const expectedPath = join(filesPath, `${output}.hbs`);
          const outputStat = inspectPath(
            fsImpl,
            expectedPath,
            `templates/${category}/${entry.name}/files/${output}.hbs`,
            errors,
          );
          if (outputStat === null) {
            errors.push(
              `QG-REPO-001: ${category}/${entry.name} output "${output}" has no "${output}.hbs" under files/`,
            );
          } else if (outputStat && !outputStat.isFile()) {
            errors.push(
              `QG-REPO-001: ${category}/${entry.name} output "${output}.hbs" is not a file`,
            );
          }
        }
      }
    }
  }

  return { errors, warnings };
}
