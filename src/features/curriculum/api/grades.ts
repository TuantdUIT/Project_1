import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { GradesOverview } from '@/features/curriculum/types';

export function getGrades() {
  return apiClient.get<GradesOverview>('/api/v1/grades');
}

export function useGradesQuery() {
  return useQuery({
    queryKey: ['curriculum', 'grades'],
    queryFn: getGrades,
  });
}
