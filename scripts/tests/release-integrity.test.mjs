import test from 'node:test';
import assert from 'node:assert/strict';
import { getEligiblePackages, publishThenTag } from '../lib/release-integrity.mjs';

const packages = [
  { name: '@eq-labs/public-new', version: '1.2.0', private: false },
  { name: '@eq-labs/public-existing', version: '2.0.0', private: false },
  { name: '@eq-labs/private', version: '1.0.0', private: true },
];

test('eligibility excludes private packages and versions already in the registry', () => {
  const eligible = getEligiblePackages(
    packages,
    (name, version) => name === '@eq-labs/public-existing' && version === '2.0.0',
  );
  assert.deepEqual(
    eligible.map((pkg) => pkg.name),
    ['@eq-labs/public-new'],
  );
});

test('publication happens after validation/build and before tag creation', async () => {
  const events = [];
  const result = await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    packages,
    registryHasVersion: (name) => name === '@eq-labs/public-existing',
    publish: async (pkg) => events.push(`publish:${pkg.name}`),
    createTag: async () => events.push('tag'),
  });
  assert.deepEqual(events, ['validate', 'build', 'publish:@eq-labs/public-new', 'tag']);
  assert.deepEqual(result.published, [{ name: '@eq-labs/public-new', version: '1.2.0' }]);
});

test('tag is not created when publication fails', async () => {
  const events = [];
  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      packages: [packages[0]],
      registryHasVersion: () => false,
      publish: async () => {
        events.push('publish');
        throw new Error('registry unavailable');
      },
      createTag: async () => events.push('tag'),
    }),
    /registry unavailable/,
  );
  assert.deepEqual(events, ['validate', 'build', 'publish']);
});

test('tag is created when there are no eligible packages', async () => {
  const events = [];
  const result = await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    packages: [packages[2]],
    registryHasVersion: () => false,
    publish: async () => events.push('publish'),
    createTag: async () => events.push('tag'),
  });
  assert.deepEqual(events, ['validate', 'build', 'tag']);
  assert.deepEqual(result.published, []);
});
