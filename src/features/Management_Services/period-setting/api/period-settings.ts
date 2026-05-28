import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ReqCreatePeriodSettingDTO,
  ReqUpdatePeriodSettingDTO,
  ResPeriodSettingDTO,
} from '@/features/Management_Services/period-setting/types';

const PERIOD_SETTINGS_BASE = '/api/v1/period-settings';

export function getPeriodSettings() {
  return apiClient.get<ResPeriodSettingDTO[]>(PERIOD_SETTINGS_BASE);
}

export function getPeriodSettingById(uuid: string) {
  return apiClient.get<ResPeriodSettingDTO>(`${PERIOD_SETTINGS_BASE}/${uuid}`);
}

export function createPeriodSetting(body: ReqCreatePeriodSettingDTO) {
  return apiClient.post<ResPeriodSettingDTO>(PERIOD_SETTINGS_BASE, body);
}

export function updatePeriodSetting(uuid: string, body: ReqUpdatePeriodSettingDTO) {
  return apiClient.put<ResPeriodSettingDTO>(`${PERIOD_SETTINGS_BASE}/${uuid}`, body);
}

export function deletePeriodSetting(uuid: string) {
  return apiClient.delete<void>(`${PERIOD_SETTINGS_BASE}/${uuid}`);
}

export function usePeriodSettingsQuery() {
  return useQuery({
    queryKey: ['period-settings'],
    queryFn: getPeriodSettings,
  });
}

export function usePeriodSettingByIdQuery(uuid?: string) {
  return useQuery({
    queryKey: ['period-settings', uuid],
    queryFn: () => getPeriodSettingById(uuid ?? ''),
    enabled: Boolean(uuid),
  });
}

export function useCreatePeriodSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPeriodSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-settings'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] });
    },
  });
}

export function useUpdatePeriodSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, body }: { uuid: string; body: ReqUpdatePeriodSettingDTO }) =>
      updatePeriodSetting(uuid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-settings'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] });
    },
  });
}

export function useDeletePeriodSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePeriodSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-settings'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] });
    },
  });
}
