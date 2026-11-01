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

test('governance verification runs only for trusted PR target events', () => {
  const workflow = readWorkflow();

  assert.deepEqual(Object.keys(workflow.on), [
    'pull_request_target',
    'workflow_run',
    'schedule',
    'workflow_dispatch',
  ]);
  assert.deepEqual(workflow.on.schedule, [{ cron: '17 * * * *' }]);
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_review'), false);
  assert.match(workflow.jobs.verify.if, /github\.event_name == 'pull_request_target'/);
  assert.match(workflow.jobs.verify.if, /github\.event\.pull_request\.base\.ref == 'main'/);
  assert.equal(workflow.jobs.verify.name, 'Verify PR Governance');
});

test('workflow serializes governance executions with a bounded queue', () => {
  const workflow = readWorkflow();

  assert.equal(workflow.concurrency.group, 'pr-governance-${{ github.repository }}');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.equal(workflow.concurrency.queue, 'max');
});

test('workflow executes only trusted main implementation', () => {
  const workflow = readWorkflow();
  const steps = workflow.jobs.verify.steps;

  const checkout = steps.find((step) => step.name === 'Checkout trusted implementation');

  assert.equal(checkout.with.ref, 'main');
  assert.equal(checkout.with['persist-credentials'], false);
  assert.equal(workflow.jobs.verify.environment, 'governance-main');
  assert.ok(
    steps.findIndex((step) => step.name === 'Setup pnpm') <
      steps.findIndex((step) => step.name === 'Setup Node.js'),
  );
  assert.equal(
    steps.find((step) => step.name === 'Install workspace dependencies').run,
    'pnpm install --frozen-lockfile',
  );

  const execute = steps.find((step) => step.name === 'Execute trusted governance');
  const resolve = steps.find((step) => step.name === 'Resolve current PR HEAD');

  assert.match(execute.run, /node scripts\/commands\/enforce/);
  assert.match(resolve.run, /PR_HEAD_SHA=\$\{resolved\.expectedHeadSha\}/);
  assert.match(resolve.run, /validateRequestedPrGovernanceHead/);
  assert.equal(resolve.env.REQUESTED_HEAD_SHA, "${{ inputs.head_sha || '' }}");
  assert.equal(resolve.env.GITHUB_EVENT_NAME, '${{ github.event_name }}');
  assert.equal(
    resolve.env.PR_NUMBER,
    '${{ github.event.pull_request.number || inputs.pr_number }}',
  );
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

test('automatic governance triggers do not silently enable required-check enforcement', () => {
  const workflow = readWorkflow();

  assert.ok(Object.hasOwn(workflow.on, 'pull_request_target'));
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_review'), false);
  assert.ok(Object.hasOwn(workflow.on, 'workflow_run'));
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'));

  assert.match(workflow.jobs.verify.if, /github\.ref == 'refs\/heads\/main'/);
  assert.equal(workflow.concurrency['cancel-in-progress'], false);

  assert.equal(Object.hasOwn(workflow.on, 'repository_dispatch'), false);
  assert.match(workflow.jobs.reconcile.if, /github\.event\.workflow_run\.event == 'pull_request'/);
  assert.match(
    workflow.jobs.reconcile.if,
    /github\.event\.workflow_run\.event == 'pull_request_review'/,
  );
  assert.equal(workflow.jobs.reconcile.environment, 'governance-main');
  assert.ok(
    workflow.jobs.reconcile.steps.find((step) => step.name === 'Install workspace dependencies'),
  );
  assert.match(workflow.jobs.reconcile.if, /github\.event_name == 'schedule'/);
  assert.match(workflow.jobs.reconcile.if, /github\.ref == 'refs\/heads\/main'/);
});
