import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Lesson, ReqUpdateLessonDTO } from '@/features/study-week/types';

const LESSONS_BASE = '/api/v1/lessons';
const lessonsKey = ['schedule', 'lessons'] as const;

export function getLessons() {
  return apiClient.get<Lesson[]>(LESSONS_BASE);
}

export function getLessonById(lessonUuid: string) {
  return apiClient.get<Lesson>(`${LESSONS_BASE}/${lessonUuid}`);
}

export function updateLesson(lessonUuid: string, body: ReqUpdateLessonDTO) {
  return apiClient.put<Lesson>(`${LESSONS_BASE}/${lessonUuid}`, body);
}

export function useLessonsQuery() {
  return useQuery({
    queryKey: lessonsKey,
    queryFn: getLessons,
  });
}

export function useLessonQuery(lessonUuid?: string) {
  return useQuery({
    queryKey: [...lessonsKey, lessonUuid],
    queryFn: () => getLessonById(lessonUuid ?? ''),
    enabled: Boolean(lessonUuid),
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonUuid, body }: { lessonUuid: string; body: ReqUpdateLessonDTO }) =>
      updateLesson(lessonUuid, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([...lessonsKey, variables.lessonUuid], data);
      queryClient.invalidateQueries({ queryKey: lessonsKey });
    },
  });
}

