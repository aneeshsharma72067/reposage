export interface EventListItem {
  id: string;
  repositoryId: string;
  repositoryName: string;
  githubEventId: string | null;
  type: string;
  processed: boolean;
  createdAt: string;
}

export interface AnalysisRunSummary {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface EventDetail extends EventListItem {
  payload: unknown;
  analysisRuns: AnalysisRunSummary[];
}
