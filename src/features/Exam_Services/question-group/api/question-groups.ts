import { useQuery } from '@tanstack/react-query';
import { apiClientES } from '@/lib/api-client-es';
import type { components } from '@/types/openapi_ES';

export type ResQuestionGroup = components['schemas']['ResQuestionGroupDTO'];
export type PageResQuestionGroup = components['schemas']['PageResQuestionGroupDTO'];

export function getQuestionGroups(params?: { name?: string; type?: string; page?: number; size?: number }) {
  return apiClientES.get<PageResQuestionGroup>('/api/v1/question-groups', {
    params: {
      ...(params?.name ? { name: params.name } : {}),
      ...(params?.type ? { type: params.type } : {}),
      pageable: { page: params?.page ?? 0, size: params?.size ?? 20 },
    },
  });
}

export function useQuestionGroupsQuery(enabled: boolean, params?: { name?: string; type?: string }) {
  return useQuery({
    queryKey: ['question-groups', params?.name ?? '', params?.type ?? ''],
    queryFn:  () => getQuestionGroups(params),
    enabled,
  });
}
