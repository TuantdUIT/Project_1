import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { attendancesKey } from '@/features/Management_Services/attendance/api/attendances';
import { lessonsKey } from '@/features/Management_Services/study-week/api/lessons';
import { parseApiError } from '@/utils/api-errors';
import type {
  RecordAttendance,
  RecordAttendanceWeeklySummary,
  ReqCreateRecordAttendanceDTO,
  ReqUpdateRecordAttendanceDTO,
} from '@/features/Management_Services/attendance/types';

const RECORD_ATTENDANCES_BASE = '/api/v1/record-attendances';
export const recordAttendancesKey = ['record-attendances'] as const;

export type RecordAttendanceWeeklySummaryParams = {
  schoolYear: number;
  weekNumber: number;
};

export type SaveRecordAttendanceInput = {
  raAttdUuid?: string;
  body: ReqCreateRecordAttendanceDTO;
};

function buildWeeklySummaryParams(params: RecordAttendanceWeeklySummaryParams) {
  return new URLSearchParams({
    schoolYear: String(params.schoolYear),
    weekNumber: String(params.weekNumber),
  }).toString();
}

function normalizeErrorText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function isDuplicateRecordAttendanceError(message: string) {
  const normalized = normalizeErrorText(message);
  return normalized.includes('da co record attendance') || normalized.includes('nhan su da co record attendance');
}

function findRecordAttendanceByPair(
  records: RecordAttendance[],
  userUuid: string,
  lessonUuid: string,
) {
  return records.find(
    (record) => record.user?.user_uuid === userUuid && record.lesson?.lesson_uuid === lessonUuid,
  );
}

function invalidateRecordAttendanceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: recordAttendancesKey });
  queryClient.invalidateQueries({ queryKey: attendancesKey });
  queryClient.invalidateQueries({ queryKey: lessonsKey });
}

export function getRecordAttendances() {
  return apiClient.get<RecordAttendance[]>(RECORD_ATTENDANCES_BASE);
}

export function getRecordAttendanceById(raAttdUuid: string) {
  return apiClient.get<RecordAttendance>(`${RECORD_ATTENDANCES_BASE}/${raAttdUuid}`);
}

export function createRecordAttendance(body: ReqCreateRecordAttendanceDTO) {
  return apiClient.post<RecordAttendance>(RECORD_ATTENDANCES_BASE, body);
}

export function updateRecordAttendance(raAttdUuid: string, body: ReqUpdateRecordAttendanceDTO) {
  return apiClient.put<RecordAttendance>(`${RECORD_ATTENDANCES_BASE}/${raAttdUuid}`, body);
}

export async function saveRecordAttendance({ raAttdUuid, body }: SaveRecordAttendanceInput) {
  if (raAttdUuid) {
    return updateRecordAttendance(raAttdUuid, body);
  }

  try {
    return await createRecordAttendance(body);
  } catch (error) {
    const parsedError = parseApiError(error);
    if (!isDuplicateRecordAttendanceError(parsedError.message)) {
      throw error;
    }

    const records = await getRecordAttendances();
    const existingRecord = findRecordAttendanceByPair(records, body.userUuid, body.lessonUuid);
    if (!existingRecord?.ra_attd_uuid) {
      throw error;
    }

    return updateRecordAttendance(existingRecord.ra_attd_uuid, body);
  }
}

export function deleteRecordAttendance(raAttdUuid: string) {
  return apiClient.delete<void>(`${RECORD_ATTENDANCES_BASE}/${raAttdUuid}`);
}

export function getRecordAttendanceWeeklySummary(params: RecordAttendanceWeeklySummaryParams) {
  return apiClient.get<RecordAttendanceWeeklySummary[]>(
    `${RECORD_ATTENDANCES_BASE}/weekly-summary?${buildWeeklySummaryParams(params)}`,
  );
}

export function getRecordAttendanceWeeklySummaryByUser(
  userUuid: string,
  params: RecordAttendanceWeeklySummaryParams,
) {
  return apiClient.get<RecordAttendanceWeeklySummary>(
    `${RECORD_ATTENDANCES_BASE}/user/${userUuid}/weekly-summary?${buildWeeklySummaryParams(params)}`,
  );
}

export function exportRecordAttendanceWeeklySummary(params: RecordAttendanceWeeklySummaryParams) {
  return apiClient.get<Blob>(
    `${RECORD_ATTENDANCES_BASE}/weekly-summary/export?${buildWeeklySummaryParams(params)}`,
    {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    },
  );
}

export function useRecordAttendancesQuery() {
  return useQuery({
    queryKey: recordAttendancesKey,
    queryFn: getRecordAttendances,
  });
}

export function useRecordAttendanceDetailQuery(raAttdUuid?: string) {
  return useQuery({
    queryKey: [...recordAttendancesKey, raAttdUuid],
    queryFn: () => getRecordAttendanceById(raAttdUuid ?? ''),
    enabled: Boolean(raAttdUuid),
  });
}

export function useRecordAttendanceWeeklySummaryQuery(params: RecordAttendanceWeeklySummaryParams) {
  return useQuery({
    queryKey: [...recordAttendancesKey, 'weekly-summary', params],
    queryFn: () => getRecordAttendanceWeeklySummary(params),
  });
}

export function useCreateRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ReqCreateRecordAttendanceDTO) => saveRecordAttendance({ body }),
    onSuccess: () => invalidateRecordAttendanceQueries(queryClient),
  });
}

export function useUpdateRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raAttdUuid, body }: { raAttdUuid: string; body: ReqUpdateRecordAttendanceDTO }) =>
      updateRecordAttendance(raAttdUuid, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([...recordAttendancesKey, variables.raAttdUuid], data);
      invalidateRecordAttendanceQueries(queryClient);
    },
  });
}

export function useSaveRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveRecordAttendance,
    onSuccess: (data) => {
      if (data.ra_attd_uuid) {
        queryClient.setQueryData([...recordAttendancesKey, data.ra_attd_uuid], data);
      }
      invalidateRecordAttendanceQueries(queryClient);
    },
  });
}

export function useDeleteRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecordAttendance,
    onSuccess: (_data, raAttdUuid) => {
      queryClient.removeQueries({ queryKey: [...recordAttendancesKey, raAttdUuid] });
      invalidateRecordAttendanceQueries(queryClient);
    },
  });
}

export function useExportRecordAttendanceWeeklySummary() {
  return useMutation({
    mutationFn: exportRecordAttendanceWeeklySummary,
  });
}

export function useToggleRecordAttendance() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (body: ReqCreateRecordAttendanceDTO) => saveRecordAttendance({ body }),
    onSuccess: () => invalidateRecordAttendanceQueries(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecordAttendance,
    onSuccess: () => invalidateRecordAttendanceQueries(queryClient),
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
