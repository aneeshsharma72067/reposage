import { useQuery } from '@tanstack/react-query';
import { listFindings } from '@/lib/auth';
import type { Finding } from '@/types/finding';

export const useFindingsQuery = () =>
  useQuery<Finding[]>({
    queryKey: ['findings'],
    queryFn: listFindings,
  });
