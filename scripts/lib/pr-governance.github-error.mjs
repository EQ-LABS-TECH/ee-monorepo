const REQUEST_ID = /^[a-z\d:._-]{1,128}$/i;

export function getGitHubRequestId(error, seen = new Set()) {
  if (!(error instanceof Error) || seen.has(error)) return undefined;
  seen.add(error);

  if (typeof error.githubRequestId === 'string' && REQUEST_ID.test(error.githubRequestId)) {
    return error.githubRequestId;
  }

  if (error instanceof AggregateError) {
    for (const nestedError of error.errors) {
      const requestId = getGitHubRequestId(nestedError, seen);
      if (requestId) return requestId;
    }
  }

  return undefined;
}

export function createGitHubHttpError(response, context) {
  const error = new Error(`${context} returned HTTP ${response.status}`);
  const requestId = response.headers?.get?.('x-github-request-id');

  if (typeof requestId === 'string' && REQUEST_ID.test(requestId)) {
    error.githubRequestId = requestId;
  }

  return error;
}
