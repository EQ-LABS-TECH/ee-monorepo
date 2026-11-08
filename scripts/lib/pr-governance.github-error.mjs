const REQUEST_ID = /^[a-z\d:._-]{1,128}$/i;
const OPERATION = /^[a-z\d-]{1,64}$/i;
const SUBJECT = /^[a-z\d_-]{1,100}$/i;

/** Attach safe operation context without exposing an API response or token. */
export async function withGovernanceOperation(operation, subject, action) {
  try {
    return await action();
  } catch (error) {
    const diagnosticError =
      error instanceof Error ? error : new Error('Governance operation failed');
    if (OPERATION.test(operation) && !diagnosticError.governanceOperation) {
      diagnosticError.governanceOperation = operation;
    }
    if (subject && SUBJECT.test(subject) && !diagnosticError.governanceSubject) {
      diagnosticError.governanceSubject = subject;
    }
    throw diagnosticError;
  }
}

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
