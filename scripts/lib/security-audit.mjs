import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_WAIVER_FIELDS = [
  'gate_id',
  'package',
  'advisory',
  'authority',
  'reason',
  'scope',
  'effective_from',
  'expires_at',
  'normalization_plan',
];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GHSA_PATTERN = /GHSA-[a-z0-9-]+/gi;
const BLOCKING_SEVERITIES = new Set(['high', 'critical']);

function readField(text, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(
    new RegExp(`^\\|\\s*\\*\\*${escaped}\\*\\*\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, 'im'),
  );
  return match?.[1]?.trim() ?? '';
}

function parseDate(value) {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function listActiveSecWaivers(root, today = new Date()) {
  const dir = join(root, 'docs', 'validation', 'waivers');
  if (!existsSync(dir)) return { waivers: [], errors: [] };

  const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const waivers = [];
  const errors = [];

  for (const name of readdirSync(dir).sort()) {
    if (!name.startsWith('EE-WAIVE-') || !name.endsWith('.md')) continue;
    const text = readFileSync(join(dir, name), 'utf8');
    const fields = Object.fromEntries(
      REQUIRED_WAIVER_FIELDS.map((field) => [field, readField(text, field)]),
    );
    const missing = REQUIRED_WAIVER_FIELDS.filter((field) => !fields[field]);
    const from = parseDate(fields.effective_from);
    const expires = parseDate(fields.expires_at);
    const advisory = fields.advisory.toLowerCase();

    if (
      missing.length ||
      !from ||
      !expires ||
      !/^GHSA-[a-z0-9-]+$/i.test(fields.advisory) ||
      fields.gate_id !== 'QG-SEC-001'
    ) {
      const details = [...missing.map((field) => `missing ${field}`)];
      if (fields.effective_from && !from) details.push('invalid effective_from');
      if (fields.expires_at && !expires) details.push('invalid expires_at');
      if (fields.advisory && !/^GHSA-[a-z0-9-]+$/i.test(fields.advisory))
        details.push('invalid advisory');
      if (fields.gate_id && fields.gate_id !== 'QG-SEC-001')
        details.push('gate_id must be QG-SEC-001');
      errors.push(`${name}: ${details.join(', ') || 'invalid waiver metadata'}`);
      continue;
    }

    if (expires < from) {
      errors.push(`${name}: expires_at precedes effective_from`);
      continue;
    }
    if (expires.getTime() - from.getTime() > 7 * 24 * 60 * 60 * 1000) {
      errors.push(`${name}: waiver validity exceeds the 7-day maximum in EE-DOC-010 §04.6.1`);
      continue;
    }
    if (from > todayDate || expires < todayDate) continue;

    waivers.push({
      file: name,
      advisory,
      effective_from: fields.effective_from,
      expires_at: fields.expires_at,
    });
  }

  return { waivers, errors };
}

export function extractAdvisories(stdout = '', stderr = '') {
  const advisories = new Set();
  const text = `${stdout}\n${stderr}`;
  let parsedOk = false;

  try {
    const data = JSON.parse(stdout || '{}');
    parsedOk = true;

    if (data.advisories && typeof data.advisories === 'object') {
      for (const advisory of Object.values(data.advisories)) {
        if (!BLOCKING_SEVERITIES.has(advisory?.severity)) continue;
        if (advisory?.github_advisory_id)
          advisories.add(String(advisory.github_advisory_id).toLowerCase());
        if (typeof advisory?.id === 'string') {
          for (const match of advisory.id.matchAll(GHSA_PATTERN))
            advisories.add(match[0].toLowerCase());
        }
      }
    }

    if (Array.isArray(data.vulnerabilities)) {
      for (const vulnerability of data.vulnerabilities) {
        if (!BLOCKING_SEVERITIES.has(vulnerability?.severity)) continue;
        if (vulnerability?.github_advisory_id)
          advisories.add(String(vulnerability.github_advisory_id).toLowerCase());
        if (typeof vulnerability?.id === 'string') {
          for (const match of vulnerability.id.matchAll(GHSA_PATTERN))
            advisories.add(match[0].toLowerCase());
        }
      }
    }
  } catch {
    parsedOk = false;
  }

  // Fallback textual SOLO si el JSON no fue parseable (conservador).
  if (!parsedOk || advisories.size === 0) {
    for (const match of text.matchAll(GHSA_PATTERN)) advisories.add(match[0].toLowerCase());
  }

  return advisories;
}

export function runSecurityAuditWithWaivers({
  root,
  spawnSyncImpl,
  today = new Date(),
  log = console,
}) {
  log.log('  Security audit...');
  const args = ['audit', '--audit-level', 'high'];
  const options = { stdio: 'inherit', shell: process.platform === 'win32', cwd: root };
  const human = spawnSyncImpl('pnpm', args, options);
  if (human.status === 0) return { ok: true };

  const jsonRun = spawnSyncImpl('pnpm', [...args, '--json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    cwd: root,
  });
  const advisories = extractAdvisories(jsonRun.stdout ?? '', jsonRun.stderr ?? '');
  const { waivers, errors } = listActiveSecWaivers(root, today);
  for (const error of errors) log.error(`  ❌ Security waiver invalid: ${error}`);

  const waived = new Set(waivers.map((waiver) => waiver.advisory));
  const missing = [...advisories].filter((id) => !waived.has(id));
  const covered = advisories.size > 0 && missing.length === 0 && errors.length === 0;

  if (covered) {
    log.log('  ⚠️ Security audit: findings present but covered by active EE-WAIVE (QG-SEC-001).');
    for (const id of advisories) {
      for (const waiver of waivers.filter((item) => item.advisory === id)) {
        log.log(`     - ${id} ← ${waiver.file} (expires ${waiver.expires_at})`);
      }
    }
    return { ok: true, waived: true };
  }

  if (missing.length) {
    log.error('  ❌ Security audit: high/critical without active EE-WAIVE:');
    for (const id of missing) log.error(`     - ${id}`);
  }
  if (!advisories.size)
    log.error(
      '  ❌ Security audit failed and no GHSA IDs could be extracted; refusing to auto-approve.',
    );
  if (errors.length)
    log.error('  ❌ Security audit blocked because one or more waiver files are invalid.');
  return { ok: false };
}
