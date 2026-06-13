import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ReqUpdateTimetableTemplate,
  TimetableTemplate,
} from '@/features/Management_Services/timetable-template/types';

const TIMETABLE_TEMPLATES_BASE = '/api/v1/timetable-templates';
const timetableTemplatesKey = ['timetable-template'] as const;

export function getTimetableTemplates() {
  return apiClient.get<TimetableTemplate[]>(TIMETABLE_TEMPLATES_BASE);
}

export function getTemplateByGradeId(gradeId: number) {
  return apiClient.get<TimetableTemplate>(`${TIMETABLE_TEMPLATES_BASE}/grade-id/${gradeId}`);
}

export function updateTimetableTemplate(templateUuid: string, body: ReqUpdateTimetableTemplate) {
  return apiClient.put<TimetableTemplate>(`${TIMETABLE_TEMPLATES_BASE}/${templateUuid}`, body);
}

export function deleteTimetableTemplate(templateUuid: string) {
  return apiClient.delete<void>(`${TIMETABLE_TEMPLATES_BASE}/${templateUuid}`);
}

export function useTimetableTemplatesQuery() {
  return useQuery({
    queryKey: [...timetableTemplatesKey, 'all'],
    queryFn: getTimetableTemplates,
  });
}

export function useTemplateByGradeIdQuery(gradeId?: number) {
  return useQuery({
    queryKey: [...timetableTemplatesKey, 'by-grade-id', gradeId],
    queryFn: () => getTemplateByGradeId(gradeId ?? 0),
    enabled: gradeId != null,
  });
}

export function useUpdateTimetableTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateUuid, body }: { templateUuid: string; body: ReqUpdateTimetableTemplate }) =>
      updateTimetableTemplate(templateUuid, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timetableTemplatesKey }),
  });
}

export function useDeleteTimetableTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTimetableTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timetableTemplatesKey }),
  });
}
