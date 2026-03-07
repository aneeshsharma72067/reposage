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

export interface FindingDetail extends Finding {
  repository: {
    id: string;
    name: string;
    fullName: string;
    status: string;
    isActive: boolean;
    defaultBranch: string | null;
    private: boolean;
  };
  analysisRun: {
    id: string;
    status: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
    event: {
      id: string;
      type: string;
      githubEventId: string | null;
      processed: boolean;
      createdAt: string;
      payload: unknown;
    };
  };
}

export type RepositoryFinding = Finding;
