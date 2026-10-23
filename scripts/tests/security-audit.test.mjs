import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  extractAdvisories,
  listActiveSecWaivers,
  runSecurityAuditWithWaivers,
} from '../lib/security-audit.mjs';

const GHSA_A = 'GHSA-vfj7-8cjw-p6xm';
const GHSA_B = 'GHSA-hp3w-g68c-fv3c';
const TODAY = new Date('2026-10-17T12:00:00Z');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'ee-sec-audit-'));
  const dir = join(root, 'docs', 'validation', 'waivers');
  mkdirSync(dir, { recursive: true });
  return { root, dir, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function waiver({
  advisory = GHSA_A,
  from = '2026-10-16',
  expires = '2026-10-23',
  omit = '',
  extraFields = {},
} = {}) {
  const fields = {
    gate_id: 'QG-SEC-001',
    package: 'braces',
    advisory,
    authority: 'Architecture',
    reason: 'No upstream fix available',
    scope: 'Root devDependency chain',
    effective_from: from,
    expires_at: expires,
    normalization_plan: 'Re-evaluate upstream fix',
    ...extraFields,
  };

  return `# waiver

| Campo | Valor |
| --- | --- |
${Object.entries(fields)
  .filter(([key]) => key !== omit)
  .map(([key, value]) => `| **${key}** | ${value} |`)
  .join('\n')}
`;
}

function auditResult(vulnerabilities, status = 1) {
  return {
    status,
    stdout: JSON.stringify({ vulnerabilities }),
    stderr: '',
  };
}

function quietLog() {
  return { log() {}, error() {} };
}

test('waiver future-dated is not active', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(join(f.dir, 'EE-WAIVE-future.md'), waiver({ from: '2026-10-18' }));

  assert.deepEqual(listActiveSecWaivers(f.root, TODAY).waivers, []);
});

test('expired waiver is not active', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-expired.md'),
    waiver({ from: '2026-10-07', expires: '2026-10-14' }),
  );

  assert.deepEqual(listActiveSecWaivers(f.root, TODAY).waivers, []);
});

test('waiver is active on its effective_from UTC date', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(join(f.dir, 'EE-WAIVE-boundary.md'), waiver({ from: '2026-10-17' }));

  const result = listActiveSecWaivers(f.root, new Date('2026-10-17T00:00:00.000Z'));

  assert.equal(result.waivers.length, 1);
  assert.deepEqual(result.errors, []);
});

test('waiver remains active throughout expires_at UTC date', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(
    join(f.dir, 'EE-WAIVE-boundary.md'),
    waiver({ from: '2026-10-16', expires: '2026-10-17' }),
  );

  const result = listActiveSecWaivers(f.root, new Date('2026-10-17T23:59:59.999Z'));

  assert.equal(result.waivers.length, 1);
  assert.deepEqual(result.errors, []);
});

test('waiver expires on the UTC calendar day after expires_at', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(
    join(f.dir, 'EE-WAIVE-boundary.md'),
    waiver({ from: '2026-10-16', expires: '2026-10-17' }),
  );

  const result = listActiveSecWaivers(f.root, new Date('2026-10-18T00:00:00.000Z'));

  assert.deepEqual(result.waivers, []);
  assert.deepEqual(result.errors, []);
});

test('UTC date is used when instant falls on different local calendar date', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(
    join(f.dir, 'EE-WAIVE-utc.md'),
    waiver({ from: '2026-10-17', expires: '2026-10-17' }),
  );

  // This instant is October 17 in UTC, even though it is October 16 in UTC-12.
  const result = listActiveSecWaivers(f.root, new Date('2026-10-17T00:30:00.000Z'));

  assert.equal(result.waivers.length, 1);
  assert.deepEqual(result.errors, []);
});

test('incomplete waiver is reported as invalid', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(join(f.dir, 'EE-WAIVE-incomplete.md'), waiver({ omit: 'normalization_plan' }));

  const result = listActiveSecWaivers(f.root, TODAY);
  assert.equal(result.waivers.length, 0);
  assert.match(result.errors[0], /missing normalization_plan/);
});

test('waiver longer than seven calendar days is rejected', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-too-long.md'),
    waiver({ from: '2026-10-16', expires: '2026-10-24' }),
  );

  assert.match(listActiveSecWaivers(f.root, TODAY).errors[0], /exceeds the 7-day maximum/);
});

test('resolved waiver is retained as history but is not active', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-resolved.md'),
    waiver({
      advisory: GHSA_B,
      extraFields: {
        status: 'RESOLVED',
        resolved_at: '2026-10-22',
        resolution_reason: 'GitHub Advisory Database withdrew the advisory.',
        evidence: 'pnpm audit --json no longer reports GHSA-hp3w-g68c-fv3c.',
      },
    }),
  );

  const result = listActiveSecWaivers(f.root, TODAY);

  assert.deepEqual(result.waivers, []);
  assert.deepEqual(result.errors, []);
});

test('resolved waiver with missing resolution metadata is invalid', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-resolved-incomplete.md'),
    waiver({
      extraFields: {
        status: 'RESOLVED',
        resolved_at: '2026-10-22',
        resolution_reason: 'Advisory withdrawn.',
      },
    }),
  );

  const result = listActiveSecWaivers(f.root, TODAY);

  assert.deepEqual(result.waivers, []);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors.join('\n'), /evidence/);
});

test('resolved waiver with invalid resolution date is invalid', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-resolved-invalid-date.md'),
    waiver({
      extraFields: {
        status: 'RESOLVED',
        resolved_at: 'not-a-date',
        resolution_reason: 'Advisory withdrawn.',
        evidence: 'pnpm audit --json no longer reports the advisory.',
      },
    }),
  );

  const result = listActiveSecWaivers(f.root, TODAY);

  assert.deepEqual(result.waivers, []);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors.join('\n'), /resolved_at/);
});

