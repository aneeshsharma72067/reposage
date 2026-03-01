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
