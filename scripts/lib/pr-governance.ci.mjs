const SHA = /^[0-9a-f]{40}$/i;
const REPOSITORY_PART = /^[a-z\d_.-]+$/i;
const VALIDATE_CHECK = 'Validate';
const GITHUB_ACTIONS_APP_ID = 15368;
const MAX_CHECK_RUNS = 10000;

/**
 * Confirms that the current PR HEAD has a successful required Validate check.
 * The check must be emitted by the GitHub Actions integration used by the
 * repository ruleset; missing or malformed evidence never authorizes review.
 */
export async function readValidateReadiness({ owner, repo, headSha, token, fetchImpl = fetch }) {
  if (
    !REPOSITORY_PART.test(owner ?? '') ||
    !REPOSITORY_PART.test(repo ?? '') ||
    !SHA.test(headSha ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid governance validation context');
  }

  const checks = [];
  for (let page = 1; ; page += 1) {
    const url =
      `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/check-runs` +
      `?check_name=${encodeURIComponent(VALIDATE_CHECK)}&app_id=${GITHUB_ACTIONS_APP_ID}` +
      `&filter=latest&per_page=100&page=${page}`;
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok || response.status !== 200) {
      throw new Error(`Governance validation lookup returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (
      !result ||
      !Number.isSafeInteger(result.total_count) ||
      !Array.isArray(result.check_runs) ||
      result.check_runs.length > 100
    ) {
      throw new TypeError('Malformed governance validation response');
    }

    for (const check of result.check_runs) {
      if (
        !check ||
        typeof check !== 'object' ||
        check.name !== VALIDATE_CHECK ||
        !Number.isSafeInteger(check.id) ||
        check.id < 1 ||
        !['queued', 'in_progress', 'completed'].includes(check.status) ||
        (check.conclusion !== null &&
          check.conclusion !== undefined &&
          typeof check.conclusion !== 'string') ||
        !check.app ||
        !Number.isSafeInteger(check.app.id) ||
        (check.status === 'queued' &&
          check.started_at !== null &&
          check.started_at !== undefined) ||
        (check.status !== 'queued' &&
          (typeof check.started_at !== 'string' || !Number.isFinite(Date.parse(check.started_at))))
      ) {
        throw new TypeError('Malformed Validate check run');
      }

      if (check.app.id === GITHUB_ACTIONS_APP_ID) checks.push(check);
    }

    if (checks.length > MAX_CHECK_RUNS || result.check_runs.length < 100) break;
    if (page * 100 >= MAX_CHECK_RUNS) {
      throw new Error('Governance validation lookup exceeded supported limit');
    }
  }

  // The API's `latest` filter narrows results to the most recent check runs.
  // The first matching run from the trusted Actions integration governs readiness.
  const latest = checks[0];

  return latest?.status === 'completed' && latest.conclusion === 'success'
    ? { status: 'READY', checkRunId: latest.id }
    : { status: 'WAITING', checkRunId: latest?.id ?? null };
}
