import type { components } from '@/types/openapi_ES';

export type Question = components['schemas']['ResQuestionDTO'];
export type PageQuestion = components['schemas']['PageResQuestionDTO'];
export type QuestionType = NonNullable<Question['questionType']>;

export type ReqCreateQuestion = components['schemas']['ReqCreateQuestionDTO'];
export type ReqMcOption = components['schemas']['ReqQuestionMcOptionDTO'];
export type ReqTfStatement = components['schemas']['ReqQuestionTrueFalseStatementDTO'];

export type QuestionFilter = {
  content?: string;
  topic?: string;
  type?: QuestionType | '';
  isActive?: boolean | '';
  gradeId?: number | '';
  page: number;
  size: number;
};
