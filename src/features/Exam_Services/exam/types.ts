import type { components } from '@/types/openapi_ES';

export type Exam = components['schemas']['ResExamDTO'];
export type PageExam = components['schemas']['PageResExamDTO'];
export type ExamStatus = NonNullable<Exam['status']>;
export type ExamType = NonNullable<Exam['examType']>;
export type ReqCreateExam = components['schemas']['ReqCreateExamDTO'];
export type ReqUpdateExam = components['schemas']['ReqUpdateExamDTO'];
