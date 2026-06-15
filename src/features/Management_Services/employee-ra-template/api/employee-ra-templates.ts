import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  EmployeeRATemplate,
  ReqCreateEmployeeRATemplate,
  ReqUpdateEmployeeRATemplate,
} from '@/features/Management_Services/employee-ra-template/types';

const EMPLOYEE_RA_TEMPLATES_BASE = '/api/v1/employee-ra-templates';
const employeeRATemplatesKey = ['employee-ra-template'] as const;

export const employeeRATemplateByTimetableTemplateKey = (ttUuid?: string) =>
  [...employeeRATemplatesKey, 'by-tt', ttUuid] as const;

export function getEmployeeRATemplates() {
  return apiClient.get<EmployeeRATemplate[]>(EMPLOYEE_RA_TEMPLATES_BASE);
}

export function getEmployeeRATemplateByTimetableTemplateId(ttUuid: string) {
  return apiClient.get<EmployeeRATemplate>(
    `${EMPLOYEE_RA_TEMPLATES_BASE}/timetable-template/${ttUuid}`,
  );
}

export function createEmployeeRATemplate(body: ReqCreateEmployeeRATemplate) {
  return apiClient.post<EmployeeRATemplate>(EMPLOYEE_RA_TEMPLATES_BASE, body);
}

export function updateEmployeeRATemplate(templateUuid: string, body: ReqUpdateEmployeeRATemplate) {
  return apiClient.put<EmployeeRATemplate>(`${EMPLOYEE_RA_TEMPLATES_BASE}/${templateUuid}`, body);
}

export function deleteEmployeeRATemplate(templateUuid: string) {
  return apiClient.delete<void>(`${EMPLOYEE_RA_TEMPLATES_BASE}/${templateUuid}`);
}

export function useEmployeeRATemplatesQuery() {
  return useQuery({
    queryKey: [...employeeRATemplatesKey, 'all'],
    queryFn: getEmployeeRATemplates,
  });
}

export function useEmployeeRATemplateByTimetableTemplate(ttUuid?: string) {
  return useQuery({
    queryKey: employeeRATemplateByTimetableTemplateKey(ttUuid),
    queryFn: () => getEmployeeRATemplateByTimetableTemplateId(ttUuid ?? ''),
    enabled: Boolean(ttUuid),
    retry: false,
  });
}

export function useCreateEmployeeRATemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmployeeRATemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeRATemplatesKey }),
  });
}

export function useUpdateEmployeeRATemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateUuid, body }: { templateUuid: string; body: ReqUpdateEmployeeRATemplate }) =>
      updateEmployeeRATemplate(templateUuid, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeRATemplatesKey }),
  });
}

export function useDeleteEmployeeRATemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployeeRATemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeRATemplatesKey }),
  });
}
