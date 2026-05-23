import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ReqCreateStudyWeekDTO,
  ReqUpdateStudyWeekDTO,
  StudyWeek,
} from '@/features/study-week/types';

const STUDY_WEEKS_BASE = '/api/v1/study-weeks';
const studyWeeksKey = ['schedule', 'study-weeks'] as const;
const lessonsKey = ['schedule', 'lessons'] as const;

export function getStudyWeeks() {
  return apiClient.get<StudyWeek[]>(STUDY_WEEKS_BASE);
}

export function getStudyWeekById(weekUuid: string) {
  return apiClient.get<StudyWeek>(`${STUDY_WEEKS_BASE}/${weekUuid}`);
}

export function createStudyWeek(body: ReqCreateStudyWeekDTO) {
  return apiClient.post<StudyWeek>(STUDY_WEEKS_BASE, body);
}

export function updateStudyWeek(weekUuid: string, body: ReqUpdateStudyWeekDTO) {
  return apiClient.put<StudyWeek>(`${STUDY_WEEKS_BASE}/${weekUuid}`, body);
}

export function deleteStudyWeek(weekUuid: string) {
  return apiClient.delete<void>(`${STUDY_WEEKS_BASE}/${weekUuid}`);
}

export function useStudyWeeksQuery() {
  return useQuery({
    queryKey: studyWeeksKey,
    queryFn: getStudyWeeks,
  });
}

export function useStudyWeekQuery(weekUuid?: string) {
  return useQuery({
    queryKey: [...studyWeeksKey, weekUuid],
    queryFn: () => getStudyWeekById(weekUuid ?? ''),
    enabled: Boolean(weekUuid),
  });
}

export function useCreateStudyWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudyWeek,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyWeeksKey });
      queryClient.invalidateQueries({ queryKey: lessonsKey });
    },
  });
}

export function useUpdateStudyWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weekUuid, body }: { weekUuid: string; body: ReqUpdateStudyWeekDTO }) =>
      updateStudyWeek(weekUuid, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([...studyWeeksKey, variables.weekUuid], data);
      queryClient.invalidateQueries({ queryKey: studyWeeksKey });
      queryClient.invalidateQueries({ queryKey: lessonsKey });
    },
  });
}

export function useDeleteStudyWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudyWeek,
    onSuccess: (_data, weekUuid) => {
      queryClient.removeQueries({ queryKey: [...studyWeeksKey, weekUuid] });
      queryClient.invalidateQueries({ queryKey: studyWeeksKey });
      queryClient.invalidateQueries({ queryKey: lessonsKey });
    },
  });
}

