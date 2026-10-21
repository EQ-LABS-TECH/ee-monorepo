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
  };
  return `# waiver\n\n| Campo | Valor |\n| --- | --- |\n${Object.entries(fields)
    .filter(([key]) => key !== omit)
    .map(([key, value]) => `| **${key}** | ${value} |`)
    .join('\n')}\n`;
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

test('textual fallback only fires when structured extraction yields nothing', () => {
  // Estructurado con high → se captura; fallback NO corre; GHSA_B (solo en texto) se descarta.
  const withHigh = extractAdvisories(
    JSON.stringify({ vulnerabilities: [{ github_advisory_id: GHSA_A, severity: 'high' }] }),
    `extra ${GHSA_B}`,
  );
  assert.deepEqual([...withHigh], [GHSA_A.toLowerCase()]);

  // Estructurado vacío → fallback corre y captura ambos GHSA del texto.
  const emptyStructured = extractAdvisories('{}', `${GHSA_A} and ${GHSA_B}`);
  assert.deepEqual(
    [...emptyStructured].sort(),
    [GHSA_A.toLowerCase(), GHSA_B.toLowerCase()].sort(),
  );
});

test('all advisories must be covered; duplicate waivers only report relevant advisory', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(join(f.dir, 'EE-WAIVE-a.md'), waiver());
  writeFileSync(join(f.dir, 'EE-WAIVE-a-duplicate.md'), waiver());
  const calls = [];
  const spawnSyncImpl = (_command, args) => {
    calls.push(args);
    if (!args.includes('--json')) return { status: 1 };
    return {
      status: 1,
      stdout: JSON.stringify({
        vulnerabilities: [
          { github_advisory_id: GHSA_A, severity: 'high' },
          { github_advisory_id: GHSA_B, severity: 'high' },
        ],
      }),
      stderr: '',
    };
  };
  const messages = [];
  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: { log: (m) => messages.push(m), error: (m) => messages.push(m) },
  });
  assert.equal(result.ok, false);
  assert.ok(messages.some((message) => message.includes(GHSA_B.toLowerCase())));
  assert.equal(calls[0][1], '--audit-level');
});

test('all covered findings pass only with valid active waivers', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  writeFileSync(join(f.dir, 'EE-WAIVE-a.md'), waiver());
  const spawnSyncImpl = (_command, args) =>
    args.includes('--json')
      ? {
          status: 1,
          stdout: JSON.stringify({
            vulnerabilities: [{ github_advisory_id: GHSA_A, severity: 'high' }],
          }),
          stderr: '',
        }
      : { status: 1 };
  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: { log() {}, error() {} },
  });
  assert.deepEqual(result, { ok: true, waived: true });
});

test('audit failure without extractable advisory never passes', (t) => {
  const f = fixture();
  t.after(f.cleanup);
  const spawnSyncImpl = (_command, args) =>
    args.includes('--json')
      ? { status: 1, stdout: '{invalid', stderr: 'audit failed' }
      : { status: 1 };
  const result = runSecurityAuditWithWaivers({
    root: f.root,
    spawnSyncImpl,
    today: TODAY,
    log: { log() {}, error() {} },
  });
  assert.deepEqual(result, { ok: false });
});

test('extractAdvisories filters out moderate/low findings', () => {
  const stdout = JSON.stringify({
    advisories: {
      1: { github_advisory_id: 'GHSA-aaaa-bbbb-cccc', severity: 'moderate' },
      2: { github_advisory_id: 'GHSA-dddd-eeee-ffff', severity: 'high' },
      3: { github_advisory_id: 'GHSA-gggg-hhhh-iiii', severity: 'critical' },
      4: { github_advisory_id: 'GHSA-jjjj-kkkk-llll', severity: 'low' },
    },
  });
  const result = extractAdvisories(stdout, '');
  assert.ok(result.has('ghsa-dddd-eeee-ffff'), 'high debe capturarse');
  assert.ok(result.has('ghsa-gggg-hhhh-iiii'), 'critical debe capturarse');
  assert.ok(!result.has('ghsa-aaaa-bbbb-cccc'), 'moderate no debe capturarse');
  assert.ok(!result.has('ghsa-jjjj-kkkk-llll'), 'low no debe capturarse');
});

test('extractAdvisories falls back to text when structured extraction yields nothing', () => {
  const stdout = JSON.stringify({ vulnerabilities: [] });
  const stderr = 'found GHSA-xxxx-yyyy-zzzz severity=high';
  const result = extractAdvisories(stdout, stderr);
  assert.ok(result.has('ghsa-xxxx-yyyy-zzzz'));
});
