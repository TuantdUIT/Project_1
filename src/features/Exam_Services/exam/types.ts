import type { components, operations } from '@/types/openapi_ES';

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

// The generated OpenAPI type still omits answer-release-only review fields.
export type ResAttemptQuestion = components['schemas']['ResAttemptQuestionDTO'] & {
  imagePath?: string | null;
  correctAnswerRaw?: string;
  correctNormalizedAnswer?: string;
  earnedScore?: number;
};
export type ResExamAttempt = components['schemas']['ResExamAttemptDTO'] & {
  questions?: ResAttemptQuestion[];
};
export type PageResExamAttemptSummary = components['schemas']['PageResExamAttemptSummaryDTO'];
export type ResExamAttemptSummary = components['schemas']['ResExamAttemptSummaryDTO'];
export type ReqStudentAnswer = components['schemas']['ReqStudentAnswerDTO'];

export type DashboardSectionType = 'MCQ' | 'TFQ' | 'SAQ';

// Dashboard endpoints exist in openapi_ES.ts, but the response schemas are still
// emitted as Record<string, never>, so FE keeps temporary manual types here.
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

export type ResQuestionStat = Record<string, unknown>;

export type ResSectionStat = {
  sectionType?: DashboardSectionType;
  averageScore?: number;
  meanScore?: number;
  standardDeviationScore?: number;
  questions?: ResQuestionStat[];
};

export type ResExamStatDashboard = {
  examUuid?: string;
  schoolYear?: string;
  examName?: string;
  startTime?: string;
  endTime?: string;
  createdBy?: string;
  sections?: ResSectionStat[];
};

export type ResStudentRanking = {
  rank?: number;
  studentId?: string;
  fullname?: string;
  userUuid?: string;
  score?: number;
};

export type ResRankingGroup = {
  paperCode?: string | null;
  students?: ResStudentRanking[];
};

export type ResExamRankingDashboard = {
  webRanking?: {
    students?: ResStudentRanking[];
  };
  paperRankings?: ResRankingGroup[];
};

type _AssertStatsUntyped =
  operations['getExamStats']['responses'][200]['content'] extends { '*/*': Record<string, never> }
    ? true
    : never;

type _AssertRankingUntyped =
  operations['getExamRanking']['responses'][200]['content'] extends { '*/*': Record<string, never> }
    ? true
    : never;

const _statsTripwire: _AssertStatsUntyped = true;
const _rankingTripwire: _AssertRankingUntyped = true;
