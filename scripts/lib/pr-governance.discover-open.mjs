const REPOSITORY_PART = /^[a-z\d_.-]+$/i;

export async function discoverOpenGovernancePrs({ owner, repo, token, fetchImpl = fetch }) {
  if (
    !REPOSITORY_PART.test(owner ?? '') ||
    !REPOSITORY_PART.test(repo ?? '') ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid governance PR discovery context');
  }

  const numbers = [];
  const seen = new Set();

  for (let page = 1; ; page += 1) {
    if (page > 100) {
      throw new Error('Governance PR discovery exceeded page limit');
    }

    const url =
      `https://api.github.com/repos/${owner}/${repo}/pulls` +
      `?state=open&base=main&per_page=100&page=${page}`;

    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok || response.status !== 200) {
      throw new Error(`Governance PR discovery returned HTTP ${response.status}`);
    }

    const prs = await response.json();

    if (!Array.isArray(prs) || prs.length > 100) {
      throw new TypeError('Invalid governance PR discovery response');
    }

    for (const pr of prs) {
      if (
        !Number.isSafeInteger(pr?.number) ||
        pr.number < 1 ||
        pr.state !== 'open' ||
        pr.base?.ref !== 'main' ||
        pr.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase() ||
        seen.has(pr.number)
      ) {
        throw new TypeError('Inconsistent governance PR discovery evidence');
      }

      seen.add(pr.number);
      numbers.push(pr.number);
    }

    if (prs.length < 100) {
      return numbers;
    }
  }
}
