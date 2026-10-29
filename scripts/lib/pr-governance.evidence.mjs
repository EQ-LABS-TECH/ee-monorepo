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
      return {
        login: review.user.login,
        state: review.state,
        submittedAt: review.submitted_at,
        commitId: review.commit_id,
        sequence,
      };
    })
    .filter(Boolean);

  const paths = files.map((file) => {
    if (typeof file?.filename !== 'string') {
      throw new TypeError('Malformed GitHub changed file');
    }
    return file.filename;
  });

  const currentPr = await getJson(base);

  if (
    currentPr?.number !== number ||
    currentPr?.user?.login?.toLowerCase() !== pr.user.login.toLowerCase() ||
    currentPr?.head?.sha !== pr.head.sha ||
    currentPr?.head?.repo?.full_name?.toLowerCase() !== pr.head.repo.full_name.toLowerCase() ||
    currentPr?.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase() ||
    currentPr?.base?.ref !== pr.base.ref
  ) {
    throw new Error('Pull request changed while collecting governance evidence');
  }

  return {
    author: pr.user.login,
    headSha: pr.head.sha,
    paths,
    reviews: normalizedReviews,
    // Evidence snapshot only. Must re-check at merge; never treat as authoritative.
    advisoryOnly: true,
  };
}
