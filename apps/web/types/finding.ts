export interface RepositoryFinding {
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
