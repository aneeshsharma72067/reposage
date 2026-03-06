import { FindingType, SeverityLevel } from '@prisma/client';
import type { AnalysisRule, RuleFinding } from './rule.types';

const LARGE_DIFF_THRESHOLD = 500;

export const largeDiffRule: AnalysisRule = {
  id: 'large-diff',
  description: 'Flags commits that introduce very large line changes.',
  async run(context): Promise<RuleFinding[]> {
    const linesChanged = context.additions + context.deletions;

    if (linesChanged <= LARGE_DIFF_THRESHOLD) {
      return [];
    }

    return [
      {
        type: FindingType.API_BREAK,
        severity: SeverityLevel.CRITICAL,
        title: 'Large code change detected',
        description: 'Commit introduces significant code changes.',
        metadata: {
          linesChanged,
        },
      },
    ];
  },
};

