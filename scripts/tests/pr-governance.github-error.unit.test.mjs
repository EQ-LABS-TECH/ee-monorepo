import test from 'node:test';
import assert from 'node:assert/strict';

import { createGitHubHttpError, getGitHubRequestId } from '../lib/pr-governance.github-error.mjs';

test('extracts a safe GitHub request ID from an HTTP response', () => {
  const error = createGitHubHttpError(
    {
      status: 403,
      headers: { get: (name) => (name === 'x-github-request-id' ? 'ABCD:1234' : null) },
    },
    'GitHub request',
  );

  assert.match(error.message, /HTTP 403/);
  assert.equal(getGitHubRequestId(error), 'ABCD:1234');
});

test('ignores malformed or absent GitHub request IDs', () => {
  const malformed = createGitHubHttpError(
    {
      status: 500,
      headers: { get: () => 'request-id\nforged-log-entry' },
    },
    'GitHub request',
  );
  const absent = createGitHubHttpError({ status: 500 }, 'GitHub request');

  assert.equal(getGitHubRequestId(malformed), undefined);
  assert.equal(getGitHubRequestId(absent), undefined);
});

test('finds a GitHub request ID inside an aggregate failure', () => {
  const nested = createGitHubHttpError(
    {
      status: 403,
      headers: { get: () => 'ABCD:5678' },
    },
    'GitHub request',
  );

  assert.equal(getGitHubRequestId(new AggregateError([nested])), 'ABCD:5678');
});
