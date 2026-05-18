import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ReqCreatePeriodDTO,
  ReqUpdatePeriodDTO,
  ResPeriodDTO,
} from '@/features/admin/types';

const PERIODS_BASE = '/api/v1/periods';

export function getAllPeriods() {
  return apiClient.get<ResPeriodDTO[]>(PERIODS_BASE);
}

export function getPeriodsByUser(userUuid: string) {
  return getAllPeriods().then((list) => list.filter((p) => p.user_uuid === userUuid));
}

export function getPeriodById(periodUuid: string) {
  return apiClient.get<ResPeriodDTO>(`${PERIODS_BASE}/${periodUuid}`);
}

export function createPeriod(body: ReqCreatePeriodDTO) {
  return apiClient.post<ResPeriodDTO>(PERIODS_BASE, body);
}

export function updatePeriod(periodUuid: string, body: ReqUpdatePeriodDTO) {
  return apiClient.put<ResPeriodDTO>(`${PERIODS_BASE}/${periodUuid}`, body);
}

export function deletePeriod(periodUuid: string) {
  return apiClient.delete<void>(`${PERIODS_BASE}/${periodUuid}`);
}

export function usePeriodsByUserQuery(userUuid?: string) {
  return useQuery({
    queryKey: ['admin', 'periods', 'by-user', userUuid],
    queryFn: () => getPeriodsByUser(userUuid ?? ''),
    enabled: Boolean(userUuid),
  });
}

function invalidateStudentAndPeriods(
  queryClient: ReturnType<typeof useQueryClient>,
  userUuid: string | undefined,
) {
  if (userUuid) {
    queryClient.invalidateQueries({ queryKey: ['admin', 'periods', 'by-user', userUuid] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'students', userUuid] });
  }
  queryClient.invalidateQueries({ queryKey: ['admin', 'periods'] });
  queryClient.invalidateQueries({
    queryKey: ['admin', 'students'],
    predicate: (query) => typeof query.queryKey[2] === 'object' && query.queryKey[2] !== null,
  });
  queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPeriod,
    onSuccess: (_data, variables) => {
      invalidateStudentAndPeriods(queryClient, variables.userUuid);
    },
  });
}

export function useUpdatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ periodUuid, body }: { periodUuid: string; body: ReqUpdatePeriodDTO; userUuid?: string }) =>
      updatePeriod(periodUuid, body),
    onSuccess: (data, variables) => {
      invalidateStudentAndPeriods(queryClient, variables.userUuid ?? data.user_uuid);
    },
  });
}

export function useDeletePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ periodUuid }: { periodUuid: string; userUuid?: string }) => deletePeriod(periodUuid),
    onSuccess: (_data, variables) => {
      invalidateStudentAndPeriods(queryClient, variables.userUuid);
    },
  });
}
