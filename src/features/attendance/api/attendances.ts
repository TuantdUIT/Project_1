import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Attendance, ReqCreateAttendanceDTO } from '@/features/attendance/types';

const ATTENDANCES_BASE = '/api/v1/attendances';
export const attendancesKey = ['attendance', 'records'] as const;

export function getAttendances() {
  return apiClient.get<Attendance[]>(ATTENDANCES_BASE);
}

export function createAttendance(body: ReqCreateAttendanceDTO) {
  return apiClient.post<Attendance>(ATTENDANCES_BASE, body);
}

export function deleteAttendance(attendanceUuid: string) {
  return apiClient.delete<void>(`${ATTENDANCES_BASE}/${attendanceUuid}`);
}

export function useAttendancesQuery() {
  return useQuery({
    queryKey: attendancesKey,
    queryFn: getAttendances,
  });
}

export function useInvalidateAttendances() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: attendancesKey });
}

