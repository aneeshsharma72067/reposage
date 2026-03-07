export type AnalysisContext = {
  repository: string;
  commitSha: string;
  commitMessage: string;
  files: {
    filename: string;
    patch: string;
  }[];
};

export type AIFinding = {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  file?: string;
};

