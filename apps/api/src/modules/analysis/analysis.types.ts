export interface GitHubPushPayload {
  ref?: string;
  after?: string;
  repository?: {
    id?: number;
    full_name?: string;
  };
  pusher?: {
    name?: string;
  };
}

export interface AnalysisRunListItem {
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

export interface AnalysisFindingListItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  metadata: unknown;
  createdAt: string;
  analysisRun: {
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  };
}

