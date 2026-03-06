import { FindingType, Prisma, SeverityLevel } from '@prisma/client';

export interface AnalysisContextFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
}

export interface AnalysisContext {
  repository: {
    id: string;
    fullName: string;
    owner: string;
    name: string;
  };
  commitSha: string;
  commitMessage: string;
  files: AnalysisContextFile[];
  additions: number;
  deletions: number;
  changedFilesCount: number;
}

export interface RuleFinding {
  type: FindingType;
  severity: SeverityLevel;
  title: string;
  description: string;
  metadata: Prisma.InputJsonObject;
}

export interface AnalysisRule {
  id: string;
  description: string;
  run(context: AnalysisContext): Promise<RuleFinding[]>;
}

