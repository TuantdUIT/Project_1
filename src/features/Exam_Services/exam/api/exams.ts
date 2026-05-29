import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { Exam, PageExam, ReqCreateExam, ReqUpdateExam } from '../types';

export function getExams() {
  return apiClientES.get<PageExam>('/api/v1/exams', {
    params: { pageable: { page: 0, size: 100 } },
  });
}

export function getExam(examUuid: string) {
  return apiClientES.get<Exam>(`/api/v1/exams/${examUuid}`);
}

export function useExamsQuery() {
  return useQuery({
    queryKey: ['exams'],
    queryFn: getExams,
  });
}

export function useExamQuery(examUuid: string) {
  return useQuery({
    queryKey: ['exams', examUuid],
    queryFn: () => getExam(examUuid),
    enabled: !!examUuid,
  });
}

export function createExam(body: ReqCreateExam) {
  return apiClientES.post<Exam>('/api/v1/exams', body);
}

export function useCreateExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function updateExam(examUuid: string, body: ReqUpdateExam) {
  return apiClientES.put<Exam>(`/api/v1/exams/${examUuid}`, body);
}

export function useUpdateExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examUuid, body }: { examUuid: string; body: ReqUpdateExam }) =>
      updateExam(examUuid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}
