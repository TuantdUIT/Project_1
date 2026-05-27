import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { attendancesKey } from '@/features/attendance/api/attendances';
import { lessonsKey } from '@/features/study-week/api/lessons';
import type {
  RecordAttendance,
  ReqCreateRecordAttendanceDTO,
} from '@/features/attendance/types';

const RECORD_ATTENDANCES_BASE = '/api/v1/record-attendances';

export function createRecordAttendance(body: ReqCreateRecordAttendanceDTO) {
  return apiClient.post<RecordAttendance>(RECORD_ATTENDANCES_BASE, body);
}

export function deleteRecordAttendance(raAttdUuid: string) {
  return apiClient.delete<void>(`${RECORD_ATTENDANCES_BASE}/${raAttdUuid}`);
}

export function useToggleRecordAttendance() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createRecordAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKey });
      queryClient.invalidateQueries({ queryKey: lessonsKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecordAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendancesKey });
      queryClient.invalidateQueries({ queryKey: lessonsKey });
    },
  });

  async function toggle({
    currentRaUuid,
    createPayload,
  }: {
    currentRaUuid?: string;
    createPayload: ReqCreateRecordAttendanceDTO;
  }) {
    if (currentRaUuid) {
      await deleteMutation.mutateAsync(currentRaUuid);
      return undefined;
    }

    return createMutation.mutateAsync(createPayload);
  }

  return {
    toggle,
    isPending: createMutation.isPending || deleteMutation.isPending,
  };
}
