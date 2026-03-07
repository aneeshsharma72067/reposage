import { useQuery } from '@tanstack/react-query';
import { listRepositories } from '@/lib/auth';
import type { RepositoryListItem } from '@/types/repository';

export const useRepositoriesQuery = () =>
  useQuery<RepositoryListItem[]>({
    queryKey: ['repositories'],
    queryFn: listRepositories,
  });
