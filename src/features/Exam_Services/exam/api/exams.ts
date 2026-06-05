import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import {
  downloadBlobFile,
  sanitizeDownloadName,
} from '@/features/Exam_Services/exam/lib/download';
import type {
  Exam,
  PageExam,
  ReqCreateExam,
  ReqUpdateExam,
  ResExamAttempt,
  PageResExamAttemptSummary,
  ReqStudentAnswer,
  ResExamRankingDashboard,
  ResExamResult,
  ResExamStatDashboard,
} from '../types';

export type ExamDashboardKind = 'stats' | 'results' | 'rankings';

function buildDashboardUrl(kind: ExamDashboardKind, examUuid: string) {
  return `/api/v1/dashboard/exams/${examUuid}/${kind}`;
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

function normalizeExamStats(raw: unknown): ResExamStatDashboard {
  if (raw && typeof raw === 'object') {
    return raw as ResExamStatDashboard;
  }
  return {};
}

function normalizeExamRanking(raw: unknown): ResExamRankingDashboard {
  if (raw && typeof raw === 'object') {
    return raw as ResExamRankingDashboard;
  }
  return {};
}

function buildRankingParams(n?: number) {
  return n && Number.isFinite(n) ? { n } : undefined;
}

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

// ===========================================================================
// Dashboard endpoints: mỗi endpoint có 2 TRẠNG THÁI, tách thành 2 API riêng.
//
// Backend khai báo `ResponseEntity<?>` vì cùng một URL trả 2 kiểu body:
//   - Mặc định          -> JSON  (RestResponse<DTO>, interceptor đã bóc còn DTO)
//   - ?exportXlsx=true   -> Excel (byte[] / Blob)
//
// Phía FE KHÔNG xử lý nhập nhằng bằng `any` hay kiểm tra runtime, mà tách rõ
// theo MỤC ĐÍCH request:
//   1) getExam*    -> trạng thái XEM:    parse JSON, type theo DTO.
//   2) exportExam* -> trạng thái EXPORT: responseType 'blob', type là Blob.
// ===========================================================================

// --- Trạng thái 1: XEM (JSON) ----------------------------------------------

// Endpoint results trả về mảng hoặc object bọc tùy backend, nên giữ `unknown`
// và chuẩn hóa shape ở `select: normalizeExamResults` (an toàn hơn `any`).
export function getExamResults(examUuid: string): Promise<unknown> {
  return apiClientES.get<unknown>(buildDashboardUrl('results', examUuid));
}

export function getExamStats(examUuid: string): Promise<ResExamStatDashboard> {
  return apiClientES.get<ResExamStatDashboard>(buildDashboardUrl('stats', examUuid));
}

export function getExamRanking(examUuid: string, n?: number): Promise<ResExamRankingDashboard> {
  return apiClientES.get<ResExamRankingDashboard>(buildDashboardUrl('rankings', examUuid), {
    params: buildRankingParams(n),
  });
}

function buildDashboardQueryOptions(examUuid: string | null, enabled = true) {
  return {
    enabled: !!examUuid && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always' as const,
  };
}

export function useExamResultsQuery(examUuid: string | null, enabled = true) {
  return useQuery({
    queryKey: ['exam-results', examUuid],
    queryFn: () => getExamResults(examUuid!),
    select: normalizeExamResults,
    ...buildDashboardQueryOptions(examUuid, enabled),
  });
}

export function useExamStatsQuery(examUuid: string | null, enabled = true) {
  return useQuery({
    queryKey: ['exam-stats', examUuid],
    queryFn: () => getExamStats(examUuid!),
    select: normalizeExamStats,
    ...buildDashboardQueryOptions(examUuid, enabled),
  });
}

export function useExamRankingQuery(examUuid: string | null, enabled = true, n?: number) {
  return useQuery({
    queryKey: ['exam-ranking', examUuid, n ?? 'default'],
    queryFn: () => getExamRanking(examUuid!, n),
    select: normalizeExamRanking,
    ...buildDashboardQueryOptions(examUuid, enabled),
  });
}

// --- Trạng thái 2: EXPORT (Blob) -------------------------------------------
// Dùng chung cho cả 3 tab (stats/results/rankings) vì UI chỉ có 1 nút Export
// xuất theo tab đang mở. `exportXlsx: true` chọn nhánh export ở backend, còn
// `responseType: 'blob'` buộc axios KHÔNG parse JSON -> nhận file nhị phân.
export async function exportExamDashboard(
  kind: ExamDashboardKind,
  examUuid: string,
  options?: { examName?: string; n?: number },
): Promise<void> {
  const blob = await apiClientES.get<Blob>(buildDashboardUrl(kind, examUuid), {
    params: {
      exportXlsx: true,
      ...(kind === 'rankings' ? buildRankingParams(options?.n) : {}),
    },
    responseType: 'blob',
  });

  const prefix = options?.examName ? sanitizeDownloadName(options.examName) : `exam-${examUuid}`;
  downloadBlobFile(blob, `${prefix}-${kind}.xlsx`);
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
