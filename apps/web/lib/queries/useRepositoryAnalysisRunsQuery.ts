import { useQuery } from '@tanstack/react-query';
import { listRepositoryAnalysisRuns } from '@/lib/auth';
import type { RepositoryAnalysisRun } from '@/types/analysis';

export const useRepositoryAnalysisRunsQuery = (repositoryId: string) =>
  useQuery<RepositoryAnalysisRun[]>({
    queryKey: ['repository', repositoryId, 'analysisRuns'],
    queryFn: () => listRepositoryAnalysisRuns(repositoryId),
    enabled: !!repositoryId,
  });
