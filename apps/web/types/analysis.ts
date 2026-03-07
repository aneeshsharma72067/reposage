export interface RepositoryAnalysisRun {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  event: {
    id: string;
    type: string;
    githubEventId: string | null;
    createdAt: string;
  };
}

export interface AnalysisRunDetailFinding {
  id: string;
  repositoryId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AnalysisRunDetail {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  repository: {
    id: string;
    name: string;
    fullName: string;
    status: string;
    isActive: boolean;
    defaultBranch: string | null;
    private: boolean;
  };
  event: {
    id: string;
    type: string;
    githubEventId: string | null;
    processed: boolean;
    createdAt: string;
    payload: unknown;
  };
  findings: AnalysisRunDetailFinding[];
}
