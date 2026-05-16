import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { LessonType } from '@/features/curriculum/types';

export function getLessonTypes() {
  return apiClient.get<LessonType[]>('/api/v1/lesson-types');
}

export function useLessonTypesQuery() {
  return useQuery({
    queryKey: ['curriculum', 'lesson-types'],
    queryFn: getLessonTypes,
  });
}
