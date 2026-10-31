import {
  createPrGovernanceCheckPayload,
  PR_GOVERNANCE_CHECK_NAME,
} from './pr-governance.check.mjs';

const SHA = /^[0-9a-f]{40}$/i;
const OWNER = /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i;
const REPO = /^[a-z\d_.-]+$/i;

export async function publishPrGovernanceCheck({
  owner,
  repo,
  number,
  expectedHeadSha,
  evaluation,
  token,
  fetchImpl = fetch,
}) {
  if (
    !OWNER.test(owner ?? '') ||
    !REPO.test(repo ?? '') ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    !SHA.test(expectedHeadSha ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid PR governance publication request');
  }

  const payload = createPrGovernanceCheckPayload({
    evaluation,
    expectedHeadSha,
  });

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const repositoryUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // The check must not be published for an already superseded HEAD.
  const currentResponse = await fetchImpl(`${repositoryUrl}/pulls/${number}`, {
    method: 'GET',
    headers,
  });

  if (!currentResponse.ok || currentResponse.status !== 200) {
    throw new Error(`GitHub PR publication verification returned HTTP ${currentResponse.status}`);
  }

  const currentPr = await currentResponse.json();

  if (
    currentPr?.number !== number ||
    currentPr?.state !== 'open' ||
    currentPr?.head?.sha?.toLowerCase() !== payload.head_sha ||
    currentPr?.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase()
  ) {
    throw new Error('PR governance HEAD or PR identity changed before publication');
  }

  const response = await fetchImpl(`${repositoryUrl}/check-runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok || response.status !== 201) {
    throw new Error(`GitHub governance check publication returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    !Number.isSafeInteger(result?.id) ||
    result.id < 1 ||
    result.name !== payload.name ||
    result.head_sha?.toLowerCase() !== payload.head_sha ||
    result.status !== 'completed' ||
    result.conclusion !== payload.conclusion
  ) {
    throw new TypeError('Malformed GitHub governance check publication response');
  }

  return {
    checkId: result.id,
    headSha: payload.head_sha,
    conclusion: result.conclusion,
  };
}

export async function startPrGovernanceCheck({
  owner,
  repo,
  number,
  expectedHeadSha,
  expectedAppId,
  token,
  fetchImpl = fetch,
}) {
  if (
    !OWNER.test(owner ?? '') ||
    !REPO.test(repo ?? '') ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    !SHA.test(expectedHeadSha ?? '') ||
    !Number.isSafeInteger(expectedAppId) ||
    expectedAppId < 1 ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid PR governance check start request');
  }

  const repositoryUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const currentResponse = await fetchImpl(`${repositoryUrl}/pulls/${number}`, {
    method: 'GET',
    headers,
  });

  if (!currentResponse.ok || currentResponse.status !== 200) {
    throw new Error(`GitHub PR check start verification returned HTTP ${currentResponse.status}`);
  }

  const currentPr = await currentResponse.json();
  const headSha = expectedHeadSha.toLowerCase();

  if (
    currentPr?.number !== number ||
    currentPr?.state !== 'open' ||
    currentPr?.head?.sha?.toLowerCase() !== headSha ||
    currentPr?.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase()
  ) {
    throw new Error('PR governance HEAD or PR identity changed before check start');
  }

  const payload = {
    name: 'PR Governance',
    head_sha: headSha,
    status: 'in_progress',
    output: {
      title: 'PN-017 governance evaluation in progress',
      summary: 'Governance evidence is being revalidated.',
    },
  };

  const response = await fetchImpl(`${repositoryUrl}/check-runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok || response.status !== 201) {
    throw new Error(`GitHub governance check start returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    !Number.isSafeInteger(result?.id) ||
    result.id < 1 ||
    !Number.isSafeInteger(result.app?.id) ||
    result.app.id < 1 ||
    result.name !== payload.name ||
    result.head_sha?.toLowerCase() !== headSha ||
    result.status !== 'in_progress'
  ) {
    throw new TypeError('Malformed GitHub governance check start response');
  }

  if (result.app.id !== expectedAppId) {
    throw new Error('GitHub governance check was created by an unexpected App');
  }

  return {
    checkId: result.id,
    appId: result.app.id,
    headSha,
    status: 'in_progress',
  };
}

export async function completePrGovernanceCheck({
  owner,
  repo,
  number,
  checkId,
  expectedAppId,
  expectedHeadSha,
  evaluation,
  failureReason,
  token,
  fetchImpl = fetch,
}) {
  if (
    !OWNER.test(owner ?? '') ||
    !REPO.test(repo ?? '') ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    !Number.isSafeInteger(checkId) ||
    checkId < 1 ||
    !Number.isSafeInteger(expectedAppId) ||
    expectedAppId < 1 ||
    !SHA.test(expectedHeadSha ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid PR governance check completion request');
  }

  if (
    (evaluation === undefined) === (failureReason === undefined) ||
    (failureReason !== undefined && failureReason !== 'evaluation-error')
  ) {
    throw new TypeError('Invalid PR governance completion outcome');
  }

  const payload =
    failureReason === 'evaluation-error'
      ? {
          name: PR_GOVERNANCE_CHECK_NAME,
          head_sha: expectedHeadSha.toLowerCase(),
          conclusion: 'failure',
          output: {
            title: 'PN-017 governance evaluation failed',
            summary: 'The governance evidence could not be verified.',
          },
        }
      : createPrGovernanceCheckPayload({
          evaluation,
          expectedHeadSha,
        });

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const repositoryUrl = `https://api.github.com/repos/${owner}/${repo}`;

  async function getJson(url, context) {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok || response.status !== 200) {
      throw new Error(`${context} returned HTTP ${response.status}`);
    }

    return response.json();
  }

  const currentPr = await getJson(
    `${repositoryUrl}/pulls/${number}`,
    'GitHub PR completion verification',
  );

  if (
    currentPr?.number !== number ||
    currentPr?.state !== 'open' ||
    currentPr?.head?.sha?.toLowerCase() !== payload.head_sha ||
    currentPr?.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase()
  ) {
    throw new Error('PR governance HEAD or PR identity changed before check completion');
  }

  const checkUrl = `${repositoryUrl}/check-runs/${checkId}`;

  const currentCheck = await getJson(checkUrl, 'GitHub check completion verification');

  if (
    currentCheck?.id !== checkId ||
    currentCheck?.app?.id !== expectedAppId ||
    currentCheck?.name !== PR_GOVERNANCE_CHECK_NAME ||
    currentCheck?.head_sha?.toLowerCase() !== payload.head_sha ||
    currentCheck?.status !== 'in_progress'
  ) {
    throw new Error('PR governance check identity or state changed before completion');
  }

  if (payload.conclusion === 'success') {
    const checkRunsUrl =
      `${repositoryUrl}/commits/${payload.head_sha}/check-runs` +
      `?check_name=${encodeURIComponent(PR_GOVERNANCE_CHECK_NAME)}` +
      `&app_id=${expectedAppId}&filter=all&per_page=100`;

    const checks = await getJson(checkRunsUrl, 'GitHub governance concurrency verification');

    if (
      !Number.isSafeInteger(checks?.total_count) ||
      checks.total_count < 1 ||
      checks.total_count > 100 ||
      !Array.isArray(checks.check_runs) ||
      checks.check_runs.length !== checks.total_count ||
      !Number.isFinite(Date.parse(currentCheck.created_at))
    ) {
      throw new Error('PR governance check concurrency evidence is incomplete');
    }

    const currentCreatedAt = Date.parse(currentCheck.created_at);
    let currentFound = false;

    for (const check of checks.check_runs) {
      if (
        !Number.isSafeInteger(check?.id) ||
        check.id < 1 ||
        check.name !== PR_GOVERNANCE_CHECK_NAME ||
        check.app?.id !== expectedAppId ||
        check.head_sha?.toLowerCase() !== payload.head_sha ||
        !Number.isFinite(Date.parse(check.created_at))
      ) {
        throw new Error('Malformed PR governance concurrent check');
      }

      if (check.id === checkId) {
        currentFound = true;
        continue;
      }

      // Equal timestamps are ambiguous: fail closed.
      if (Date.parse(check.created_at) >= currentCreatedAt) {
        throw new Error('Newer or concurrent PR governance check exists');
      }
    }

    if (!currentFound) {
      throw new Error('Current PR governance check is absent from GitHub');
    }
  }

  const response = await fetchImpl(checkUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: 'completed',
      conclusion: payload.conclusion,
      output: payload.output,
    }),
  });

  if (!response.ok || response.status !== 200) {
    throw new Error(`GitHub governance check completion returned HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    result?.id !== checkId ||
    result?.name !== PR_GOVERNANCE_CHECK_NAME ||
    result?.head_sha?.toLowerCase() !== payload.head_sha ||
    result?.status !== 'completed' ||
    result?.conclusion !== payload.conclusion
  ) {
    throw new TypeError('Malformed GitHub governance check completion response');
  }

  return {
    checkId,
    headSha: payload.head_sha,
    conclusion: result.conclusion,
  };
}
