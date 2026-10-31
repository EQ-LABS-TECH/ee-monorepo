const SHA = /^[0-9a-f]{40}$/i;
const OWNER = /^[a-z\d-]+$/i;
const REPO = /^[a-z\d_.-]+$/i;

export async function resolvePrGovernanceRoute({ route, token, fetchImpl = fetch }) {
  if (
    route?.status !== 'READY' ||
    route?.scope !== 'PR_SCOPE' ||
    !OWNER.test(route.owner ?? '') ||
    !REPO.test(route.repo ?? '') ||
    !Number.isSafeInteger(route.number) ||
    route.number < 1 ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid PN-017 PR resolution request');
  }

  const { owner, repo, number } = route;
  const repository = `${owner}/${repo}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  async function readCurrentPr() {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok || response.status !== 200) {
      throw new Error(`PN-017 PR resolution returned HTTP ${response.status}`);
    }

    const pr = await response.json();

    if (
      pr?.number !== number ||
      pr?.state !== 'open' ||
      pr?.base?.repo?.full_name?.toLowerCase() !== repository.toLowerCase() ||
      typeof pr?.base?.ref !== 'string' ||
      !pr.base.ref ||
      !SHA.test(pr?.base?.sha ?? '') ||
      !SHA.test(pr?.head?.sha ?? '') ||
      typeof pr?.head?.repo?.full_name !== 'string' ||
      !pr.head.repo.full_name
    ) {
      throw new TypeError('Invalid or closed PN-017 pull request');
    }

    return {
      number,
      baseSha: pr.base.sha.toLowerCase(),
      baseRef: pr.base.ref,
      headSha: pr.head.sha.toLowerCase(),
      headRepository: pr.head.repo.full_name.toLowerCase(),
    };
  }

  const first = await readCurrentPr();
  const second = await readCurrentPr();

  if (
    first.baseSha !== second.baseSha ||
    first.baseRef !== second.baseRef ||
    first.headSha !== second.headSha ||
    first.headRepository !== second.headRepository
  ) {
    throw new Error('PN-017 pull request changed during route resolution');
  }

  return {
    owner,
    repo,
    number,
    expectedHeadSha: second.headSha,
    baseSha: second.baseSha,
  };
}
