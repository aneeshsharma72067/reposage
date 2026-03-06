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

