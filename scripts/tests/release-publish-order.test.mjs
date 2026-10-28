import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const releaseCommandPath = fileURLToPath(new URL('../commands/release', import.meta.url));

function readPublishSource() {
  const source = readFileSync(releaseCommandPath, 'utf8');
  const start = source.indexOf('async function publishRelease()');

  assert.notEqual(start, -1, 'Cannot find publishRelease() in the release command.');

  const end = source.indexOf('\nasync function main()', start);

  assert.notEqual(end, -1, 'Cannot determine the end of publishRelease().');

  return source.slice(start, end);
}

function requirePosition(source, marker) {
  const position = source.indexOf(marker);

  assert.notEqual(position, -1, `Missing release invariant: ${marker}`);

  return position;
}

test('independent verification precedes both release paths', () => {
  const source = readPublishSource();

  const verify = requirePosition(source, 'executeVerifiedRelease({');

  const inspectTag = requirePosition(source, 'const inspectTag =');
  const recovery = requirePosition(source, 'const remoteState = inspectTag()');
  const publication = requirePosition(source, 'publishThenTag({');

  assert.ok(verify < inspectTag, 'Source verification must precede remote tag inspection.');

  assert.ok(verify < recovery, 'Source verification must precede completed-release recovery.');

  assert.ok(verify < publication, 'Source verification must precede publishThenTag().');
});

test('independent verification precedes registry operations', () => {
  const source = readPublishSource();

  const verify = requirePosition(source, 'executeVerifiedRelease({');

  const registry = requirePosition(source, 'registryHasVersion');

  assert.ok(verify < registry, 'Source verification must precede registry access.');

  assert.equal(
    source.match(/executeVerifiedRelease\(\{/g)?.length,
    1,
    'publishRelease() must have exactly one verified release boundary.',
  );
});
