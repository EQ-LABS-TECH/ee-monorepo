import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import YAML from 'yaml';

const WORKFLOW_URL = new URL('../../.github/workflows/release.yml', import.meta.url);

function loadWorkflow() {
  const source = readFileSync(WORKFLOW_URL, 'utf8');
  const document = YAML.parseDocument(source, { uniqueKeys: true });

  assert.deepEqual(
    document.errors.map((error) => error.message),
    [],
    'Release workflow must contain valid YAML without duplicate keys',
  );

  return document.toJS();
}

function getSteps() {
  const workflow = loadWorkflow();

  assert.deepEqual(workflow.on?.push?.branches, ['main']);

  const job = workflow.jobs?.publish;
  assert.ok(job, 'Release workflow must define the publish job');
  assert.equal(job['runs-on'], 'ubuntu-latest');
  assert.ok(Array.isArray(job.steps), 'Publish job must contain steps');

  return {
    job,
    steps: job.steps,
  };
}

function getStep(steps, name) {
  const matches = steps.filter((step) => step.name === name);

  assert.equal(matches.length, 1, `Expected exactly one workflow step: ${name}`);

  return matches[0];
}

test('release workflow YAML and trigger are valid', () => {
  const { job } = getSteps();

  assert.equal(job.environment, 'release-main');
  assert.equal(job.permissions?.contents, 'read');
});

test('release steps preserve the required order', () => {
  const { steps } = getSteps();

  const required = [
    'Detect root version change',
    'Setup pnpm',
    'Setup Node.js',
    'Install dependencies',
    'Verify release manifest contract',
    'Prepare historical release dependencies',
    'Publish eligible public package versions and create tag',
    'Finalize internal platform release without npm credentials',
    'Create release publisher token',
    'Push release tag',
    'Verify remote release tag',
  ];

  const names = steps.map((step) => step.name);

  const positions = required.map((name) => {
    getStep(steps, name);
    return names.indexOf(name);
  });

  assert.ok(
    positions.every((position, index) => index === 0 || position > positions[index - 1]),
    'Required release steps must execute in the expected order',
  );
});

test('release preparation reuses the verified historical plan', () => {
  const { steps } = getSteps();

  const prepare = getStep(steps, 'Prepare historical release dependencies');

  assert.equal(prepare.if, "steps.release.outputs.changed == 'true'");

  assert.equal(prepare.shell, 'bash');

  assert.match(prepare.run, /prepareHistoricalReleaseDependencies/);

  assert.match(prepare.run, /scripts\/lib\/reconstruct-release-plan\.mjs/);

  assert.doesNotMatch(
    prepare.run,
    /git\s+worktree\s+(?:add|remove)|pnpm\s+fetch/,
    'Workflow must reuse the shared worktree implementation',
  );
});

test('preparation has no publication credentials or effects', () => {
  const { job, steps } = getSteps();

  const prepare = getStep(steps, 'Prepare historical release dependencies');
  const publish = getStep(steps, 'Publish eligible public package versions and create tag');
  const internal = getStep(steps, 'Finalize internal platform release without npm credentials');

  assert.equal(
    job.env?.NODE_AUTH_TOKEN,
    undefined,
    'Publication token must not be configured at job level',
  );

  assert.equal(prepare.env?.NODE_AUTH_TOKEN, undefined);

  assert.doesNotMatch(prepare.run, /NODE_AUTH_TOKEN|NPM_TOKEN|npm\s+publish|git\s+push/);

  assert.equal(publish.env?.NODE_AUTH_TOKEN, '${{ secrets.NPM_TOKEN }}');
  assert.match(publish.if, /release_type == 'public'/);
  assert.equal(internal.env?.NODE_AUTH_TOKEN, undefined);
  assert.equal(internal.env?.NPM_TOKEN, undefined);
  assert.match(internal.if, /release_type == 'internal'/);

  assert.match(publish.run, /pnpm run release -- publish/);
});

test('publication and remote tag verification remain gated', () => {
  const { steps } = getSteps();

  const required = [
    'Verify release manifest contract',
    'Prepare historical release dependencies',
    'Publish eligible public package versions and create tag',
    'Finalize internal platform release without npm credentials',
    'Create release publisher token',
    'Push release tag',
    'Verify remote release tag',
  ];

  for (const name of required) {
    const step = getStep(steps, name);

    assert.match(step.if, /steps\.release\.outputs\.changed == 'true'/);
  }

  const manifest = getStep(steps, 'Verify release manifest contract');
  const verifyTag = getStep(steps, 'Verify remote release tag');

  assert.match(manifest.run, /validateReleaseTrigger/);
  assert.match(manifest.run, /release_type=\$\{result\.releaseType\}/);
  assert.match(verifyTag.run, /inspectRemoteReleaseTag/);
  assert.match(verifyTag.run, /platform-v\$\{version\}/);
});

