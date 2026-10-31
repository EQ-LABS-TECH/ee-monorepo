import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluatePrGovernance } from '../lib/pr-governance.evaluate.mjs';

const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);

const pr = {
  number: 42,
  user: { login: 'author' },
  head: {
    sha: headSha,
    repo: { full_name: 'author/ee-monorepo' },
  },
  base: {
    ref: 'main',
    sha: baseSha,
    repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
  },
};

const codeowners = [
  '* @EQ-LABS-TECH/maintainers',
  'README.md @EQ-LABS-TECH/architecture',
  '.github/ @EQ-LABS-TECH/architecture @EQ-LABS-TECH/repository-admin',
].join('\n');

const options = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
  token: 'pr-token',
  governanceToken: 'governance-token',
};

function review(reviewer, body = '') {
  return {
    user: { login: reviewer },
    state: 'APPROVED',
    commit_id: headSha,
    submitted_at: '2026-10-29T00:00:00Z',
    body,
  };
}

function fixture({
  paths = ['README.md'],
  reviews = [review('architect', 'EE-LABS-IMPACT: ORDINARY')],
  memberTeams = {
    architect: ['architecture'],
    administrator: ['repository-admin'],
  },
  writableTeams = ['architecture', 'repository-admin', 'maintainers'],
  secretTeams = [],
  changeHead = false,
} = {}) {
  let prReads = 0;

  return async (url, init) => {
    assert.equal(init.method, 'GET');

    const expectedToken = url.includes('/pulls/') ? 'pr-token' : 'governance-token';

    assert.equal(init.headers.Authorization, `Bearer ${expectedToken}`);

    let data;
    let status = 200;

    if (url.includes('/teams/') && url.includes('/repos/')) {
      const team = url.split('/teams/')[1].split('/repos/')[0];

      data = {
        full_name: 'EQ-LABS-TECH/ee-monorepo',
        permissions: {
          pull: true,
          push: writableTeams.includes(team),
          admin: false,
        },
      };
    } else if (url.includes('/orgs/EQ-LABS-TECH/teams/') && !url.includes('/memberships/')) {
      const team = url.split('/teams/')[1];

      data = {
        slug: team,
        privacy: secretTeams.includes(team) ? 'secret' : 'closed',
      };
    } else if (url.includes('/codeowners/errors?')) {
      data = { errors: [] };
    } else if (url.includes('/contents/.github/CODEOWNERS?')) {
      data = {
        type: 'file',
        path: '.github/CODEOWNERS',
        encoding: 'base64',
        size: Buffer.byteLength(codeowners),
        content: Buffer.from(codeowners).toString('base64'),
      };
    } else if (url.includes('/collaborators/')) {
      const reviewer = url.split('/collaborators/')[1].split('/permission')[0];

      data = {
        permission: 'write',
        role_name: 'write',
        user: { login: reviewer },
      };
    } else if (url.includes('/memberships/')) {
      const reviewer = url.split('/memberships/')[1];
      const team = url.split('/teams/')[1].split('/memberships/')[0];

      const active = memberTeams[reviewer]?.includes(team) ?? false;

      data = active ? { state: 'active', role: 'member' } : undefined;
      status = active ? 200 : 404;
    } else if (url.includes('/files?')) {
      data = paths.map((filename) => ({ filename }));
    } else if (url.includes('/reviews?')) {
      data = reviews;
    } else if (url.includes('/pulls/42')) {
      prReads += 1;

      data = changeHead && prReads > 2 ? { ...pr, head: { ...pr.head, sha: 'c'.repeat(40) } } : pr;
    } else {
      throw new Error(`Unexpected GitHub request: ${url}`);
    }

    return {
      ok: status === 200,
      status,
      json: async () => data,
    };
  };
}

test('ordinary classification passes with authorized architecture reviewer', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture(),
  });

  assert.equal(result.mode, 'EVALUATION_ONLY');
  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.decision.status, 'PASS');
  assert.equal(result.decision.requiredCount, 1);
});

test('ordinary-looking change remains pending without architecture declaration', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      reviews: [review('architect')],
    }),
  });

  assert.equal(result.classification, 'PENDING_REVIEW');
  assert.equal(result.decision.status, 'BLOCKED');
});

test('critical change with one qualified reviewer is blocked', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      paths: ['.github/workflows/ci.yml'],
    }),
  });

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.requiredCount, 2);
  assert.equal(result.decision.status, 'BLOCKED');
});

