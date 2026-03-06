import { FindingType, SeverityLevel } from '@prisma/client';
import type { AnalysisRule, RuleFinding } from './rule.types';

const SENSITIVE_FILENAME_KEYWORDS = [
  '.env',
  'config',
  'schema',
  'routes',
] as const;

function isSensitiveFile(filename: string): boolean {
  const normalizedFilename = filename.toLowerCase();

  return SENSITIVE_FILENAME_KEYWORDS.some((keyword) =>
    normalizedFilename.includes(keyword),
  );
}

export const sensitiveFilesRule: AnalysisRule = {
  id: 'sensitive-files',
  description: 'Flags modifications in configuration or routing related files.',
  async run(context): Promise<RuleFinding[]> {
    const findings: RuleFinding[] = [];

    for (const file of context.files) {
      if (!isSensitiveFile(file.filename)) {
        continue;
      }

      findings.push({
        type: FindingType.REFACTOR_SUGGESTION,
        severity: SeverityLevel.INFO,
        title: 'Sensitive file modified',
        description: 'Commit modifies configuration or routing files.',
        metadata: {
          filename: file.filename,
        },
      });
    }

    return findings;
  },
};

