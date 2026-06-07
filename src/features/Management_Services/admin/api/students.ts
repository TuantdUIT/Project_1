import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { buildPageQuery, type PaginatedResult } from '@/utils/pagination';
import type {
  ReqManagerCreateStudentDTO,
  ReqManagerUpdateStudentDTO,
  ResStudentDTO,
  StudentStatus,
} from '@/features/Management_Services/admin/types';

export type StudentsQueryParams = {
  studentStatus?: StudentStatus;
  schoolYear?: number;
  page?: number;
  size?: number;
};

export function getStudents({
  studentStatus = 'ACTIVE',
  schoolYear,
  page = 1,
  size = 10,
}: StudentsQueryParams = {}) {
  const params = buildPageQuery({ page, size });

  params.set('studentStatus', studentStatus);

  if (schoolYear) {
    params.set('schoolYear', String(schoolYear));
  }

  return apiClient.get<PaginatedResult<ResStudentDTO>>(`/api/v1/manager/students?${params.toString()}`);
}

export function getStudentByUuid(userUuid: string) {
  return apiClient.get<ResStudentDTO>(`/api/v1/manager/student/register/${userUuid}`);
}

export function getStudentByStudentId(studentId: string, schoolYear: number) {
  const params = new URLSearchParams({ studentID: studentId, schoolYear: String(schoolYear) });
  return apiClient.get<ResStudentDTO>(`/api/v1/manager/student/register?${params.toString()}`);
}

export function createStudent(body: ReqManagerCreateStudentDTO) {
  return apiClient.post<ResStudentDTO>('/api/v1/manager/student/register', body);
}

export function updateStudentByUuid(userUuid: string, body: ReqManagerUpdateStudentDTO) {
  return apiClient.put<ResStudentDTO>(`/api/v1/manager/student/register/${userUuid}`, body);
}

export function useStudentsQuery(params: StudentsQueryParams) {
  return useQuery({
    queryKey: ['admin', 'students', params],
    queryFn: () => getStudents(params),
  });
}

export function useStudentByUuidQuery(userUuid?: string) {
  return useQuery({
    queryKey: ['admin', 'students', userUuid],
    queryFn: () => getStudentByUuid(userUuid ?? ''),
    enabled: Boolean(userUuid),
  });
}

export function useStudentByStudentIdQuery(studentId?: string, schoolYear?: number) {
  return useQuery({
    queryKey: ['admin', 'students', 'by-student-id', studentId, schoolYear],
    queryFn: () => getStudentByStudentId(studentId ?? '', schoolYear ?? 0),
    enabled: Boolean(studentId) && Boolean(schoolYear),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tham-sos'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] });
    },
  });
}

export function useUpdateStudentByUuid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userUuid, body }: { userUuid: string; body: ReqManagerUpdateStudentDTO }) =>
      updateStudentByUuid(userUuid, body),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['admin', 'students', variables.userUuid], data);
      if (data.student_id != null && data.school_year != null) {
        queryClient.setQueryData(
          ['admin', 'students', 'by-student-id', data.student_id, data.school_year],
          data,
        );
      }
      queryClient.invalidateQueries({
        queryKey: ['admin', 'students'],
        predicate: (query) => typeof query.queryKey[2] === 'object' && query.queryKey[2] !== null,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tham-sos'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum', 'grades'] });
    },
  });
}
