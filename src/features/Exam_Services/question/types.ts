import type { components } from '@/types/openapi_ES';

export type Question = components['schemas']['ResQuestionDTO'];
export type PageQuestion = components['schemas']['PageResQuestionDTO'];
export type QuestionType = NonNullable<Question['questionType']>;

export type QuestionFilter = {
  content?: string;
  topic?: string;
  type?: QuestionType | '';
  isActive?: boolean | '';
  gradeId?: number | '';
  page: number;
  size: number;
};
