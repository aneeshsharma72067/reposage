import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resyncRepositories, type ResyncRepositoriesResponse } from '@/lib/auth';

export const useResyncRepositoriesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ResyncRepositoriesResponse, Error>({
    mutationFn: resyncRepositories,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
};
