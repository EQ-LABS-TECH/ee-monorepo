/**
 * Classify Prettier --write output without losing diagnostic messages.
 */
export function parsePrettierOutput(output) {
  if (typeof output !== 'string') {
    throw new TypeError('Prettier output must be a string');
  }

  const modifiedFiles = [];
  const unchangedFiles = [];
  const otherLines = [];

  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;

    if (/\(unchanged\)\s*$/.test(line)) {
      unchangedFiles.push(line);
    } else if (/\s\d+(?:\.\d+)?ms\s*$/.test(line)) {
      modifiedFiles.push(line);
    } else {
      otherLines.push(line);
    }
  }

  return {
    modifiedFiles,
    unchangedFiles,
    otherLines,
    processed: modifiedFiles.length + unchangedFiles.length,
  };
}
