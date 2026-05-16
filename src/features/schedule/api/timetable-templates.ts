import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/openapi';

export type TimetableTemplate = components['schemas']['ResTimetableTemplateDTO'];

export function getTimetableTemplates() {
  return apiClient.get<TimetableTemplate[]>('/api/v1/timetable-templates');
}

export function useTimetableTemplatesQuery() {
  return useQuery({
    queryKey: ['schedule', 'timetable-templates'],
    queryFn: getTimetableTemplates,
  });
}
