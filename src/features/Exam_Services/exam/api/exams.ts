import { useQuery } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { Exam, PageExam } from '../types';

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
