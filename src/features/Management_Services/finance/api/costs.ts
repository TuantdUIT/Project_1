import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Cost, ReqCreateCostDTO, ReqUpdateCostDTO } from '@/features/Management_Services/finance/types';

const COSTS_BASE = '/api/v1/costs';
export const costsKey = ['finance', 'costs'] as const;

export function getCosts() {
  return apiClient.get<Cost[]>(COSTS_BASE);
}

export function getCostById(costUuid: string) {
  return apiClient.get<Cost>(`${COSTS_BASE}/${costUuid}`);
}

export function createCost(body: ReqCreateCostDTO) {
  return apiClient.post<Cost>(COSTS_BASE, body);
}

export function updateCost(costUuid: string, body: ReqUpdateCostDTO) {
  return apiClient.put<Cost>(`${COSTS_BASE}/${costUuid}`, body);
}

export function deleteCost(costUuid: string) {
  return apiClient.delete<void>(`${COSTS_BASE}/${costUuid}`);
}

export function useCostsQuery() {
  return useQuery({
    queryKey: costsKey,
    queryFn: getCosts,
  });
}

export function useCreateCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: costsKey }),
  });
}

export function useUpdateCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ costUuid, body }: { costUuid: string; body: ReqUpdateCostDTO }) =>
      updateCost(costUuid, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([...costsKey, variables.costUuid], data);
      queryClient.invalidateQueries({ queryKey: costsKey });
    },
  });
}

export function useDeleteCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: costsKey }),
  });
}

