import { useCallback, useEffect, useState } from 'react';
import type { StoredExamPaper, StoredScoringJob } from '../types';

// Lưu lịch sử tạo mã đề / upload phiếu phía client.
// LƯU Ý: đây là giải pháp tạm vì backend CHƯA có endpoint list
// (GET /omr/exam-papers, GET /omr/scoring-jobs). Dữ liệu chỉ tồn tại trên
// trình duyệt này — không thấy item do người/máy khác tạo. Khi backend bổ sung
// endpoint list, nên thay localStorage bằng query thật.
const PAPERS_KEY = 'omr_exam_papers';
const JOBS_KEY = 'omr_scoring_jobs';

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bỏ qua lỗi quota / storage không khả dụng */
  }
}

export function useOmrStore() {
  const [papers, setPapers] = useState<StoredExamPaper[]>(() => read<StoredExamPaper>(PAPERS_KEY));
  const [jobs, setJobs] = useState<StoredScoringJob[]>(() => read<StoredScoringJob>(JOBS_KEY));

  useEffect(() => { write(PAPERS_KEY, papers); }, [papers]);
  useEffect(() => { write(JOBS_KEY, jobs); }, [jobs]);

  const addPaper = useCallback((paper: StoredExamPaper) => {
    setPapers((prev) => [paper, ...prev]);
  }, []);

  const removePaper = useCallback((paperUuid?: string) => {
    setPapers((prev) => prev.filter((p) => p.paperUuid !== paperUuid));
  }, []);

  const addJob = useCallback((job: StoredScoringJob) => {
    setJobs((prev) => [job, ...prev]);
  }, []);

  const updateJob = useCallback((jobUuid: string, patch: Partial<StoredScoringJob>) => {
    setJobs((prev) => prev.map((j) => (j.jobUuid === jobUuid ? { ...j, ...patch } : j)));
  }, []);

  const removeJob = useCallback((jobUuid?: string) => {
    setJobs((prev) => prev.filter((j) => j.jobUuid !== jobUuid));
  }, []);

  return { papers, jobs, addPaper, removePaper, addJob, updateJob, removeJob };
}
