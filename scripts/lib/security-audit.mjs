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
const RESOLUTION_FIELDS = ['resolved_at', 'resolution_reason', 'evidence'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GHSA_PATTERN = /GHSA-[a-z0-9-]+/gi;
const BLOCKING_SEVERITIES = new Set(['high', 'critical']);
const SEVERITY_RANK = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

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

  // Waiver dates are calendar dates in UTC; never use machine-local date getters.
  const todayDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const waivers = [];
  const errors = [];

  for (const name of readdirSync(dir).sort()) {
    if (!name.startsWith('EE-WAIVE-') || !name.endsWith('.md')) continue;

    const text = readFileSync(join(dir, name), 'utf8');
    const fields = Object.fromEntries(
      [...REQUIRED_WAIVER_FIELDS, 'status', ...RESOLUTION_FIELDS].map((field) => [
        field,
        readField(text, field),
      ]),
    );
    const missing = REQUIRED_WAIVER_FIELDS.filter((field) => !fields[field]);
    const from = parseDate(fields.effective_from);
    const expires = parseDate(fields.expires_at);
    const advisory = fields.advisory.toLowerCase();
    const status = fields.status.toUpperCase();

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
      if (fields.advisory && !/^GHSA-[a-z0-9-]+$/i.test(fields.advisory)) {
        details.push('invalid advisory');
      }
      if (fields.gate_id && fields.gate_id !== 'QG-SEC-001') {
        details.push('gate_id must be QG-SEC-001');
      }

      errors.push(`${name}: ${details.join(', ') || 'invalid waiver metadata'}`);
      continue;
    }

    if (fields.status && status !== 'RESOLVED') {
      errors.push(`${name}: unsupported status "${fields.status}"`);
      continue;
    }

    if (status === 'RESOLVED') {
      const missingResolution = RESOLUTION_FIELDS.filter((field) => !fields[field]);
      const resolvedAt = parseDate(fields.resolved_at);
      const details = [];

      if (missingResolution.length) {
        details.push(...missingResolution.map((field) => `missing ${field}`));
      }
      if (fields.resolved_at && !resolvedAt) {
        details.push('invalid resolved_at');
      }
      if (resolvedAt && resolvedAt < from) {
        details.push('resolved_at precedes effective_from');
      }

      if (details.length) {
        errors.push(`${name}: invalid resolution metadata: ${details.join(', ')}`);
      }

      // A resolved waiver remains historical evidence, never an active exception.
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

    // expires_at is inclusive: the waiver remains active throughout that UTC calendar day.
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

/**
 * Extract all known severities from structured pnpm audit JSON.
 * If an advisory occurs more than once, retain its highest severity.
 * Throws when the JSON cannot be parsed so callers can fail closed.
 */
export function extractAdvisories(stdout = '') {
  const advisories = new Map();
  const data = JSON.parse(stdout);

  function collect(item) {
    const severity = String(item?.severity ?? '').toLowerCase();

    if (!(severity in SEVERITY_RANK)) return;

    const ids = new Set();

    if (typeof item?.github_advisory_id === 'string') {
      ids.add(item.github_advisory_id.toLowerCase());
    }

    if (typeof item?.id === 'string') {
      for (const match of item.id.matchAll(GHSA_PATTERN)) {
        ids.add(match[0].toLowerCase());
      }
    }

    for (const id of ids) {
      const previous = advisories.get(id);

      if (!previous || SEVERITY_RANK[severity] > SEVERITY_RANK[previous]) {
        advisories.set(id, severity);
      }
    }
  }

  if (data.advisories && typeof data.advisories === 'object') {
    Object.values(data.advisories).forEach(collect);
  }

  if (Array.isArray(data.vulnerabilities)) {
    data.vulnerabilities.forEach(collect);
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

  const args = ['audit', '--audit-level', 'low'];
  const options = {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    cwd: root,
  };

  // Always run the JSON audit so all severities are collected and reported.
  const jsonRun = spawnSyncImpl('pnpm', [...args, '--json'], options);

  if (jsonRun.error) {
    log.error(`  ❌ Security audit could not run: ${jsonRun.error.message}`);
    return { ok: false };
  }

  let advisories;

  try {
    advisories = extractAdvisories(jsonRun.stdout ?? '');
  } catch {
    log.error(
      '  ❌ Security audit failed: unable to parse structured audit JSON; refusing to auto-approve.',
    );
    return { ok: false };
  }

  if (jsonRun.status !== 0 && advisories.size === 0) {
    log.error(
      '  ❌ Security audit failed and no advisories could be extracted; refusing to auto-approve.',
    );
    if (jsonRun.stderr) log.error(jsonRun.stderr);
    return { ok: false };
  }

  const { waivers, errors } = listActiveSecWaivers(root, today);

  for (const error of errors) {
    log.error(`  ❌ Security waiver invalid: ${error}`);
  }

  for (const [id, severity] of advisories) {
    log.log(`  - ${id}: ${severity}`);
  }

  const waived = new Set(waivers.map((waiver) => waiver.advisory));
  const blocking = [...advisories].filter(([, severity]) => BLOCKING_SEVERITIES.has(severity));
  const missing = blocking.map(([id]) => id).filter((id) => !waived.has(id));

  if (errors.length > 0) {
    log.error('  ❌ Security audit blocked because one or more waiver files are invalid.');
    return { ok: false };
  }

  if (missing.length > 0) {
    log.error('  ❌ Security audit: high/critical without active EE-WAIVE:');

    for (const id of missing) {
      log.error(`     - ${id}`);
    }

    return { ok: false };
  }

  if (blocking.length > 0) {
    log.log('  ⚠️ QG-SEC-001: PASS WITH WARNINGS');
    log.log('  - Security audit: high/critical findings covered by active EE-WAIVE.');

    for (const [id] of blocking) {
      for (const waiver of waivers.filter((item) => item.advisory === id)) {
        log.log(`    - ${id} ← ${waiver.file} (expires ${waiver.expires_at})`);
      }
    }

    return { ok: true, waived: true };
  }

  log.log('  ✅ Security audit: no unwaived high/critical findings.');

  return { ok: true };
}
