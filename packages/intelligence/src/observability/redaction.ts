const SECRET_PATTERNS: RegExp[] = [
  /\b(sk-[a-zA-Z0-9]{10,})\b/g,
  /\b(api[_-]?key\s*[:=]\s*\S+)/gi,
  /\b(bearer\s+[a-zA-Z0-9._-]+)/gi,
  /\b(password\s*[:=]\s*\S+)/gi,
  /\b(ghp_[a-zA-Z0-9]{20,})\b/g,
  /\b(github_pat_[a-zA-Z0-9_]{20,})\b/g,
];

const REDACTED = '[REDACTED]';

/**
 * Redact common secret-like substrings. Not a guarantee of absence of secrets
 * (AI-04); defense-in-depth for log paths.
 */
export function redactSensitive(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

/** True if text looks like it may contain credential material. */
export function looksSensitive(text: string): boolean {
  return SECRET_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}