test('critical change passes with two independent qualified reviewers', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      paths: ['.github/workflows/ci.yml'],
      reviews: [review('architect', 'EE-LABS-IMPACT: ORDINARY'), review('administrator')],
    }),
  });

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.requiredCount, 2);
  assert.equal(result.decision.status, 'PASS');
});

test('changed HEAD prevents an enforcement evaluation result', async () => {
  await assert.rejects(
    evaluatePrGovernance({
      ...options,
      fetchImpl: fixture({ changeHead: true }),
    }),
    /PR governance evidence changed during evaluation/,
  );
});

test('missing governance credentials fail closed', async () => {
  await assert.rejects(
    evaluatePrGovernance({
      ...options,
      governanceToken: undefined,
      fetchImpl: fixture(),
    }),
    /A separate governance token is required/,
  );
});

test('revoked reviewer permission invalidates evaluation', async () => {
  const baseFetch = fixture();
  let permissionReads = 0;

  await assert.rejects(
    evaluatePrGovernance({
      ...options,
      fetchImpl: async (url, init) => {
        if (url.includes('/collaborators/')) {
          permissionReads += 1;

          if (permissionReads > 1) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                permission: 'read',
                role_name: 'read',
                user: { login: 'architect' },
              }),
            };
          }
        }

        return baseFetch(url, init);
      },
    }),
    /PR governance reviewer authority changed during evaluation/,
  );

  assert.equal(permissionReads, 2);
});

test('revoked architecture membership invalidates evaluation', async () => {
  const baseFetch = fixture();
  let architectureReads = 0;

  await assert.rejects(
    evaluatePrGovernance({
      ...options,
      fetchImpl: async (url, init) => {
        if (url.includes('/teams/architecture/memberships/architect')) {
          architectureReads += 1;

          if (architectureReads > 1) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                state: 'pending',
                role: 'member',
              }),
            };
          }
        }

        return baseFetch(url, init);
      },
    }),
    /PR governance reviewer authority changed during evaluation/,
  );

  assert.equal(architectureReads, 2);
});

test('CODEOWNERS team without write permission cannot satisfy ownership', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      writableTeams: ['repository-admin', 'maintainers'],
    }),
  });

  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.ownershipEvidence.ownershipVerified, false);
});

test('alternative writable CODEOWNERS team can satisfy ownership', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      paths: ['.github/workflows/ci.yml'],
      reviews: [review('administrator')],
      writableTeams: ['repository-admin'],
    }),
  });

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.ownershipEvidence.ownershipVerified, true);
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.decision.requiredCount, 2);
});

test('revoked CODEOWNERS team permission invalidates evaluation', async () => {
  const baseFetch = fixture();
  let teamReads = 0;

  await assert.rejects(
    evaluatePrGovernance({
      ...options,
      fetchImpl: async (url, init) => {
        if (url.includes('/teams/architecture/repos/')) {
          teamReads += 1;

          if (teamReads > 1) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                full_name: 'EQ-LABS-TECH/ee-monorepo',
                permissions: {
                  pull: true,
                  push: false,
                  admin: false,
                },
              }),
            };
          }
        }

        return baseFetch(url, init);
      },
    }),
    /PR governance CODEOWNERS team permissions changed during evaluation/,
  );

  assert.equal(teamReads, 2);
});

test('secret CODEOWNERS team cannot satisfy ownership', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      secretTeams: ['architecture'],
    }),
  });

  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.ownershipEvidence.ownershipVerified, false);
  assert.equal(result.decision.status, 'BLOCKED');
});

test('visible alternative CODEOWNERS team can satisfy ownership', async () => {
  const result = await evaluatePrGovernance({
    ...options,
    fetchImpl: fixture({
      paths: ['.github/workflows/ci.yml'],
      reviews: [review('administrator')],
      secretTeams: ['architecture'],
    }),
  });

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.ownershipEvidence.ownershipVerified, true);
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.decision.requiredCount, 2);
});

test('CODEOWNERS team visibility change invalidates evaluation', async () => {
  const baseFetch = fixture();
  let visibilityReads = 0;

  await assert.rejects(
    evaluatePrGovernance({
      ...options,
      fetchImpl: async (url, init) => {
        if (url.endsWith('/orgs/EQ-LABS-TECH/teams/architecture')) {
          visibilityReads += 1;

          if (visibilityReads > 1) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                slug: 'architecture',
                privacy: 'secret',
              }),
            };
          }
        }

        return baseFetch(url, init);
      },
    }),
    /PR governance CODEOWNERS team permissions changed during evaluation/,
  );

  assert.equal(visibilityReads, 2);
});
