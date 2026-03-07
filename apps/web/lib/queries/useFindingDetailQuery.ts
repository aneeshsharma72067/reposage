import { useQuery } from '@tanstack/react-query';
import { getFindingById } from '@/lib/auth';
import type { FindingDetail } from '@/types/finding';

export const useFindingDetailQuery = (findingId: string) =>
  useQuery<FindingDetail>({
    queryKey: ['finding', findingId],
    queryFn: () => getFindingById(findingId),
    enabled: !!findingId,
  });
