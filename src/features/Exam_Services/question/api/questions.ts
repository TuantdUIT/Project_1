import { useQuery } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { PageQuestion, QuestionFilter, QuestionType } from '../types';

function buildParams(filter: Omit<QuestionFilter, 'page' | 'size'>, page: number, size: number) {
  return {
    ...(filter.content   ? { content:  filter.content }               : {}),
    ...(filter.topic     ? { topic:    filter.topic }                  : {}),
    ...(filter.type      ? { type:     filter.type }                   : {}),
    ...(filter.gradeId   ? { gradeId:  filter.gradeId }                : {}),
    ...(filter.isActive !== '' ? { isActive: filter.isActive }         : {}),
    pageable: { page, size },
  };
}

export function getQuestions(filter: QuestionFilter) {
  const { page, size, ...rest } = filter;
  return apiClientES.get<PageQuestion>('/api/v1/questions', { params: buildParams(rest, page, size) });
}

export function getQuestionCount(type?: QuestionType) {
  return apiClientES.get<PageQuestion>('/api/v1/questions', {
    params: { ...(type ? { type } : {}), pageable: { page: 0, size: 1 } },
  });
}

export function useQuestionsQuery(filter: QuestionFilter) {
  return useQuery({
    queryKey: ['questions', filter],
    queryFn: () => getQuestions(filter),
  });
}

export function useQuestionCountQuery(type?: QuestionType) {
  return useQuery({
    queryKey: ['questions-count', type ?? 'all'],
    queryFn: () => getQuestionCount(type),
  });
}
