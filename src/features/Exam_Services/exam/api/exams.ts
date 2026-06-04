import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type {
  Exam,
  PageExam,
  ReqCreateExam,
  ReqUpdateExam,
  ResExamAttempt,
  PageResExamAttemptSummary,
  ReqStudentAnswer,
  ResExamResult,
} from '../types';

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

// ── Dashboard exam results ──────────────────────────────────────────────────

// Backend có thể trả mảng trực tiếp hoặc object bọc (Spring Page: { content },
// hoặc { data } / { results }) → giữ kiểu raw rồi chuẩn hóa ở select.
export function getExamResults(examUuid: string) {
  return apiClientES.get<unknown>(`/api/v1/dashboard/exams/${examUuid}/results`);
}

function normalizeExamResults(raw: unknown): ResExamResult[] {
  if (Array.isArray(raw)) return raw as ResExamResult[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj.students ?? obj.content ?? obj.results ?? obj.data ?? obj.items;
    if (Array.isArray(arr)) return arr as ResExamResult[];
  }
  return [];
}

export function useExamResultsQuery(examUuid: string | null, enabled = true) {
  return useQuery({
    queryKey: ['exam-results', examUuid],
    queryFn: () => getExamResults(examUuid!),
    enabled: !!examUuid && enabled,
    select: normalizeExamResults,
    // Ghi đè staleTime global (5 phút) → luôn gọi API mới mỗi lần mở dialog.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
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

// ── Attempt APIs ──────────────────────────────────────────────────────────────

export function startAttempt(examUuid: string) {
  return apiClientES.post<ResExamAttempt>(`/api/v1/student/exams/${examUuid}/attempts`);
}

export function useStartAttemptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examUuid: string) => startAttempt(examUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
    },
  });
}

export function getAttempts() {
  return apiClientES.get<PageResExamAttemptSummary>('/api/v1/student/attempts', {
    params: { pageable: { page: 0, size: 100 } },
  });
}

export function useAttemptsQuery() {
  return useQuery({
    queryKey: ['attempts'],
    queryFn: getAttempts,
  });
}

export function getAttempt(attemptUuid: string) {
  return apiClientES.get<ResExamAttempt>(`/api/v1/student/attempts/${attemptUuid}`);
}

export function useAttemptQuery(attemptUuid: string) {
  return useQuery({
    queryKey: ['attempts', attemptUuid],
    queryFn: () => getAttempt(attemptUuid),
    enabled: !!attemptUuid,
  });
}

export function saveAnswer(attemptUuid: string, body: ReqStudentAnswer) {
  return apiClientES.post(`/api/v1/student/attempts/${attemptUuid}/answers`, body);
}

export function submitAttempt(attemptUuid: string) {
  return apiClientES.post<ResExamAttempt>(`/api/v1/student/attempts/${attemptUuid}/submit`);
}

export function useSubmitAttemptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attemptUuid: string) => submitAttempt(attemptUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
    },
  });
}
