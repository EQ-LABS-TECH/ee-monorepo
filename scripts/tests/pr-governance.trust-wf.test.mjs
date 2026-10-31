import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import YAML from 'yaml';

const workflowUrl = new URL('../../.github/workflows/governance.yml', import.meta.url);

function readWorkflow() {
  const document = YAML.parseDocument(readFileSync(workflowUrl, 'utf8'), {
    uniqueKeys: true,
  });

  assert.deepEqual(document.errors, []);

  return document.toJS();
}

test('governance verification is manual-only', () => {
  const workflow = readWorkflow();

  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
  assert.equal(workflow.jobs.verify.if, "github.ref == 'refs/heads/main'");
  assert.equal(workflow.jobs.verify.name, 'Verify PR Governance');
});

test('workflow serializes execution by PR without cancellation', () => {
  const workflow = readWorkflow();

  assert.match(workflow.concurrency.group, /inputs\.pr_number/);
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
});

test('workflow executes only trusted main implementation', () => {
  const workflow = readWorkflow();
  const steps = workflow.jobs.verify.steps;

  const checkout = steps.find((step) => step.name === 'Checkout trusted implementation');

  assert.equal(checkout.with.ref, 'main');
  assert.equal(checkout.with['persist-credentials'], false);

  const execute = steps.find((step) => step.name === 'Execute trusted governance');

  assert.match(execute.run, /node scripts\/commands\/enforce/);
  assert.equal(execute.env.PR_HEAD_SHA, '${{ inputs.head_sha }}');
  assert.equal(execute.env.GOVERNANCE_APP_ID, '${{ vars.EE_GOVERNANCE_APP_ID }}');
});

test('governance App is separate and scoped', () => {
  const workflow = readWorkflow();
  const steps = workflow.jobs.verify.steps;

  const token = steps.find((step) => step.name === 'Create governance App token');

  assert.match(token.uses, /^actions\/create-github-app-token@[a-f0-9]{40}$/);
  assert.equal(token.with['permission-checks'], 'write');
  assert.equal(token.with['permission-members'], 'read');
  assert.equal(token.with['permission-pull-requests'], 'read');

  assert.equal(token.with['client-id'], '${{ vars.EE_GOVERNANCE_APP_CLIENT_ID }}');
  assert.equal(token.with['private-key'], '${{ secrets.EE_GOVERNANCE_APP_PRIVATE_KEY }}');

  assert.equal(JSON.stringify(workflow).includes('EE_RELEASE_APP_'), false);
});

test('workflow grants no write permissions to GITHUB_TOKEN', () => {
  const workflow = readWorkflow();

  assert.deepEqual(workflow.permissions, {
    contents: 'read',
    'pull-requests': 'read',
  });
});

test('trusted workflow never executes pull request source code', () => {
  const workflow = readWorkflow();
  const steps = workflow.jobs.verify.steps;

  const checkoutSteps = steps.filter((step) => step.uses?.startsWith('actions/checkout@'));

  assert.equal(checkoutSteps.length, 1);
  assert.equal(checkoutSteps[0].with.ref, 'main');
  assert.equal(checkoutSteps[0].with['persist-credentials'], false);

  for (const step of steps) {
    const serialized = JSON.stringify(step);

    assert.doesNotMatch(serialized, /github\.event\.pull_request\.head\.sha/);
    assert.doesNotMatch(serialized, /refs\/pull\//);
    assert.doesNotMatch(serialized, /pull_request\.head\.ref/);
  }
});

test('trusted workflow does not expose App credentials to shell commands', () => {
  const workflow = readWorkflow();
  const steps = workflow.jobs.verify.steps;

  const execution = steps.find((step) => step.name === 'Execute trusted governance');

  assert.ok(execution);

  assert.equal(execution.shell, 'bash');
  assert.doesNotMatch(execution.run, /secrets\./);
  assert.doesNotMatch(execution.run, /private.key/i);
  assert.doesNotMatch(execution.run, /echo.*TOKEN/i);

  assert.equal(
    execution.env.GOVERNANCE_PUBLISHER_TOKEN,
    '${{ steps.governance-token.outputs.token }}',
  );
});

test('manual governance does not silently enable automatic enforcement', () => {
  const workflow = readWorkflow();

  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);

  assert.equal(workflow.jobs.verify.if, "github.ref == 'refs/heads/main'");
  assert.equal(workflow.concurrency['cancel-in-progress'], false);

  assert.equal(Object.hasOwn(workflow.on, 'pull_request_target'), false);
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_review'), false);
  assert.equal(Object.hasOwn(workflow.on, 'repository_dispatch'), false);
});
