import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { ReqCreateExamPaper, ResExamPaper, ResOmrScoringJob } from '../types';

// ── Bước 1: Tạo mã đề (exam paper) ──────────────────────────────────────────
export function createExamPaper(body: ReqCreateExamPaper) {
  return apiClientES.post<ResExamPaper>('/api/v1/omr/exam-papers', body);
}

export function useCreateExamPaperMutation() {
  return useMutation({
    mutationFn: (body: ReqCreateExamPaper) => createExamPaper(body),
  });
}

// ── Bước 3: Upload phiếu quét (scoring job) ─────────────────────────────────
// POST /api/v1/omr/scoring-jobs?examUuid={uuid}  — multipart/form-data: file(.pdf)
export function createScoringJob(examUuid: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClientES.post<ResOmrScoringJob>(
    `/api/v1/omr/scoring-jobs?examUuid=${encodeURIComponent(examUuid)}`,
    formData,
    // Đặt multipart để axios không JSON-hóa FormData; browser tự thêm boundary.
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}

export function useCreateScoringJobMutation() {
  return useMutation({
    mutationFn: ({ examUuid, file }: { examUuid: string; file: File }) =>
      createScoringJob(examUuid, file),
  });
}

// ── Theo dõi trạng thái job (đọc lại để làm mới) ────────────────────────────
export function getScoringJob(jobUuid: string) {
  return apiClientES.get<ResOmrScoringJob>(`/api/v1/omr/scoring-jobs/${jobUuid}`);
}

const TERMINAL_STATUSES: ResOmrScoringJob['status'][] = ['COMPLETED', 'FAILED'];

// Bước 4: auto-poll trạng thái job. Tự dừng poll khi job đã COMPLETED/FAILED.
export function useScoringJobQuery(jobUuid: string | null, enabled = true) {
  return useQuery({
    queryKey: ['omr-scoring-job', jobUuid],
    queryFn: () => getScoringJob(jobUuid!),
    enabled: !!jobUuid && enabled,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 4000;
    },
  });
}