test('resolved date before effective date is invalid', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-resolved-before-effective.md'),
    waiver({
      from: '2026-10-16',
      extraFields: {
        status: 'RESOLVED',
        resolved_at: '2026-10-15',
        resolution_reason: 'Advisory withdrawn.',
        evidence: 'pnpm audit --json no longer reports the advisory.',
      },
    }),
  );

  const result = listActiveSecWaivers(f.root, TODAY);

  assert.deepEqual(result.waivers, []);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors.join('\n'), /resolved_at/);
});

test('unsupported waiver status is invalid', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-unknown-status.md'),
    waiver({ extraFields: { status: 'CLOSED' } }),
  );

  const result = listActiveSecWaivers(f.root, TODAY);

  assert.deepEqual(result.waivers, []);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors.join('\n'), /status/);
});

test('extractAdvisories collects all severities', () => {
  const result = extractAdvisories(
    JSON.stringify({
      vulnerabilities: [
        { github_advisory_id: 'GHSA-aaaa-bbbb-cccc', severity: 'moderate' },
        { github_advisory_id: 'GHSA-dddd-eeee-ffff', severity: 'high' },
        { github_advisory_id: 'GHSA-gggg-hhhh-iiii', severity: 'critical' },
        { github_advisory_id: 'GHSA-jjjj-kkkk-llll', severity: 'low' },
      ],
    }),
  );

  assert.equal(result.get('ghsa-aaaa-bbbb-cccc'), 'moderate');
  assert.equal(result.get('ghsa-dddd-eeee-ffff'), 'high');
  assert.equal(result.get('ghsa-gggg-hhhh-iiii'), 'critical');
  assert.equal(result.get('ghsa-jjjj-kkkk-llll'), 'low');
});

test('extractAdvisories keeps the highest severity for duplicate advisories', () => {
  const result = extractAdvisories(
    JSON.stringify({
      vulnerabilities: [
        { github_advisory_id: GHSA_A, severity: 'moderate' },
        { github_advisory_id: GHSA_A, severity: 'critical' },
        { github_advisory_id: GHSA_A, severity: 'high' },
      ],
    }),
  );

  assert.equal(result.get(GHSA_A.toLowerCase()), 'critical');
  assert.equal(result.size, 1);
});

test('extractAdvisories rejects invalid JSON instead of guessing from text', () => {
  assert.throws(() => extractAdvisories(`invalid output containing ${GHSA_A}`));
});

test('low and moderate findings do not block the gate', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  const spawnSyncImpl = () =>
    auditResult([
      { github_advisory_id: GHSA_A, severity: 'low' },
      { github_advisory_id: GHSA_B, severity: 'moderate' },
    ]);

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: quietLog(),
  });

  assert.equal(result.ok, true);
});

test('an uncovered high finding blocks the gate', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  const spawnSyncImpl = () => auditResult([{ github_advisory_id: GHSA_B, severity: 'high' }]);

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: quietLog(),
  });

  assert.equal(result.ok, false);
});

test('an active waiver covers its matching high finding and logs a warning', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(join(f.dir, 'EE-WAIVE-a.md'), waiver());

  const messages = [];
  const spawnSyncImpl = () => auditResult([{ github_advisory_id: GHSA_A, severity: 'high' }]);

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: {
      log: (message) => messages.push(message),
      error: (message) => messages.push(message),
    },
  });

  assert.deepEqual(result, { ok: true, waived: true });
  assert.ok(
    messages.some((message) => message.includes('PASS WITH WARNINGS')),
    'should report that the gate passed with warnings',
  );
  assert.ok(
    messages.some((message) => message.includes(GHSA_A.toLowerCase())),
    'should identify the waived advisory',
  );
  assert.ok(
    messages.some((message) => message.includes('EE-WAIVE-a.md')),
    'should identify the waiver file',
  );
});

test('an expired waiver does not cover its matching high finding', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(
    join(f.dir, 'EE-WAIVE-expired.md'),
    waiver({ from: '2026-10-07', expires: '2026-10-14' }),
  );

  const messages = [];
  const spawnSyncImpl = () => auditResult([{ github_advisory_id: GHSA_A, severity: 'high' }]);

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: {
      log: (message) => messages.push(message),
      error: (message) => messages.push(message),
    },
  });

  assert.deepEqual(result, { ok: false });
  assert.ok(
    messages.some((message) => message.toLowerCase().includes(GHSA_A.toLowerCase())),
    'should report the uncovered advisory',
  );
});

test('every blocking finding must be covered by an active waiver', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  writeFileSync(join(f.dir, 'EE-WAIVE-a.md'), waiver());

  const messages = [];
  const spawnSyncImpl = () =>
    auditResult([
      { github_advisory_id: GHSA_A, severity: 'high' },
      { github_advisory_id: GHSA_B, severity: 'critical' },
    ]);

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: {
      log: (message) => messages.push(message),
      error: (message) => messages.push(message),
    },
  });

  assert.equal(result.ok, false);
  assert.ok(messages.some((message) => message.includes(GHSA_B.toLowerCase())));
});

test('audit failure with invalid JSON fails closed', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  const spawnSyncImpl = () => ({
    status: 1,
    stdout: '{invalid',
    stderr: 'audit failed',
  });

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: quietLog(),
  });

  assert.deepEqual(result, { ok: false });
});

test('audit failure without extractable advisories fails closed', (t) => {
  const f = fixture();
  t.after(f.cleanup);

  const spawnSyncImpl = () => ({
    status: 1,
    stdout: '{}',
    stderr: 'audit failed',
  });

  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: quietLog(),
  });

  assert.deepEqual(result, { ok: false });
});
