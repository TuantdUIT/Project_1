import { useEffect, useRef, useState } from 'react';
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

// ── Tải file đề thi đã tạo (PDF) ────────────────────────────────────────────
// GET /api/v1/omr/exams/{examUuid}/exam-papers/{paperCode}/download
export function downloadExamPaper(examUuid: string, paperCode: string) {
  return apiClientES.get<Blob>(
    `/api/v1/omr/exams/${examUuid}/exam-papers/${encodeURIComponent(paperCode)}/download`,
    { responseType: 'blob', headers: { Accept: 'application/pdf' } },
  );
}

// ── Bước 3: Upload phiếu quét (scoring job) ─────────────────────────────────
// POST /api/v1/omr/scoring-jobs  — multipart/form-data: file(.pdf) + examUuid
export function createScoringJob(examUuid: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('examUuid', examUuid);
  return apiClientES.post<ResOmrScoringJob>(
    '/api/v1/omr/scoring-jobs',
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
const POLL_INTERVAL_MS = 4000;
const RESPONSE_TIMEOUT_MS = 3000; // thời gian tối đa chờ kết quả; quá hạn → Thất bại

// Bước 4: auto-poll trạng thái job.
// - Tự dừng poll khi job đã COMPLETED/FAILED.
// - Hết thời gian chờ (cố định 3 giây) mà chưa xong → coi như Thất bại (isTimedOut=true).
//   Mốc thời gian tính từ lúc bắt đầu theo dõi job.
export function useScoringJobQuery(jobUuid: string | null, enabled = true) {
  const startRef = useRef<number>(Date.now());
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Reset mốc bắt đầu + cờ timeout mỗi khi đổi job.
  useEffect(() => {
    startRef.current = Date.now();
    setIsTimedOut(false);
  }, [jobUuid]);

  const query = useQuery({
    queryKey: ['omr-scoring-job', jobUuid],
    queryFn: () => getScoringJob(jobUuid!),
    enabled: !!jobUuid && enabled && !isTimedOut,
    staleTime: 0,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : POLL_INTERVAL_MS;
    },
  });

  // Hẹn giờ "thất bại" sau 3 giây nếu job vẫn chưa kết thúc.
  const status = query.data?.status;
  useEffect(() => {
    if (!jobUuid || !enabled) return;
    if (status && TERMINAL_STATUSES.includes(status)) return;
    const remaining = RESPONSE_TIMEOUT_MS - (Date.now() - startRef.current);
    if (remaining <= 0) {
      setIsTimedOut(true);
      return;
    }
    const timer = setTimeout(() => setIsTimedOut(true), remaining);
    return () => clearTimeout(timer);
  }, [jobUuid, enabled, status]);

  return { ...query, isTimedOut };
}
