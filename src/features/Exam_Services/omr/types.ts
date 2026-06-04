import type { components } from '@/types/openapi_ES';

// ── OMR DTOs (từ openapi_ES.ts) ─────────────────────────────────────────────
export type ReqCreateExamPaper = components['schemas']['ReqCreateExamPaperDTO'];
export type ResExamPaper = components['schemas']['ResExamPaperDTO'];
export type ResExamPaperQuestion = components['schemas']['ResExamPaperQuestionDTO'];

export type ResOmrScoringJob = components['schemas']['ResOmrScoringJobDTO'];
export type ResOmrScoringJobResult = components['schemas']['ResOmrScoringJobResultDTO'];
export type OmrScoringJobStatus = NonNullable<ResOmrScoringJob['status']>;

// ── Bản ghi lưu phía client ─────────────────────────────────────────────────
// Backend chưa có endpoint LIST cho exam-papers / scoring-jobs, nên ta lưu lại
// những gì admin đã tạo/upload vào localStorage để hiển thị danh sách.
export type StoredExamPaper = ResExamPaper & {
  examName?: string;
  savedAt: string;
};

export type StoredScoringJob = ResOmrScoringJob & {
  examName?: string;
  fileName?: string;
  savedAt: string;
};
