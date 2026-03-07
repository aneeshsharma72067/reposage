export type CommitFile = {
  filename: string;
  patch?: string;
  additions?: number;
  deletions?: number;
};

export type CompressedDiff = {
  filename: string;
  patch: string;
};

export type CompressDiffOptions = {
  maxFiles?: number;
  maxPatchChars?: number;
};

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_PATCH_CHARS = 4000;

function getChangeWeight(file: CommitFile): number {
  const additions = typeof file.additions === 'number' ? file.additions : 0;
  const deletions = typeof file.deletions === 'number' ? file.deletions : 0;
  return additions + deletions;
}

function shouldIgnoreFile(filename: string): boolean {
  const normalized = filename.replace(/\\/g, '/').toLowerCase();

  if (normalized.includes('node_modules/')) {
    return true;
  }

  if (normalized.includes('/dist/') || normalized.startsWith('dist/')) {
    return true;
  }

  if (normalized.includes('/build/') || normalized.startsWith('build/')) {
    return true;
  }

  if (normalized.endsWith('package-lock.json')) {
    return true;
  }

  if (normalized.endsWith('yarn.lock')) {
    return true;
  }

  if (normalized.endsWith('pnpm-lock.yaml')) {
    return true;
  }

  if (normalized.endsWith('.min.js')) {
    return true;
  }

  return false;
}

function removeWhitespaceOnlyDiffLines(patch: string): string {
  return patch
    .split('\n')
    .filter((line) => !/^[+-]\s*$/.test(line))
    .join('\n')
    .trim();
}

function truncatePatch(patch: string, maxPatchChars: number): string {
  if (patch.length <= maxPatchChars) {
    return patch;
  }

  return `${patch.slice(0, maxPatchChars)}\n...[TRUNCATED]`;
}

export function compressDiff(
  files: CommitFile[],
  options?: CompressDiffOptions,
): CompressedDiff[] {
  const maxFiles = options?.maxFiles ?? DEFAULT_MAX_FILES;
  const maxPatchChars = options?.maxPatchChars ?? DEFAULT_MAX_PATCH_CHARS;

  return files
    .filter((file) => !shouldIgnoreFile(file.filename))
    .sort((left, right) => getChangeWeight(right) - getChangeWeight(left))
    .slice(0, maxFiles)
    .map((file) => {
      const sanitizedPatch = removeWhitespaceOnlyDiffLines(file.patch ?? '');
      const truncatedPatch = truncatePatch(sanitizedPatch, maxPatchChars);

      return {
        filename: file.filename,
        patch: truncatedPatch,
      } satisfies CompressedDiff;
    })
    .filter((file) => file.patch.length > 0);
}

