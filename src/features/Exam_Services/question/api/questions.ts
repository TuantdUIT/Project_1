import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { PageQuestion, Question, QuestionFilter, QuestionType, ReqCreateQuestion, ReqUpdateQuestion } from '../types';

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

export function createQuestion(body: ReqCreateQuestion) {
  return apiClientES.post<Question>('/api/v1/questions', body);
}

export function useCreateQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions-count'] });
    },
  });
}

export function updateQuestion(questionUuid: string, body: ReqUpdateQuestion) {
  return apiClientES.put<Question>(`/api/v1/questions/${questionUuid}`, body);
}

export function useUpdateQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionUuid, body }: { questionUuid: string; body: ReqUpdateQuestion }) =>
      updateQuestion(questionUuid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}
