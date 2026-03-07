import { useQuery } from '@tanstack/react-query';
import { listRepositoryFindings } from '@/lib/auth';
import type { RepositoryFinding } from '@/types/finding';

export const useRepositoryFindingsQuery = (repositoryId: string) =>
  useQuery<RepositoryFinding[]>({
    queryKey: ['repository', repositoryId, 'findings'],
    queryFn: () => listRepositoryFindings(repositoryId),
    enabled: !!repositoryId,
  });
