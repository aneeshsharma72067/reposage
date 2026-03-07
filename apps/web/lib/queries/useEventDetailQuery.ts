import { useQuery } from '@tanstack/react-query';
import { getEventById } from '@/lib/auth';
import type { EventDetail } from '@/types/event';

export const useEventDetailQuery = (eventId: string) =>
  useQuery<EventDetail>({
    queryKey: ['event', eventId],
    queryFn: () => getEventById(eventId),
    enabled: !!eventId,
  });
