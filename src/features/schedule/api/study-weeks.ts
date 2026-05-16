import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/openapi';

export type StudyWeek = components['schemas']['ResStudyWeekDTO'];

export function getStudyWeeks() {
  return apiClient.get<StudyWeek[]>('/api/v1/study-weeks');
}

export function useStudyWeeksQuery() {
  return useQuery({
    queryKey: ['schedule', 'study-weeks'],
    queryFn: getStudyWeeks,
  });
}
