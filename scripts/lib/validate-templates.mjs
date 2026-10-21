/**
 * Template validation (QG-REPO-001 / EE-DOC-012).
 *
 * Extracted from scripts/commands/validate to allow unit testing via node:test
 * (M-04b). `template.schema.json` is the Single Source of Truth for structural
 * rules; manual checks below cover only what JSON Schema cannot express
 * (filesystem correspondence of `outputs`).
 *
 * M-06a closed the two known outputs/files mismatches (ee-imp, ee-tec), so the
 * exception set is gone: any new mismatch is now an error, not a warning.
 */

import Ajv2020 from 'ajv/dist/2020.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CATEGORY_DIRS = {
  document: 'T-DOC',
  package: 'T-PKG',
  app: 'T-APP',
  connector: 'T-CON',
};

/**
 * @param {{ root: string }} options
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateTemplates({ root }) {
  const errors = [];
  const warnings = [];
  const templatesRoot = join(root, 'templates');

  if (!existsSync(templatesRoot)) {
    errors.push('QG-REPO-001: missing templates/ (EE-DOC-012 / EE-RFC-002)');
    return { errors, warnings };
  }

  const schemaPath = join(templatesRoot, 'template.schema.json');
  if (!existsSync(schemaPath)) {
    errors.push('QG-REPO-001: missing templates/template.schema.json');
  }

  for (const dir of Object.keys(CATEGORY_DIRS)) {
    if (!existsSync(join(templatesRoot, dir))) {
      errors.push(`QG-REPO-001: missing templates/${dir}/`);
    }
  }

  let validateSchema = null;
  if (existsSync(schemaPath)) {
    try {
      const ajv = new Ajv2020({ allErrors: true, strict: false });
      const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
      validateSchema = ajv.compile(schema);
    } catch (err) {
      errors.push(
        `QG-REPO-001: cannot compile template.schema.json: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  const seenIds = new Set();

  for (const [dir, expectedCat] of Object.entries(CATEGORY_DIRS)) {
    const catPath = join(templatesRoot, dir);
    if (!existsSync(catPath)) continue;

    let entries = [];
    try {
      entries = readdirSync(catPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const templateDir = join(catPath, ent.name);
      const metaPath = join(templateDir, 'template.json');
      if (!existsSync(metaPath)) continue;

      let data;
      try {
        data = JSON.parse(readFileSync(metaPath, 'utf8'));
      } catch (err) {
        errors.push(
          `QG-REPO-001: invalid JSON ${dir}/${ent.name}/template.json: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        continue;
      }

      // --- Schema validation (SSOT) ---
      if (validateSchema && !validateSchema(data)) {
        for (const err of validateSchema.errors ?? []) {
          errors.push(`QG-REPO-001: ${dir}/${ent.name}${err.instancePath || '/'}: ${err.message}`);
        }
      }

      // --- Folder/category coherence ---
      if (data.category && data.category !== expectedCat) {
        errors.push(
          `QG-REPO-001: ${dir}/${ent.name} category "${data.category}" != ${expectedCat}`,
        );
      }

      // --- Uniqueness of template id ---
      if (data.id) {
        if (seenIds.has(data.id)) {
          errors.push(`QG-REPO-001: duplicate template id "${data.id}"`);
        }
        seenIds.add(data.id);
      }

      // --- outputs ⊆ files (output + '.hbs' must exist) ---
      if (Array.isArray(data.outputs)) {
        const filesDir = join(templateDir, 'files');
        for (const output of data.outputs) {
          const expected = join(filesDir, `${output}.hbs`);
          if (!existsSync(expected)) {
            errors.push(
              `QG-REPO-001: ${dir}/${ent.name} output "${output}" has no "${output}.hbs" under files/`,
            );
          }
        }
      }
    }
  }

  return { errors, warnings };
}
