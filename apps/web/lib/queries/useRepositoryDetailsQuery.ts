import { useQuery } from '@tanstack/react-query';
import { getRepositoryDetails } from '@/lib/auth';
import type { RepositoryDetails } from '@/types/repository';

export const useRepositoryDetailsQuery = (repositoryId: string) =>
  useQuery<RepositoryDetails>({
    queryKey: ['repository', repositoryId],
    queryFn: () => getRepositoryDetails(repositoryId),
    enabled: !!repositoryId,
  });
