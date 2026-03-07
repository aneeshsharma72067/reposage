import { useQuery } from '@tanstack/react-query';
import { getAnalysisRunById } from '@/lib/auth';
import type { AnalysisRunDetail } from '@/types/analysis';

export const useAnalysisRunDetailQuery = (analysisRunId: string) =>
  useQuery<AnalysisRunDetail>({
    queryKey: ['analysisRun', analysisRunId],
    queryFn: () => getAnalysisRunById(analysisRunId),
    enabled: !!analysisRunId,
  });
