export type FindingType = 'API_BREAK' | 'ARCH_VIOLATION' | 'REFACTOR_SUGGESTION';

export type FindingSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Finding {
  id: string;
  analysisRunId: string;
  repositoryId: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  repositoryName?: string;
  repositoryFullName?: string;
  analysisRun?: {
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
}

export type RepositoryFinding = Finding;
