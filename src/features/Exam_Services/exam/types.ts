import type { components } from '@/types/openapi_ES';

export type Exam = components['schemas']['ResExamDTO'];
export type PageExam = components['schemas']['PageResExamDTO'];
export type ExamStatus = NonNullable<Exam['status']>;
export type ExamType = NonNullable<Exam['examType']>;
export type ReqCreateExam = components['schemas']['ReqCreateExamDTO'];
export type ReqUpdateExam = components['schemas']['ReqUpdateExamDTO'];
export type ReqExamQuestion = components['schemas']['ReqExamQuestionDTO'];
export type ReqExamQuestionGroup = components['schemas']['ReqExamQuestionGroupDTO'];
export type ResStandaloneQuestion = components['schemas']['ResExamStandaloneQuestionDTO'];
export type ResExamGroup = components['schemas']['ResExamQuestionGroupDTO'];

export type ResExamAttempt = components['schemas']['ResExamAttemptDTO'];
export type ResAttemptQuestion = components['schemas']['ResAttemptQuestionDTO'];
export type PageResExamAttemptSummary = components['schemas']['PageResExamAttemptSummaryDTO'];
export type ResExamAttemptSummary = components['schemas']['ResExamAttemptSummaryDTO'];
export type ReqStudentAnswer = components['schemas']['ReqStudentAnswerDTO'];

// ── Dashboard exam results ──────────────────────────────────────────────────
// Endpoint chưa có trong openapi_ES.ts → định nghĩa tay.
// GET /api/v1/dashboard/exams/{examUuid}/results
// Response: { data: { examName, schoolYear, ..., students: ResExamResult[] } }
export type ResExamResult = {
  studentId?: string;
  fullname?: string;
  userUuid?: string;
  paperCode?: string | null;
  submitSource?: string;
  sectionScores?: {
    MCQ?: number;
    TFQ?: number;
    SAQ?: number;
  };
  totalScore?: number;
  violationCount?: number;
};
