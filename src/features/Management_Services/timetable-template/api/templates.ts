import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TimetableTemplate } from '@/features/Management_Services/timetable-template/types';

const TIMETABLE_TEMPLATES_BASE = '/api/v1/timetable-templates';

export function getTimetableTemplates() {
  return apiClient.get<TimetableTemplate[]>(TIMETABLE_TEMPLATES_BASE);
}

export function getTemplateByGradeId(gradeId: number) {
  return apiClient.get<TimetableTemplate>(`${TIMETABLE_TEMPLATES_BASE}/grade-id/${gradeId}`);
}

export function useTimetableTemplatesQuery() {
  return useQuery({
    queryKey: ['timetable-template', 'all'],
    queryFn: getTimetableTemplates,
  });
}

export function useTemplateByGradeIdQuery(gradeId?: number) {
  return useQuery({
    queryKey: ['timetable-template', 'by-grade-id', gradeId],
    queryFn: () => getTemplateByGradeId(gradeId ?? 0),
    enabled: gradeId != null,
  });
}
