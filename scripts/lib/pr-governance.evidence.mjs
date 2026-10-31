/**
 * Read-only GitHub REST adapter for PN-017.
 * Provides evidence only: classification and merge authorization remain separate.
 */
const SHA = /^[0-9a-f]{40}$/i;
const LOGIN = /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i;

function assertRepository(owner, repo, number) {
  if (
    !LOGIN.test(owner) ||
    !/^[a-z\d_.-]+$/i.test(repo) ||
    !Number.isSafeInteger(number) ||
    number < 1
  ) {
    throw new TypeError('Invalid GitHub pull request locator');
  }
}

export async function readPullRequestEvidence({ owner, repo, number, token, fetchImpl = fetch }) {
  assertRepository(owner, repo, number);
  if (typeof token !== 'string' || !token || typeof fetchImpl !== 'function') {
    throw new TypeError('A read-only GitHub API token and fetch function are required');
  }
  const base = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  async function getJson(url) {
    const response = await fetchImpl(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
    return response.json();
  }

  async function collect(endpoint, maxItems) {
    const result = [];
    for (let page = 1; page <= Math.ceil(maxItems / 100) + 1; page++) {
      const items = await getJson(`${base}/${endpoint}?per_page=100&page=${page}`);
      if (!Array.isArray(items)) throw new TypeError(`Invalid ${endpoint} response`);
      result.push(...items);
      if (result.length > maxItems) {
        throw new Error(`GitHub ${endpoint} evidence exceeds supported limit`);
      }
      if (items.length < 100) return result;
    }
    throw new Error(`GitHub ${endpoint} pagination incomplete`);
  }

  const pr = await getJson(base);

  if (
    !pr ||
    !LOGIN.test(pr.user?.login ?? '') ||
    !SHA.test(pr.head?.sha ?? '') ||
    typeof pr.head?.repo?.full_name !== 'string' ||
    !pr.head.repo.full_name ||
    pr.number !== number ||
    typeof pr.base?.ref !== 'string' ||
    !pr.base.ref ||
    !SHA.test(pr.base?.sha ?? '') ||
    pr.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase()
  ) {
    throw new TypeError('Invalid GitHub pull request response');
  }

  // GitHub caps this endpoint at 3000 files. A full page at 3000 is ambiguous:
  // deny classification rather than silently omit potentially critical paths.
  const files = await collect('files', 2999);
  const reviews = await collect('reviews', 10000);
  const normalizedReviews = reviews
    .map((review, sequence) => {
      if (
        !review ||
        !LOGIN.test(review.user?.login ?? '') ||
        typeof review.state !== 'string' ||
        typeof review.commit_id !== 'string'
      ) {
        throw new TypeError('Malformed GitHub review');
      }
      // Pending reviews are not submitted and are not usable evidence.
      if (review.state === 'PENDING') return null;
      if (
        typeof review.submitted_at !== 'string' ||
        !Number.isFinite(Date.parse(review.submitted_at))
      ) {
        throw new TypeError('Malformed submitted review timestamp');
      }
      if (review.body != null && typeof review.body !== 'string') {
        throw new TypeError('Malformed GitHub review body');
      }

      return {
        login: review.user.login,
        state: review.state,
        submittedAt: review.submitted_at,
        commitId: review.commit_id,
        sequence,
        body: review.body ?? '',
      };
    })
    .filter(Boolean);

  const paths = files.map((file) => {
    if (typeof file?.filename !== 'string') {
      throw new TypeError('Malformed GitHub changed file');
    }
    return file.filename;
  });

  // Detect review changes while collecting evidence.
  // This is a consistency check, not an atomic GitHub snapshot.
  const confirmedReviews = await collect('reviews', 10000);

  if (JSON.stringify(confirmedReviews) !== JSON.stringify(reviews)) {
    throw new Error('Pull request reviews changed while collecting governance evidence');
  }

  const currentPr = await getJson(base);

  if (
    currentPr?.number !== number ||
    currentPr?.user?.login?.toLowerCase() !== pr.user.login.toLowerCase() ||
    currentPr?.head?.sha !== pr.head.sha ||
    currentPr?.head?.repo?.full_name?.toLowerCase() !== pr.head.repo.full_name.toLowerCase() ||
    currentPr?.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase() ||
    currentPr?.base?.ref !== pr.base.ref ||
    currentPr?.base?.sha !== pr.base.sha
  ) {
    throw new Error('Pull request changed while collecting governance evidence');
  }

  return {
    author: pr.user.login,
    headSha: pr.head.sha,
    baseSha: pr.base.sha.toLowerCase(),
    paths,
    reviews: normalizedReviews,
    // Evidence snapshot only. Must re-check at merge; never treat as authoritative.
    advisoryOnly: true,
  };
}

export async function readReviewerRepositoryPermission({
  owner,
  repo,
  number,
  reviewer,
  token,
  fetchImpl = fetch,
}) {
  assertRepository(owner, repo, number);

  if (!LOGIN.test(reviewer ?? '') || typeof token !== 'string' || !token) {
    throw new TypeError('Invalid reviewer permission request');
  }

  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch function is required');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/collaborators/${reviewer}/permission`;

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub reviewer permission request returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    !result ||
    typeof result !== 'object' ||
    typeof result.permission !== 'string' ||
    typeof result.role_name !== 'string' ||
    result.user?.login?.toLowerCase() !== reviewer.toLowerCase()
  ) {
    throw new TypeError('Malformed GitHub reviewer permission response');
  }

  const permission = result.permission.toLowerCase();

  if (!['admin', 'write', 'read', 'none'].includes(permission)) {
    throw new TypeError('Unsupported GitHub reviewer permission');
  }

  return {
    reviewer: reviewer.toLowerCase(),
    permission,
    roleName: result.role_name,
    hasWriteAccess: permission === 'admin' || permission === 'write',
  };
}

