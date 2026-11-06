import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  classifyReleasePlan,
  finalizeInternalRelease,
  getReleaseTag,
} from '../lib/internal-release.mjs';

const privateManifest = {
  releases: [{ name: '@eq-labs/core', version: '1.2.0', type: 'minor' }],
  packages: [{ name: '@eq-labs/core', version: '1.2.0', private: true }],
};

test('classifies all-private Changesets plans as internal without public packages', () => {
  assert.deepEqual(classifyReleasePlan(privateManifest), {
    releaseType: 'internal',
    plannedPackages: privateManifest.packages,
    publicPackages: [],
  });
  assert.equal(getReleaseTag('internal', '1.2.0'), 'platform-v1.2.0');
});

test('Changesets versions private packages without creating per-package tags', () => {
  const config = JSON.parse(
    readFileSync(new URL('../../.changeset/config.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(config.privatePackages, { version: true, tag: false });
});

test('keeps a plan with an explicitly public package on the public release path', () => {
  const manifest = {
    releases: [{ name: '@eq-labs/public', version: '1.2.0', type: 'patch' }],
    packages: [{ name: '@eq-labs/public', version: '1.2.0', private: false }],
  };
  assert.equal(classifyReleasePlan(manifest).releaseType, 'public');
  assert.equal(getReleaseTag('public', '1.2.0'), 'v1.2.0');
});

test('rejects empty plans, unknown packages, and malformed release tags', () => {
  assert.throws(
    () => classifyReleasePlan({ releases: [], packages: [] }),
    /non-empty release plan/,
  );
  assert.throws(
    () =>
      classifyReleasePlan({
        releases: [{ name: 'missing' }],
        packages: [{ name: 'other', private: true }],
      }),
    /no verified privacy status/,
  );
  assert.throws(() => getReleaseTag('internal', 'latest'), /Invalid release version/);
});

test('internal finalization validates and builds before creating its tag', async () => {
  const events = [];
  const result = await finalizeInternalRelease({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    inspectTag: async () => ({ state: 'absent' }),
    createTag: async () => events.push('create-tag'),
  });
  assert.deepEqual(events, ['validate', 'build', 'create-tag']);
  assert.deepEqual(result, { state: 'created' });
});

test('matching remote internal tag is an idempotent recovery after validation', async () => {
  const events = [];
  const result = await finalizeInternalRelease({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    inspectTag: async () => ({ state: 'matches' }),
    createTag: async () => events.push('create-tag'),
  });
  assert.deepEqual(events, ['validate', 'build']);
  assert.deepEqual(result, { state: 'already-complete' });
});

test('refuses conflicting tags and a remote race without creating or moving a tag', async () => {
  const calls = [];
  await assert.rejects(
    finalizeInternalRelease({
      validate: async () => calls.push('validate'),
      build: async () => calls.push('build'),
      inspectTag: async () => ({ state: 'conflict' }),
      createTag: async () => calls.push('create-tag'),
    }),
    /different commit/,
  );
  assert.deepEqual(calls, []);

  let inspections = 0;
  await assert.rejects(
    finalizeInternalRelease({
      validate: async () => calls.push('validate'),
      build: async () => calls.push('build'),
      inspectTag: async () => (++inspections === 1 ? { state: 'absent' } : { state: 'conflict' }),
      createTag: async () => calls.push('create-tag'),
    }),
    /changed during validation/,
  );
  assert.deepEqual(calls, ['validate', 'build']);
});

test('failed validation or build never creates an internal tag', async () => {
  const events = [];
  await assert.rejects(
    finalizeInternalRelease({
      validate: async () => {
        events.push('validate');
        throw new Error('validation failed');
      },
      build: async () => events.push('build'),
      inspectTag: async () => ({ state: 'absent' }),
      createTag: async () => events.push('create-tag'),
    }),
    /validation failed/,
  );
  assert.deepEqual(events, ['validate']);
});
