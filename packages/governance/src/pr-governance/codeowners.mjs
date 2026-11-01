/**
 * PN-017: conservative CODEOWNERS resolution.
 *
 * Supports the patterns used by EE-LABS:
 * - global "*"
 * - root-relative literal files
 * - root-relative directories ending with "/"
 * - "*" inside a file basename
 *
 * Unsupported rules fail closed. This is not a general CODEOWNERS parser.
 */

const TEAM = /^@([a-z\d-]+)\/([a-z\d_-]+)$/i;

function compilePattern(pattern) {
  if (pattern === '*') return () => true;

  if (
    !pattern ||
    pattern.startsWith('/') ||
    pattern.includes('\\') ||
    pattern.includes('..') ||
    /[!?[\]{}]/.test(pattern) ||
    pattern.includes('**')
  ) {
    throw new TypeError(`Unsupported CODEOWNERS pattern: ${pattern}`);
  }

  const directory = pattern.endsWith('/');

  if (directory) {
    if (pattern.includes('*')) {
      throw new TypeError(`Unsupported CODEOWNERS directory pattern: ${pattern}`);
    }

    const directoryName = pattern.slice(0, -1);
    const rootAnchored = directoryName.includes('/');

    return (path) =>
      rootAnchored
        ? path.startsWith(pattern)
        : path.startsWith(pattern) || path.includes(`/${pattern}`);
  }

  const slash = pattern.lastIndexOf('/');
  const directoryPrefix = slash < 0 ? '' : pattern.slice(0, slash + 1);
  const basename = pattern.slice(slash + 1);

  if (!basename || directoryPrefix.includes('*')) {
    throw new TypeError(`Unsupported CODEOWNERS file pattern: ${pattern}`);
  }

  const escaped = basename
    .split('*')
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  const expression = new RegExp(`^${escaped}$`);

  return (path) => {
    if (!directoryPrefix) {
      return expression.test(path.slice(path.lastIndexOf('/') + 1));
    }

    return (
      path.startsWith(directoryPrefix) &&
      !path.slice(directoryPrefix.length).includes('/') &&
      expression.test(path.slice(directoryPrefix.length))
    );
  };
}

export function parseCodeowners(source, organization) {
  if (
    typeof source !== 'string' ||
    typeof organization !== 'string' ||
    !/^[a-z\d-]+$/i.test(organization)
  ) {
    throw new TypeError('Invalid CODEOWNERS source or organization');
  }

  const rules = [];

  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim();

    if (!line || line.startsWith('#')) continue;

    const tokens = line.split(/\s+/);
    const pattern = tokens.shift();
    const owners = tokens.filter((token) => token.startsWith('@'));

    if (
      owners.length === 0 ||
      tokens.some((token) => !token.startsWith('@') && !token.startsWith('#'))
    ) {
      throw new TypeError(`Invalid CODEOWNERS rule at line ${index + 1}`);
    }

    const teams = owners.map((owner) => {
      const match = TEAM.exec(owner);

      if (!match || match[1].toLowerCase() !== organization.toLowerCase()) {
        throw new TypeError(`Unsupported CODEOWNERS owner at line ${index + 1}`);
      }

      return match[2].toLowerCase();
    });

    rules.push({
      pattern,
      teams: [...new Set(teams)],
      matches: compilePattern(pattern),
    });
  }

  if (rules.length === 0) {
    throw new TypeError('CODEOWNERS has no usable rules');
  }

  return rules;
}

export function resolveCodeowners({ rules, paths }) {
  if (!Array.isArray(rules) || !Array.isArray(paths)) {
    throw new TypeError('Invalid CODEOWNERS resolution input');
  }

  return paths.map((path) => {
    if (
      typeof path !== 'string' ||
      !path ||
      path.startsWith('/') ||
      path.includes('\\') ||
      path.split('/').some((part) => !part || part === '.' || part === '..')
    ) {
      throw new TypeError(`Invalid changed path: ${path}`);
    }

    let matchingRule = null;

    for (const rule of rules) {
      if (rule.matches(path)) matchingRule = rule;
    }

    if (!matchingRule) {
      throw new Error(`No CODEOWNERS rule covers ${path}`);
    }

    return {
      path,
      pattern: matchingRule.pattern,
      eligibleTeams: [...matchingRule.teams],
    };
  });
}
