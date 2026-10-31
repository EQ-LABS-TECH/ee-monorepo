import { parseCodeowners, resolveCodeowners } from './pr-governance.codeowners.mjs';

const SHA = /^[0-9a-f]{40}$/i;
const OWNER = /^[a-z\d-]+$/i;
const REPO = /^[a-z\d_.-]+$/i;

export async function readCodeownersEvidence({
  owner,
  repo,
  baseSha,
  paths,
  token,
  fetchImpl = fetch,
}) {
  if (
    !OWNER.test(owner ?? '') ||
    !REPO.test(repo ?? '') ||
    !SHA.test(baseSha ?? '') ||
    !Array.isArray(paths) ||
    paths.length === 0 ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid CODEOWNERS evidence request');
  }

  const root = `https://api.github.com/repos/${owner}/${repo}`;

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  async function getJson(url) {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub CODEOWNERS request returned HTTP ${response.status}`);
    }

    return response.json();
  }

  // Check the exact base commit, not the mutable branch name.
  const errors = await getJson(`${root}/codeowners/errors?ref=${encodeURIComponent(baseSha)}`);

  if (!errors || !Array.isArray(errors.errors)) {
    throw new TypeError('Malformed GitHub CODEOWNERS errors response');
  }

  if (errors.errors.length > 0) {
    throw new Error('GitHub reports invalid CODEOWNERS rules');
  }

  const file = await getJson(
    `${root}/contents/.github/CODEOWNERS?ref=${encodeURIComponent(baseSha)}`,
  );

  if (
    !file ||
    file.type !== 'file' ||
    file.path !== '.github/CODEOWNERS' ||
    file.encoding !== 'base64' ||
    typeof file.content !== 'string' ||
    typeof file.size !== 'number' ||
    !Number.isSafeInteger(file.size) ||
    file.size < 1 ||
    file.size > 3 * 1024 * 1024
  ) {
    throw new TypeError('Malformed GitHub CODEOWNERS content response');
  }

  const content = file.content.replace(/\s/g, '');

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(content) || content.length % 4 !== 0) {
    throw new TypeError('Invalid CODEOWNERS base64 content');
  }

  const bytes = Buffer.from(content, 'base64');

  if (bytes.length !== file.size) {
    throw new TypeError('CODEOWNERS content size mismatch');
  }

  const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);

  const rules = parseCodeowners(source, owner);
  const requirements = resolveCodeowners({ rules, paths });

  return {
    baseSha: baseSha.toLowerCase(),
    sourcePath: '.github/CODEOWNERS',
    status: 'RESOLVED',
    requirements,
  };
}