export async function readReviewerTeamMembership({
  owner,
  teamSlug,
  reviewer,
  token,
  fetchImpl = fetch,
}) {
  if (
    !LOGIN.test(owner ?? '') ||
    !/^[a-z\d_-]+$/i.test(teamSlug ?? '') ||
    !LOGIN.test(reviewer ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid reviewer team membership request');
  }

  const url = `https://api.github.com/orgs/${owner}/teams/${teamSlug}` + `/memberships/${reviewer}`;

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (response.status === 404) {
    return {
      reviewer: reviewer.toLowerCase(),
      teamSlug,
      active: false,
      role: null,
    };
  }

  if (!response.ok) {
    throw new Error(`GitHub team membership request returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    !result ||
    !['active', 'pending'].includes(result.state) ||
    !['member', 'maintainer'].includes(result.role)
  ) {
    throw new TypeError('Malformed GitHub team membership response');
  }

  return {
    reviewer: reviewer.toLowerCase(),
    teamSlug,
    active: result.state === 'active',
    role: result.role,
  };
}

export async function readCodeownerTeamPermission({
  owner,
  repo,
  teamSlug,
  token,
  fetchImpl = fetch,
}) {
  if (
    !LOGIN.test(owner ?? '') ||
    !/^[a-z\d_.-]+$/i.test(repo ?? '') ||
    !/^[a-z\d_-]+$/i.test(teamSlug ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid CODEOWNERS team permission request');
  }

  const url = `https://api.github.com/orgs/${owner}/teams/${teamSlug}/repos/${owner}/${repo}`;

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github.v3.repository+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub CODEOWNERS team permission request returned HTTP ${response.status}`);
  }

  if (response.status !== 200) {
    throw new TypeError('CODEOWNERS team permission details are unavailable');
  }

  const result = await response.json();

  if (
    !result ||
    result.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase() ||
    !result.permissions ||
    typeof result.permissions.push !== 'boolean' ||
    typeof result.permissions.admin !== 'boolean'
  ) {
    throw new TypeError('Malformed CODEOWNERS team permission response');
  }

  return {
    teamSlug: teamSlug.toLowerCase(),
    hasWriteAccess: result.permissions.push || result.permissions.admin,
  };
}

export async function readCodeownerTeamVisibility({ owner, teamSlug, token, fetchImpl = fetch }) {
  if (
    !LOGIN.test(owner ?? '') ||
    !/^[a-z\d_-]+$/i.test(teamSlug ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid CODEOWNERS team visibility request');
  }

  const response = await fetchImpl(`https://api.github.com/orgs/${owner}/teams/${teamSlug}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok || response.status !== 200) {
    throw new Error(`GitHub CODEOWNERS team visibility request returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    !result ||
    result.slug?.toLowerCase() !== teamSlug.toLowerCase() ||
    !['closed', 'secret'].includes(result.privacy)
  ) {
    throw new TypeError('Malformed CODEOWNERS team visibility response');
  }

  return {
    teamSlug: teamSlug.toLowerCase(),
    visible: result.privacy === 'closed',
  };
}
