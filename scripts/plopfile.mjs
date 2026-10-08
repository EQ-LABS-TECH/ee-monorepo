/**
 * EE generation registry (EE-DOC-012 / EE-DOC-011 / EE-IMP-012-P05).
 * Discovers templates/[*]/[*]/template.json — no Plop actions under templates/ (L-07).
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = process.cwd();
const TEMPLATES_ROOT = join(ROOT, 'templates');

function loadWorkspaceGlobs() {
  const raw = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
  const doc = parseYaml(raw);
  return Array.isArray(doc?.packages) ? doc.packages : [];
}

function matchesGlob(relPosix, glob) {
  const g = glob.replace(/\\/g, '/');
  const t = relPosix.replace(/\\/g, '/');
  if (!g.includes('*')) return t === g;
  const parts = g.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`^${parts.join('.*')}$`);
  return re.test(t);
}

function isCoveredByWorkspace(relPath, globs) {
  const posix = relPath.split(sep).join('/');
  return globs.some((g) => matchesGlob(posix, g) || matchesGlob(`${posix}/*`, g));
}

function discoverTemplates() {
  const out = [];
  if (!existsSync(TEMPLATES_ROOT)) return out;

  for (const cat of readdirSync(TEMPLATES_ROOT)) {
    const catPath = join(TEMPLATES_ROOT, cat);
    if (!statSync(catPath).isDirectory()) continue;
    if (cat.startsWith('.') || cat === 'node_modules') continue;

    for (const id of readdirSync(catPath)) {
      const dir = join(catPath, id);
      if (!statSync(dir).isDirectory()) continue;
      const metaPath = join(dir, 'template.json');
      if (!existsSync(metaPath)) continue;
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      out.push({ dir, meta });
    }
  }
  return out;
}

function collectHbs(filesDir, prefix = '') {
  const base = prefix ? join(filesDir, prefix) : filesDir;
  if (!existsSync(base)) return [];
  const list = [];
  for (const e of readdirSync(base, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) list.push(...collectHbs(filesDir, rel));
    else if (e.name.endsWith('.hbs')) list.push(rel.replace(/\\/g, '/'));
  }
  return list;
}

function resolveDest(meta, data) {
  switch (meta.category) {
    case 'T-PKG':
      return join('packages', data.name);
    case 'T-APP':
      return join('apps', data.name);
    case 'T-CON':
      return join('connectors', 'official', data.name);
    case 'T-DOC': {
      const rel = data.relativePath || 'architecture';
      return join('docs', rel);
    }
    default:
      throw new Error(`Unknown category: ${meta.category}`);
  }
}

function docBodyTemplate(meta, filesDir) {
  const map = {
    'ee-doc': 'EE-DOC-XXX_Title.md.hbs',
    'ee-adr': 'EE-ADR-XXX_Title.md.hbs',
    'ee-imp': 'EE-IMP-XXX-PXX_Title.md.hbs',
    'ee-tec': 'EE-TEC-XXX_Title.md.hbs',
    'ee-rfc': 'EE-RFC-XXX_Title.md.hbs',
  };
  const name = map[meta.id];
  if (!name) throw new Error(`No body mapping for T-DOC id ${meta.id}`);
  const full = join(filesDir, name);
  if (!existsSync(full)) throw new Error(`Missing body template: ${name}`);
  return full;
}

function assertGuards(meta, data, destRel) {
  const globs = loadWorkspaceGlobs();
  const destAbs = join(ROOT, destRel);
  const posix = destRel.split(sep).join('/');

  if (meta.category === 'T-PKG') {
    const parts = destRel.split(sep).filter(Boolean);
    if (parts.length > 2) {
      throw new Error(`§13.1: nested package path not authorized: ${destRel}`);
    }
  }

  if (meta.category !== 'T-DOC') {
    if (existsSync(destAbs)) {
      throw new Error(`Destination already exists: ${destRel}`);
    }
    if (!isCoveredByWorkspace(destRel, globs)) {
      throw new Error(`Destination not covered by pnpm-workspace.yaml: ${destRel}`);
    }
  }

  const allowed = meta.allowedTargets || [];
  if (allowed.length) {
    const ok = allowed.some((a) => {
      const prefix = a.replace(/\\/g, '/').replace(/\/?$/, '/');
      return `${posix}/`.startsWith(prefix) || posix === a.replace(/\/$/, '');
    });
    if (!ok) {
      throw new Error(`Destination outside allowedTargets (${allowed.join(', ')}): ${destRel}`);
    }
  }
}

export default function (plop) {
  const templates = discoverTemplates();
  if (templates.length === 0) {
    throw new Error('No templates discovered under templates/*/*/template.json');
  }

  for (const { dir, meta } of templates) {
    const filesDir = join(dir, 'files');

    plop.setGenerator(meta.id, {
      description: meta.description || meta.name || meta.id,
      prompts: (meta.inputs || []).map((input) => ({
        type: 'input',
        name: input.name,
        message: input.description || input.name,
        default: input.default,
        validate(value) {
          if (input.required && (value === undefined || value === '')) {
            return `${input.name} is required`;
          }
          if (input.pattern && value) {
            const re = new RegExp(input.pattern);
            if (!re.test(String(value))) {
              return `${input.name} must match ${input.pattern}`;
            }
          }
          return true;
        },
      })),
      actions(data) {
        try {
          const destRel = resolveDest(meta, data);
          assertGuards(meta, data, destRel);

          if (meta.category === 'T-DOC') {
            const title = String(data.title || 'Title').replace(/\s+/g, '_');
            const baseName = `${data.docId}_${title}.md`;
            return [
              {
                type: 'add',
                path: join(ROOT, destRel, baseName),
                templateFile: docBodyTemplate(meta, filesDir),
              },
            ];
          }

          const hbsFiles = collectHbs(filesDir);
          if (hbsFiles.length === 0) {
            throw new Error(`No .hbs files under ${filesDir}`);
          }

          return hbsFiles.map((rel) => ({
            type: 'add',
            path: join(ROOT, destRel, rel.replace(/\.hbs$/, '')),
            templateFile: join(filesDir, rel),
          }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`❌ ${msg}`);
          process.exitCode = 1;
          return [];
        }
      },
    });
  }
}
