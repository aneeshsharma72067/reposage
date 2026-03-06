import { FindingType, SeverityLevel } from '@prisma/client';
import type { AnalysisRule, RuleFinding } from './rule.types';

const LARGE_COMMIT_THRESHOLD = 15;

export const largeCommitRule: AnalysisRule = {
  id: 'large-commit',
  description: 'Flags commits that modify a large number of files.',
  async run(context): Promise<RuleFinding[]> {
    if (context.changedFilesCount <= LARGE_COMMIT_THRESHOLD) {
      return [];
    }

    return [
      {
        type: FindingType.ARCH_VIOLATION,
        severity: SeverityLevel.WARNING,
        title: 'Large commit detected',
        description:
          'Commit modifies many files which may increase review complexity.',
        metadata: {
          filesChanged: context.changedFilesCount,
        },
      },
    ];
  },
};

