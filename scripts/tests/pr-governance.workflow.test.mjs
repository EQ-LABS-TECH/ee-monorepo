import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import YAML from 'yaml';

const WORKFLOW_URL = new URL('../../.github/workflows/ci.yml', import.meta.url);

function loadWorkflow() {
  const source = readFileSync(WORKFLOW_URL, 'utf8');
  const document = YAML.parseDocument(source, { uniqueKeys: true });

  assert.deepEqual(
    document.errors.map((error) => error.message),
    [],
    'CI workflow must contain valid YAML without duplicate keys',
  );

  return document.toJS();
}

function getJob(workflow, name) {
  const job = workflow.jobs?.[name];

  assert.ok(job, `CI workflow must define job: ${name}`);
  assert.ok(Array.isArray(job.steps), `${name} must define steps`);

  return job;
}

function getStep(job, name) {
  const matches = job.steps.filter((step) => step.name === name);

  assert.equal(matches.length, 1, `Expected exactly one step: ${name}`);

  return matches[0];
}

test('CI preserves pull request, main push and manual triggers', () => {
  const workflow = loadWorkflow();

  assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
  assert.deepEqual(workflow.on?.push?.branches, ['main']);
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'));
  assert.deepEqual(workflow.permissions, { contents: 'read' });
});

test('Validate preserves its existing quality gates', () => {
  const workflow = loadWorkflow();
  const job = getJob(workflow, 'validate');

  assert.equal(job.name, 'Validate');
  assert.equal(job['runs-on'], 'ubuntu-latest');

  const expectedSteps = [
    'Checkout',
    'Secret detection (QG-SEC-002)',
    'Setup pnpm',
    'Setup Node.js',
    'Install dependencies',
    'Install Playwright Browsers',
    'Lint',
    'Typecheck',
    'Build',
    'Test',
    'Validate',
  ];

  assert.deepEqual(
    job.steps.map((step) => step.name),
    expectedSteps,
    'Validate quality gates must remain in their established order',
  );

  const commands = {
    Lint: 'pnpm run lint',
    Typecheck: 'pnpm run typecheck',
    Build: 'pnpm run build',
    Test: 'pnpm run test',
    Validate: 'pnpm run validate',
  };

  for (const [name, command] of Object.entries(commands)) {
    assert.equal(getStep(job, name).run, command);
  }

  assert.match(getStep(job, 'Secret detection (QG-SEC-002)').run, /gitleaks detect/);
});

test('governance advisory runs only for same-repository pull requests', () => {
  const workflow = loadWorkflow();
  const job = getJob(workflow, 'pr-governance-advisory');

  assert.equal(job.name, 'PR Governance Advisory');
  assert.equal(job['runs-on'], 'ubuntu-latest');

  assert.match(job.if, /github\.event_name == 'pull_request'/);
  assert.match(job.if, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
});

test('governance advisory uses read-only permissions', () => {
  const workflow = loadWorkflow();
  const job = getJob(workflow, 'pr-governance-advisory');

  assert.deepEqual(job.permissions, {
    contents: 'read',
    'pull-requests': 'read',
  });

  assert.equal(job.env?.GITHUB_TOKEN, undefined);

  for (const step of job.steps) {
    if (step.name === 'Inspect PR governance') continue;

    assert.equal(
      step.env?.GITHUB_TOKEN,
      undefined,
      `${step.name} must not receive an explicit GITHUB_TOKEN`,
    );
  }
});

test('governance advisory checks out trusted main implementation', () => {
  const workflow = loadWorkflow();
  const job = getJob(workflow, 'pr-governance-advisory');

  const checkout = getStep(job, 'Checkout trusted governance implementation');

  assert.match(checkout.uses, /^actions\/checkout@[0-9a-f]{40}$/);
  assert.equal(checkout.with?.ref, 'main');
  assert.equal(checkout.with?.['persist-credentials'], false);

  const setup = getStep(job, 'Setup Node.js');

  assert.match(setup.uses, /^actions\/setup-node@[0-9a-f]{40}$/);
  assert.equal(setup.with?.['node-version-file'], '.nvmrc');
});

test('governance inspector receives PR context and remains advisory', () => {
  const workflow = loadWorkflow();
  const job = getJob(workflow, 'pr-governance-advisory');

  const inspect = getStep(job, 'Inspect PR governance');

  assert.equal(inspect.shell, 'bash');
  assert.equal(inspect.env?.GITHUB_TOKEN, '${{ github.token }}');
  assert.equal(inspect.env?.GITHUB_REPOSITORY, '${{ github.repository }}');
  assert.equal(inspect.env?.PR_NUMBER, '${{ github.event.pull_request.number }}');

  assert.match(inspect.run, /\[\[ ! -f scripts\/commands\/governance \]\]/);
  assert.match(inspect.run, /PN-017 advisory unavailable/);
  assert.match(
    inspect.run,
    /if \[\[ ! -f scripts\/commands\/governance \]\]; then[\s\S]*?exit 0[\s\S]*?fi/,
    'Missing trusted inspector must remain an explicitly documented advisory skip',
  );
  assert.match(inspect.run, /node scripts\/commands\/governance/);

  assert.equal(job.needs, undefined, 'Advisory job must remain independent of Validate');
});
