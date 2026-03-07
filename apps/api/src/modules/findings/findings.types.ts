export interface FindingListItem {
  id: string;
  analysisRunId: string;
  repositoryId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  metadata: unknown;
  createdAt: string;
}

export interface FindingDetail {
  id: string;
  analysisRunId: string;
  repositoryId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  metadata: unknown;
  createdAt: string;
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

