import test from 'node:test';
import assert from 'node:assert/strict';

import {
  readGovernanceCommandContext,
  executeGovernanceCommand,
} from '../lib/pr-governance.command.mjs';

const sha = 'a'.repeat(40);

const env = {
  GITHUB_REPOSITORY: 'EQ-LABS-TECH/ee-monorepo',
  PR_NUMBER: '42',
  PR_HEAD_SHA: sha,
  GOVERNANCE_APP_ID: '789',
  GOVERNANCE_PR_TOKEN: 'pr-token',
  GOVERNANCE_EVIDENCE_TOKEN: 'evidence-token',
  GOVERNANCE_PUBLISHER_TOKEN: 'publisher-token',
};

function result(status, classification = 'ORDINARY') {
  return {
    mode: 'EVALUATION_AND_PUBLICATION',
    headSha: sha,
    checkId: 456,
    classification,
    decision: { status },
    conclusion: status === 'PASS' ? 'success' : 'failure',
  };
}

test('parses trusted execution context', () => {
  const context = readGovernanceCommandContext(env);

  assert.equal(context.owner, 'EQ-LABS-TECH');
  assert.equal(context.repo, 'ee-monorepo');
  assert.equal(context.number, 42);
  assert.equal(context.expectedAppId, 789);
  assert.equal(context.expectedHeadSha, sha);
});

test('rejects missing and malformed trusted context', () => {
  for (const override of [
    { PR_NUMBER: '0' },
    { PR_NUMBER: '1.5' },
    { PR_HEAD_SHA: 'invalid' },
    { GOVERNANCE_APP_ID: '0' },
    { GOVERNANCE_APP_ID: 'abc' },
    { GOVERNANCE_PUBLISHER_TOKEN: '' },
    { GOVERNANCE_EVIDENCE_TOKEN: '' },
    { GITHUB_REPOSITORY: 'invalid' },
  ]) {
    assert.throws(
      () => readGovernanceCommandContext({ ...env, ...override }),
      /Invalid PN-017 trusted execution context/,
    );
  }
});

test('PASS returns zero and does not expose credentials', async () => {
  const messages = [];

  const exitCode = await executeGovernanceCommand({
    env,
    run: async () => result('PASS'),
    log: (message) => messages.push(message),
  });

  assert.equal(exitCode, 0);
  assert.equal(messages.length, 1);
  assert.equal(JSON.parse(messages[0]).conclusion, 'success');

  for (const token of [
    env.GOVERNANCE_PR_TOKEN,
    env.GOVERNANCE_EVIDENCE_TOKEN,
    env.GOVERNANCE_PUBLISHER_TOKEN,
  ]) {
    assert.equal(messages[0].includes(token), false);
  }
});

test('BLOCKED returns nonzero', async () => {
  const exitCode = await executeGovernanceCommand({
    env,
    run: async () => result('BLOCKED', 'CRITICAL'),
    log: () => {},
  });

  assert.equal(exitCode, 1);
});

test('pending classification never returns zero', async () => {
  const exitCode = await executeGovernanceCommand({
    env,
    run: async () => result('BLOCKED', 'PENDING_REVIEW'),
    log: () => {},
  });

  assert.equal(exitCode, 1);
});

test('inconsistent evaluation result is rejected', async () => {
  await assert.rejects(
    executeGovernanceCommand({
      env,
      run: async () => ({
        ...result('PASS'),
        headSha: 'b'.repeat(40),
      }),
      log: () => {},
    }),
    /Invalid PN-017 execution result/,
  );
});

test('invalid context prevents runner execution', async () => {
  let executed = false;

  await assert.rejects(
    executeGovernanceCommand({
      env: { ...env, GOVERNANCE_APP_ID: '' },
      run: async () => {
        executed = true;
        return result('PASS');
      },
      log: () => {},
    }),
    /Invalid PN-017 trusted execution context/,
  );

  assert.equal(executed, false);
});
