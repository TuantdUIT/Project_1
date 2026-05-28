import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { components } from '@/types/openapi_MS';

export type StudentRegisterRequest = components['schemas']['ReqStudentRegisterDTO'];
export type StudentRegisterResponse = components['schemas']['ResStudentDTO'];

export function useStudentRegister() {
  return useMutation({
    mutationFn: (body: StudentRegisterRequest) =>
      apiClient.post<StudentRegisterResponse>('/api/v1/student/register', body),
  });
}
