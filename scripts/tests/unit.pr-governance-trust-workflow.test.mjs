import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import YAML from 'yaml';

const workflowUrl = new URL('../../.github/workflows/governance.yml', import.meta.url);
const ciWorkflowUrl = new URL('../../.github/workflows/ci.yml', import.meta.url);
const ciMainWorkflowUrl = new URL('../../.github/workflows/ci-main.yml', import.meta.url);

function readWorkflow(url = workflowUrl) {
  const document = YAML.parseDocument(readFileSync(url, 'utf8'), {
    uniqueKeys: true,
  });

  assert.deepEqual(document.errors, []);

  return document.toJS();
}

test('CI validation and Governance review triggers are separated', () => {
  const ci = readWorkflow(ciWorkflowUrl);
  const ciMain = readWorkflow(ciMainWorkflowUrl);
  const governance = readWorkflow();

  assert.equal(ci.name, 'CI');
  assert.ok(Object.hasOwn(ci.on, 'pull_request'));
  assert.equal(Object.hasOwn(ci.on, 'pull_request_review'), false);
  assert.equal(Object.hasOwn(ci.on, 'push'), false);
  assert.equal(Object.hasOwn(ci.on, 'workflow_dispatch'), false);
  assert.equal(ci.jobs.validate.name, 'Validate');
  assert.equal(ci.on.pull_request?.branches, undefined);

  assert.equal(ciMain.name, 'CI Main');
  assert.deepEqual(ciMain.on.push.branches, ['main']);
  assert.ok(Object.hasOwn(ciMain.on, 'workflow_dispatch'));
  assert.equal(Object.hasOwn(ciMain.on, 'pull_request'), false);
  assert.equal(Object.hasOwn(ciMain.on, 'pull_request_review'), false);
  assert.equal(ciMain.jobs.validate.name, 'Validate Main');
  assert.notEqual(ci.jobs.validate.name, ciMain.jobs.validate.name);

  assert.deepEqual(governance.on.workflow_run.workflows, ['CI']);
  assert.deepEqual(governance.on.workflow_run.types, ['completed']);
  assert.deepEqual(governance.on.pull_request_review.types, ['submitted', 'edited', 'dismissed']);
  assert.match(governance['run-name'], /format\('GV PR #\{0\} · R\{1\}'/);
  assert.ok(Object.hasOwn(governance.on.workflow_dispatch.inputs, 'head_sha'));
  assert.equal(
    Object.keys(governance.on.workflow_dispatch.inputs).filter((key) => key === 'review_run_number')
      .length,
    1,
  );
});

test('governance reevaluates completed CI, reviews and PR comments', () => {
  const workflow = readWorkflow();

  assert.deepEqual(Object.keys(workflow.on), [
    'workflow_run',
    'pull_request_review',
    'issue_comment',
    'schedule',
    'workflow_dispatch',
  ]);
  assert.deepEqual(workflow.on.schedule, [{ cron: '17 * * * *' }]);
  assert.deepEqual(workflow.on.issue_comment.types, ['created', 'edited', 'deleted']);
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_target'), false);
  assert.ok(Object.hasOwn(workflow.on, 'pull_request_review'));
  assert.match(workflow.jobs.verify.if, /github\.event_name == 'workflow_dispatch'/);
  assert.equal(workflow.jobs.verify.name, 'PR Governance Verify');

  const reviewRelay = workflow.jobs['dispatch-review'];
  assert.ok(reviewRelay);
  assert.match(reviewRelay.if, /github\.event_name == 'pull_request_review'/);
  assert.equal(reviewRelay.environment, undefined);
  assert.deepEqual(reviewRelay.permissions, {
    actions: 'write',
    contents: 'read',
    'pull-requests': 'read',
    checks: 'read',
  });

  const relaySteps = reviewRelay.steps;
  const checkout = relaySteps[0];
  assert.equal(checkout.name, 'Checkout trusted main implementation');
  assert.equal(checkout.with.ref, 'main');
  assert.equal(checkout.with['persist-credentials'], false);
  assert.equal(relaySteps[1].name, 'Setup pnpm');
  assert.equal(relaySteps[2].name, 'Setup Node.js');
  assert.equal(relaySteps[2].with['node-version-file'], '.nvmrc');
  assert.equal(relaySteps[3].run, 'pnpm install --frozen-lockfile');

  const relay = relaySteps[4];
  assert.equal(relay.name, 'Dispatch governance verification on main');
  assert.match(relay.run, /node scripts\/commands\/relay/);
  assert.equal(relay.env.GITHUB_EVENT_NAME, '${{ github.event_name }}');
  assert.equal(relay.env.GITHUB_EVENT_PATH, '${{ github.event_path }}');
  assert.equal(relay.env.GITHUB_RUN_ID, '${{ github.run_id }}');
  assert.equal(relay.env.GITHUB_RUN_NUMBER, '${{ github.run_number }}');
  assert.equal(relay.env.PR_NUMBER, '${{ github.event.pull_request.number }}');
  assert.equal(relay.env.PR_HEAD_SHA, '${{ github.event.pull_request.head.sha }}');
  assert.equal(relay.env.GOVERNANCE_APP_ID, '${{ vars.EE_GOVERNANCE_APP_ID }}');
  assert.equal(Object.hasOwn(relay.env, 'GOVERNANCE_PUBLISHER_TOKEN'), false);
  assert.equal(Object.hasOwn(relay.env, 'GOVERNANCE_EVIDENCE_TOKEN'), false);
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
  assert.equal(resolve.env.PR_NUMBER, '${{ inputs.pr_number }}');
  assert.equal(execute.env.PR_NUMBER, '${{ inputs.pr_number }}');
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

  assert.equal(Object.hasOwn(workflow.on, 'pull_request_target'), false);
  assert.ok(Object.hasOwn(workflow.on, 'pull_request_review'));
  assert.ok(Object.hasOwn(workflow.on, 'workflow_run'));
  assert.ok(Object.hasOwn(workflow.on, 'issue_comment'));
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'));

  assert.match(workflow.jobs.verify.if, /github\.ref == 'refs\/heads\/main'/);
  assert.equal(workflow.concurrency['cancel-in-progress'], false);

  assert.equal(Object.hasOwn(workflow.on, 'repository_dispatch'), false);
  assert.match(workflow.jobs.reconcile.if, /github\.event\.workflow_run\.event == 'pull_request'/);
  assert.match(
    workflow.jobs.reconcile.if,
    /github\.event\.workflow_run\.event == 'pull_request_review'/,
  );
  assert.doesNotMatch(workflow.jobs.reconcile.if, /github\.event_name == 'pull_request_review'/);
  assert.match(
    workflow.jobs['dispatch-review'].if,
    /github\.event\.pull_request\.base\.ref == 'main'/,
  );
  assert.equal(workflow.jobs['dispatch-review'].environment, undefined);
  assert.equal(workflow.jobs['dispatch-review'].permissions.actions, 'write');
  assert.match(
    workflow.jobs['dispatch-review'].steps.find(
      (step) => step.name === 'Dispatch governance verification on main',
    ).run,
    /node scripts\/commands\/relay/,
  );
  assert.match(workflow.jobs.reconcile.if, /github\.event_name == 'issue_comment'/);
  assert.match(workflow.jobs.reconcile.if, /github\.event\.issue\.pull_request != null/);
  assert.equal(workflow.jobs.reconcile.environment, 'governance-main');
  assert.ok(
    workflow.jobs.reconcile.steps.find((step) => step.name === 'Install workspace dependencies'),
  );
  assert.match(workflow.jobs.reconcile.if, /github\.event_name == 'schedule'/);
  assert.match(workflow.jobs.reconcile.if, /github\.ref == 'refs\/heads\/main'/);
});
