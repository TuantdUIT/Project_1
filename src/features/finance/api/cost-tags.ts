import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CostTag, ReqCreateCostTagDTO, ReqUpdateCostTagDTO } from '@/features/finance/types';
import { costsKey } from './costs';

const COST_TAGS_BASE = '/api/v1/cost-tags';
export const costTagsKey = ['finance', 'cost-tags'] as const;

export function getCostTags() {
  return apiClient.get<CostTag[]>(COST_TAGS_BASE);
}

export function getCostTagById(costTagId: number) {
  return apiClient.get<CostTag>(`${COST_TAGS_BASE}/${costTagId}`);
}

export function createCostTag(body: ReqCreateCostTagDTO) {
  return apiClient.post<CostTag>(COST_TAGS_BASE, body);
}

export function updateCostTag(costTagId: number, body: ReqUpdateCostTagDTO) {
  return apiClient.put<CostTag>(`${COST_TAGS_BASE}/${costTagId}`, body);
}

export function deleteCostTag(costTagId: number) {
  return apiClient.delete<void>(`${COST_TAGS_BASE}/${costTagId}`);
}

export function useCostTagsQuery() {
  return useQuery({
    queryKey: costTagsKey,
    queryFn: getCostTags,
  });
}

export function useCreateCostTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCostTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: costTagsKey }),
  });
}

export function useUpdateCostTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ costTagId, body }: { costTagId: number; body: ReqUpdateCostTagDTO }) =>
      updateCostTag(costTagId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costTagsKey });
      queryClient.invalidateQueries({ queryKey: costsKey });
    },
  });
}

export function useDeleteCostTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCostTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costTagsKey });
      queryClient.invalidateQueries({ queryKey: costsKey });
    },
  });
}

