import { useQuery } from '@tanstack/react-query';
import { listEvents } from '@/lib/auth';
import type { EventListItem } from '@/types/event';

export const useEventsQuery = () =>
  useQuery<EventListItem[]>({
    queryKey: ['events'],
    queryFn: listEvents,
  });