test('release publication precedes tag push and remote verification', () => {
  const { steps } = getSteps();

  const names = steps.map((step) => step.name);

  const publishIndex = names.indexOf('Publish eligible public package versions and create tag');
  const internalIndex = names.indexOf('Finalize internal platform release without npm credentials');
  const pushIndex = names.indexOf('Push release tag');
  const verifyIndex = names.indexOf('Verify remote release tag');

  assert.ok(publishIndex >= 0, 'Publication step must exist');
  assert.ok(
    pushIndex > publishIndex && pushIndex > internalIndex,
    'Tag push must follow release finalization',
  );
  assert.ok(verifyIndex > pushIndex, 'Remote verification must follow tag push');

  const push = getStep(steps, 'Push release tag');
  const verify = getStep(steps, 'Verify remote release tag');

  assert.match(push.run, /git -c credential\.helper= push origin/);
  assert.match(push.run, /platform-v\$\{version\}/);
  assert.match(verify.run, /git ls-remote --tags origin/);
  assert.match(verify.run, /inspectRemoteReleaseTag/);
});

test('npm publication token is scoped to the publication step', () => {
  const { job, steps } = getSteps();

  const publish = getStep(steps, 'Publish eligible public package versions and create tag');
  const internal = getStep(steps, 'Finalize internal platform release without npm credentials');

  assert.equal(job.env?.NODE_AUTH_TOKEN, undefined);
  assert.equal(job.env?.NPM_TOKEN, undefined);

  assert.equal(publish.env?.NODE_AUTH_TOKEN, '${{ secrets.NPM_TOKEN }}');
  assert.equal(internal.env?.NODE_AUTH_TOKEN, undefined);
  assert.equal(internal.env?.NPM_TOKEN, undefined);

  for (const step of steps) {
    if (step.name === publish.name) continue;

    assert.equal(
      step.env?.NODE_AUTH_TOKEN,
      undefined,
      `${step.name} must not receive NODE_AUTH_TOKEN`,
    );

    assert.equal(step.env?.NPM_TOKEN, undefined, `${step.name} must not receive NPM_TOKEN`);
  }
});

test('checkout does not persist GitHub credentials', () => {
  const { steps } = getSteps();
  const checkout = getStep(steps, 'Checkout');

  assert.equal(checkout.with?.['persist-credentials'], false);
});

test('release publisher token is scoped and created after publication', () => {
  const { job, steps } = getSteps();

  const publish = getStep(steps, 'Publish eligible public package versions and create tag');
  const internal = getStep(steps, 'Finalize internal platform release without npm credentials');
  const createToken = getStep(steps, 'Create release publisher token');
  const push = getStep(steps, 'Push release tag');
  const verify = getStep(steps, 'Verify remote release tag');

  const names = steps.map((step) => step.name);

  assert.ok(names.indexOf(createToken.name) > names.indexOf(publish.name));
  assert.ok(names.indexOf(createToken.name) > names.indexOf(internal.name));
  assert.ok(names.indexOf(createToken.name) < names.indexOf(push.name));
  assert.ok(names.indexOf(verify.name) > names.indexOf(push.name));

  assert.equal(job.permissions?.contents, 'read');

  assert.equal(
    createToken.uses,
    'actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510',
  );

  assert.equal(createToken.id, 'release_app');
  assert.equal(createToken.with?.['client-id'], '${{ vars.EE_RELEASE_APP_CLIENT_ID }}');
  assert.equal(createToken.with?.['app-id'], undefined);
  assert.equal(createToken.with?.['private-key'], '${{ secrets.EE_RELEASE_APP_PRIVATE_KEY }}');
  assert.equal(createToken.with?.['permission-contents'], 'write');

  assert.equal(createToken.if, "steps.release.outputs.changed == 'true'");

  assert.equal(push.env?.RELEASE_APP_TOKEN, '${{ steps.release_app.outputs.token }}');

  assert.match(push.run, /GIT_CONFIG_COUNT=1/);
  assert.match(push.run, /GIT_CONFIG_VALUE_0/);
  assert.match(push.run, /git -c credential\.helper= push origin/);

  assert.equal(publish.env?.RELEASE_APP_TOKEN, undefined);
  assert.equal(verify.env?.RELEASE_APP_TOKEN, undefined);

  for (const step of steps) {
    if (step.name === createToken.name) continue;

    assert.equal(
      step.with?.['private-key'],
      undefined,
      `${step.name} must not receive the App private key`,
    );
  }

  for (const step of steps) {
    if (step.name === push.name) continue;

    assert.equal(
      step.env?.RELEASE_APP_TOKEN,
      undefined,
      `${step.name} must not receive the release publisher token`,
    );
  }
});
