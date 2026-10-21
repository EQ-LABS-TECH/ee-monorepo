/**
 * Plop utilities (M-06c).
 *
 * Extracted from plopfile.mjs so the docId uniqueness guard can be unit-tested
 * without spawning Plop. Mirrors the pattern of scripts/lib/security-audit.mjs
 * (exportable logic, direct tests).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const ID_FIELD = /^\|\s*\*\*ID\*\*\s*\|\s*([A-Z][A-Z0-9-]+)\s*\|/m;

/**
 * Throws if `docId` is already used under `docsRoot`, either by:
 *   1. A file whose name starts with `<docId>_`, or
 *   2. A file whose content has `| **ID** | <docId> |`.
 *
 * Recursive: EE-DOC-XXX / EE-ADR-XXX / etc. uniqueness is global, not
 * per-folder. The ID-field scan catches renamed files (title change, manual
 * edits) that a filename-only check would miss.
 *
 * Read errors are surfaced (fail-closed): a directory we cannot read might
 * hide an existing docId, so we do not silently skip it.
 */
export function assertDocIdUnique(docId, docsRoot) {
  if (!existsSync(docsRoot)) return;

  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      throw new Error(
        `cannot read ${dir} while checking docId ${docId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      // 1. Filename prefix
      if (entry.name.startsWith(`${docId}_`)) {
        const rel = full.replace(docsRoot + sep, 'docs/').replace(/\\/g, '/');
        throw new Error(`docId ${docId} already in use: ${rel}`);
      }

      // 2. Content ID field (only if the filename didn't already match)
      let text;
      try {
        text = readFileSync(full, 'utf8');
      } catch (err) {
        throw new Error(
          `cannot read ${full} while checking docId ${docId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      const match = text.match(ID_FIELD);
      if (match && match[1] === docId) {
        const rel = full.replace(docsRoot + sep, 'docs/').replace(/\\/g, '/');
        throw new Error(`docId ${docId} already in use (ID field): ${rel}`);
      }
    }
  };

  walk(docsRoot);
}
